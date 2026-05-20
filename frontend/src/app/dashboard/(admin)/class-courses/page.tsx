"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ReusableTable, type Column, type ActionHandlers } from "@/components/tables/ReusableTable";
import Button from "@/components/ui/button/Button";
import SelectInput from "@/components/form/SelectInput";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { ToggleSwitch } from "@/components/ui/toggle/ToggleSwitch";
import { classCoursesApi, type ClassCourse, type CreateClassCourseDTO, type UpdateClassCourseDTO } from "@/lib/api/classCourses";
import { classesApi, type Class } from "@/lib/api/classes";
import { coursesApi, type Course } from "@/lib/api/courses";
import { employeeApi, type Employee } from "@/lib/api/employees";
import { useAuth } from "@/context/AuthContext";

type Filters = {
  academic_year: string;
  class_id: string;
  course_id: string;
  teacher_id: string;
  is_active: string;
};

const initialFilters: Filters = {
  academic_year: "",
  class_id: "",
  course_id: "",
  teacher_id: "",
  is_active: "all",
};

type AssignmentFormState = {
  academic_year: string;
  class_id: string;
  course_id: string;
  teacher_id: string;
  is_active: boolean;
};

const initialFormState: AssignmentFormState = {
  academic_year: "",
  class_id: "",
  course_id: "",
  teacher_id: "",
  is_active: true,
};

export default function ClassCoursesPage() {
  const [assignments, setAssignments] = useState<ClassCourse[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ClassCourse | null>(null);
  const [formState, setFormState] = useState<AssignmentFormState>(initialFormState);

  const { user } = useAuth();
  const { showToast } = useToast();

  const isAdminOrPrincipal =
    user?.role_name?.toLowerCase() === "admin" || user?.role_name?.toLowerCase() === "principal";
  const isTeacher = user?.role_name?.toLowerCase() === "teacher";

  const effectiveTeacherId = useMemo(() => {
    if (isTeacher && user?.id) {
      return user.id;
    }
    return filters.teacher_id ? parseInt(filters.teacher_id, 10) : undefined;
  }, [filters.teacher_id, isTeacher, user]);

  const loadReferenceData = async () => {
    try {
      const [classesData, coursesData, employeesData] = await Promise.all([
        classesApi.getAll({ show_all: false }),
        coursesApi.getAll({ show_all: false }),
        employeeApi.getAll({ show_all: false }),
      ]);

      setClasses(classesData);
      setCourses(coursesData);

      // Only employees with teacher role for assignments
      const teacherEmployees = employeesData.filter((emp) =>
        emp.role_name?.toLowerCase() === "teacher"
      );
      setTeachers(teacherEmployees);
    } catch (error) {
      console.error("Failed to load reference data", error);
      showToast({
        type: "error",
        message: "Failed to load classes, courses, or teachers.",
      });
    }
  };

  const loadAssignments = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        show_all: false, // Exclude deleted records
      };
      if (filters.academic_year) params.academic_year = filters.academic_year;
      if (filters.class_id) params.class_id = parseInt(filters.class_id, 10);
      if (filters.course_id) params.course_id = parseInt(filters.course_id, 10);
      if (effectiveTeacherId) params.teacher_id = effectiveTeacherId;
      if (filters.is_active !== "all") {
        params.is_active = filters.is_active === "true";
      }

      const data = await classCoursesApi.getAll(params);
      setAssignments(data);
    } catch (error) {
      console.error("Failed to load class-course assignments", error);
      showToast({
        type: "error",
        message: "Failed to load assignments.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReferenceData();
  }, []);

  // Load assignments when filters change
  useEffect(() => {
    void loadAssignments();
  }, [filters.academic_year, filters.class_id, filters.course_id, filters.is_active, effectiveTeacherId]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openAddModal = () => {
    setFormState({
      ...initialFormState,
      academic_year: filters.academic_year || "",
      class_id: filters.class_id || "",
      course_id: filters.course_id || "",
      teacher_id: effectiveTeacherId ? String(effectiveTeacherId) : "",
      is_active: true,
    });
    setSelectedAssignment(null);
    setIsAddOpen(true);
  };

  const openEditModal = (assignment: ClassCourse) => {
    setSelectedAssignment(assignment);
    setFormState({
      academic_year: assignment.academic_year || "",
      class_id: String(assignment.class_id),
      course_id: String(assignment.course_id),
      teacher_id: String(assignment.teacher_id),
      is_active: assignment.is_active === 1,
    });
    setIsEditOpen(true);
  };

  const openViewModal = (assignment: ClassCourse) => {
    setSelectedAssignment(assignment);
    setIsViewOpen(true);
  };

  const closeAllModals = () => {
    setIsAddOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);
    setSelectedAssignment(null);
    setFormState(initialFormState);
  };

  const handleFormChange = (field: keyof AssignmentFormState, value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formState.academic_year.trim()) {
        showToast({
          type: "error",
          message: "Academic year is required.",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formState.class_id || formState.class_id === "") {
        showToast({
          type: "error",
          message: "Class is required.",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formState.course_id || formState.course_id === "") {
        showToast({
          type: "error",
          message: "Course is required.",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formState.teacher_id || formState.teacher_id === "") {
        showToast({
          type: "error",
          message: "Teacher is required.",
        });
        setIsSubmitting(false);
        return;
      }

      const classId = parseInt(formState.class_id, 10);
      const courseId = parseInt(formState.course_id, 10);
      const teacherId = parseInt(formState.teacher_id, 10);

      // Validate that parsing resulted in valid numbers
      if (isNaN(classId) || isNaN(courseId) || isNaN(teacherId)) {
        showToast({
          type: "error",
          message: "Please select valid class, course, and teacher.",
        });
        setIsSubmitting(false);
        return;
      }

      const basePayload: CreateClassCourseDTO = {
        academic_year: formState.academic_year.trim(),
        class_id: classId,
        course_id: courseId,
        teacher_id: teacherId,
      };

      if (selectedAssignment) {
        const payload: UpdateClassCourseDTO = {
          ...basePayload,
          is_active: formState.is_active ? 1 : 0,
        };
        const updated = await classCoursesApi.update(selectedAssignment.id, payload);
        setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        showToast({
          type: "success",
          message: "Assignment updated successfully.",
        });
      } else {
        const created = await classCoursesApi.create(basePayload);
        showToast({
          type: "success",
          message: "Assignment created successfully.",
        });
        
        // Update filters to match the newly created assignment so it shows up
        const updatedFilters = {
          ...filters,
          academic_year: created.academic_year || filters.academic_year,
          class_id: String(created.class_id),
          course_id: String(created.course_id),
          teacher_id: String(created.teacher_id),
        };
        setFilters(updatedFilters);
        
        // Refetch with the new assignment's parameters to ensure it shows up
        // Use the updated filter values directly instead of relying on state
        try {
          setIsLoading(true);
          const params: any = {};
          if (created.academic_year) params.academic_year = created.academic_year;
          if (created.class_id) params.class_id = created.class_id;
          if (created.course_id) params.course_id = created.course_id;
          if (created.teacher_id) params.teacher_id = created.teacher_id;
          
          const data = await classCoursesApi.getAll(params);
          setAssignments(data);
        } catch (error) {
          console.error("Failed to reload assignments after create", error);
          // Fallback: try loading with current filters
          await loadAssignments();
        } finally {
          setIsLoading(false);
        }
      }

      if (selectedAssignment) {
        closeAllModals();
        // For updates, refetch with current filters
        await loadAssignments();
      } else {
        closeAllModals();
      }
    } catch (error) {
      console.error("Failed to save assignment", error);
      showToast({
        type: "error",
        message: "Failed to save assignment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (assignment: ClassCourse) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;

    try {
      await classCoursesApi.delete(assignment.id);
      showToast({
        type: "success",
        message: "Assignment deleted successfully.",
      });
      void loadAssignments();
    } catch (error) {
      console.error("Failed to delete assignment", error);
      showToast({
        type: "error",
        message: "Failed to delete assignment.",
      });
    }
  };

  const handleToggleActive = async (assignmentId: number, isActive: boolean) => {
    // Optimistic update: flip in UI immediately
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId ? { ...a, is_active: isActive ? 1 : 0 } : a
      )
    );

    try {
      await classCoursesApi.updateStatus(assignmentId, isActive);
      showToast({
        type: "success",
        message: `Assignment ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error) {
      console.error("Failed to update assignment status", error);
      // Revert optimistic change on error
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId ? { ...a, is_active: isActive ? 0 : 1 } : a
        )
      );
      showToast({
        type: "error",
        message: "Failed to update assignment status.",
      });
    }
  };

  const columns: Column<ClassCourse>[] = useMemo(
    () => [
      {
        key: "academic_year",
        label: "Academic Year",
        sortable: true,
      },
      {
        key: "class_name",
        label: "Class",
        sortable: true,
        render: (_value, row) =>
          row.class_name || row.class_code || `#${row.class_id}`,
      },
      {
        key: "course_name",
        label: "Course",
        sortable: true,
        render: (_value, row) =>
          row.course_name || row.course_code || `#${row.course_id}`,
      },
      {
        key: "teacher_first_name",
        label: "Teacher",
        sortable: true,
        render: (_value, row) => {
          const fullName =
            `${row.teacher_first_name ?? ""} ${row.teacher_last_name ?? ""}`.trim();
          return fullName || row.teacher_code || `#${row.teacher_id}`;
        },
      },
      {
        key: "is_active",
        label: "Active",
        render: (value: number, row: ClassCourse) => (
          <div className="flex justify-center">
            <ToggleSwitch
              checked={value === 1}
              onChange={(checked) => {
                // Only admins/principals can toggle
                if (!isAdminOrPrincipal) return;
                void handleToggleActive(row.id, checked);
              }}
            />
          </div>
        ),
      },
    ],
    []
  );

  const actions: ActionHandlers<ClassCourse> = useMemo(
    () => ({
      onView: openViewModal,
      onEdit: isAdminOrPrincipal ? openEditModal : undefined,
      onDelete: isAdminOrPrincipal ? handleDelete : undefined,
      customActions: [],
    }),
    [isAdminOrPrincipal]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Class–Course Assignments
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Assign teachers to classes and courses for each academic year.
          </p>
        </div>
        {isAdminOrPrincipal && (
          <Button type="button" onClick={openAddModal} size="sm">
            Add Assignment
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <div>
          <Label>Academic Year</Label>
          <Input
            placeholder="e.g. 2024-2025"
            value={filters.academic_year}
            onChange={(e) => handleFilterChange("academic_year", e.target.value)}
          />
        </div>
        <div>
          <Label>Class</Label>
          <SelectInput
            name="filter_class_id"
            placeholder="All classes"
            options={[
              { value: "", label: "All" },
              ...classes.map((cls) => ({
                value: cls.id,
                label: `${cls.class_name} (${cls.class_code})`,
              })),
            ]}
            value={filters.class_id}
            onChange={(e) => handleFilterChange("class_id", e.target.value)}
          />
        </div>
        <div>
          <Label>Course</Label>
          <SelectInput
            name="filter_course_id"
            placeholder="All courses"
            options={[
              { value: "", label: "All" },
              ...courses.map((course) => ({
                value: course.id,
                label: `${course.name} (${course.code})`,
              })),
            ]}
            value={filters.course_id}
            onChange={(e) => handleFilterChange("course_id", e.target.value)}
          />
        </div>
        <div>
          <Label>Teacher</Label>
          <SelectInput
            name="filter_teacher_id"
            placeholder={isTeacher ? "Me" : "All teachers"}
            options={[
              { value: "", label: isTeacher ? "Me" : "All" },
              ...teachers.map((teacher) => ({
                value: teacher.id,
                label: `${teacher.first_name} ${teacher.last_name}`,
              })),
            ]}
            value={isTeacher ? String(user?.id ?? "") : filters.teacher_id}
            onChange={(e) => {
              if (!isTeacher) {
                handleFilterChange("teacher_id", e.target.value);
              }
            }}
            disabled={isTeacher}
          />
        </div>
        <div>
          <Label>Status</Label>
          <SelectInput
            name="filter_status"
            placeholder="All statuses"
            options={[
              { value: "all", label: "All" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            value={filters.is_active}
            onChange={(e) => handleFilterChange("is_active", e.target.value)}
          />
        </div>
      </div>

      {/* Assignments Table */}
      <ReusableTable
        data={assignments}
        columns={columns}
        actions={actions}
        rowsPerPage={5}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={closeAllModals}
        className="max-w-[700px] m-4 p-6 lg:p-8"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--theme-text-primary)" }}
            >
              {selectedAssignment ? "Edit Assignment" : "Add Assignment"}
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--theme-text-secondary)" }}
            >
              Link a class, course, and teacher for a specific academic year.
            </p>
          </div>
          <form onSubmit={handleSaveAssignment} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>Academic Year <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. 2024-2025"
                  required
                  value={formState.academic_year}
                  onChange={(e) =>
                    handleFormChange("academic_year", e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Class <span className="text-red-500">*</span></Label>
                <SelectInput
                  name="class_id"
                  placeholder="Select a class..."
                  required
                  options={classes.map((cls) => ({
                    value: cls.id,
                    label: `${cls.class_name} (${cls.class_code})`,
                  }))}
                  value={formState.class_id || ""}
                  onChange={(e) =>
                    handleFormChange("class_id", e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Course <span className="text-red-500">*</span></Label>
                <SelectInput
                  name="course_id"
                  placeholder="Select a course..."
                  required
                  options={courses.map((course) => ({
                    value: course.id,
                    label: `${course.name} (${course.code})`,
                  }))}
                  value={formState.course_id || ""}
                  onChange={(e) =>
                    handleFormChange("course_id", e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Teacher <span className="text-red-500">*</span></Label>
                <SelectInput
                  name="teacher_id"
                  placeholder="Select a teacher..."
                  required
                  options={teachers.map((teacher) => ({
                    value: teacher.id,
                    label: `${teacher.first_name} ${teacher.last_name}`,
                  }))}
                  value={formState.teacher_id || ""}
                  onChange={(e) =>
                    handleFormChange("teacher_id", e.target.value)
                  }
                />
              </div>
              {selectedAssignment && (
                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      checked={formState.is_active}
                      onChange={(e) =>
                        handleFormChange("is_active", e.target.checked)
                      }
                    />
                    Active
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeAllModals}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? selectedAssignment
                    ? "Updating..."
                    : "Saving..."
                  : selectedAssignment
                  ? "Update"
                  : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={closeAllModals}
        className="max-w-[500px] m-4 p-6 lg:p-8"
      >
        {selectedAssignment ? (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <div>
              <span className="font-medium">Academic Year: </span>
              <span>{selectedAssignment.academic_year}</span>
            </div>
            <div>
              <span className="font-medium">Class: </span>
              <span>
                {selectedAssignment.class_name ||
                  selectedAssignment.class_code ||
                  `#${selectedAssignment.class_id}`}
              </span>
            </div>
            <div>
              <span className="font-medium">Course: </span>
              <span>
                {selectedAssignment.course_name ||
                  selectedAssignment.course_code ||
                  `#${selectedAssignment.course_id}`}
              </span>
            </div>
            <div>
              <span className="font-medium">Teacher: </span>
              <span>
                {`${selectedAssignment.teacher_first_name ?? ""} ${
                  selectedAssignment.teacher_last_name ?? ""
                }`.trim() ||
                  selectedAssignment.teacher_code ||
                  `#${selectedAssignment.teacher_id}`}
              </span>
            </div>
            <div>
              <span className="font-medium">Status: </span>
              <span>
                {selectedAssignment.is_active === 1 ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No assignment selected.
          </p>
        )}
      </Modal>
    </div>
  );
}



