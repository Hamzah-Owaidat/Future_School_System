"use client";

import React, { useEffect, useMemo, useState } from "react";
import { coursesApi, type Course, type CreateCourseDTO, type UpdateCourseDTO } from "@/lib/api/courses";
import { ReusableTable, type Column, type ActionHandlers } from "@/components/tables/ReusableTable";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { ToggleSwitch } from "@/components/ui/toggle/ToggleSwitch";

type CourseFormState = {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
};

const initialFormState: CourseFormState = {
  name: "",
  code: "",
  description: "",
  is_active: true,
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formState, setFormState] = useState<CourseFormState>(initialFormState);
  const { showToast } = useToast();

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await coursesApi.getAll({ limit: 200, show_all: false });
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses", error);
      showToast({
        type: "error",
        message: "Failed to load courses.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCourses();
  }, []);

  const openAddModal = () => {
    setFormState(initialFormState);
    setSelectedCourse(null);
    setIsAddOpen(true);
  };

  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setFormState({
      name: course.name ?? "",
      code: course.code ?? "",
      description: course.description ?? "",
      is_active: course.is_active === 1,
    });
    setIsEditOpen(true);
  };

  const openViewModal = (course: Course) => {
    setSelectedCourse(course);
    setIsViewOpen(true);
  };

  const closeAllModals = () => {
    setIsAddOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);
    setSelectedCourse(null);
    setFormState(initialFormState);
  };

  const handleChange = (field: keyof CourseFormState, value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: CreateCourseDTO = {
        name: formState.name.trim(),
        code: formState.code.trim(),
        description: formState.description.trim() || null,
      };

      const created = await coursesApi.create(payload);
      // Optimistic update
      setCourses((prev) => [...prev, created]);
      showToast({
        type: "success",
        message: "Course created successfully.",
      });
      closeAllModals();
      // Refetch to ensure sync with backend
      void fetchCourses();
    } catch (error) {
      console.error("Failed to create course", error);
      showToast({
        type: "error",
        message: "Failed to create course.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setIsSubmitting(true);
    try {
      const payload: UpdateCourseDTO = {
        name: formState.name.trim() || undefined,
        code: formState.code.trim() || undefined,
        description: formState.description.trim() || null,
        is_active: formState.is_active ? 1 : 0,
      };

      const updated = await coursesApi.update(selectedCourse.id, payload);
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast({
        type: "success",
        message: "Course updated successfully.",
      });
      closeAllModals();
      void fetchCourses();
    } catch (error) {
      console.error("Failed to update course", error);
      showToast({
        type: "error",
        message: "Failed to update course.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (courseId: number, isActive: boolean) => {
    try {
      const updated = await coursesApi.updateStatus(courseId, isActive);
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast({
        type: "success",
        message: `Course ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error) {
      console.error("Failed to update course status", error);
      showToast({
        type: "error",
        message: "Failed to update course status.",
      });
    }
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Are you sure you want to delete course "${course.name}"?`)) {
      return;
    }

    try {
      await coursesApi.delete(course.id);
      // Soft delete expected on backend; refetch to reflect is_active flag
      showToast({
        type: "success",
        message: "Course deleted successfully.",
      });
      void fetchCourses();
    } catch (error) {
      console.error("Failed to delete course", error);
      showToast({
        type: "error",
        message: "Failed to delete course.",
      });
    }
  };

  const columns: Column<Course>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
      },
      {
        key: "code",
        label: "Code",
        sortable: true,
      },
      {
        key: "description",
        label: "Description",
        render: (value: string | null) =>
          value ? (
            <span className="line-clamp-2 text-gray-600 dark:text-gray-300">{value}</span>
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
      {
        key: "is_active",
        label: "Active",
        sortable: true,
        width: "100px",
        minWidth: "100px",
        render: (value: number, row: Course) => (
          <div className="flex justify-center">
            <ToggleSwitch
              checked={value === 1}
              onChange={(checked) => {
                handleToggleActive(row.id, checked);
              }}
            />
          </div>
        ),
      },
    ],
    []
  );

  const actions: ActionHandlers<Course> = useMemo(
    () => ({
      onView: openViewModal,
      onEdit: openEditModal,
      onDelete: handleDelete,
    }),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Courses</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage the list of courses offered at FuturSchool.
          </p>
        </div>
        <Button type="button" onClick={openAddModal} size="sm">
          Add Course
        </Button>
      </div>

      <ReusableTable
        data={courses}
        columns={columns}
        actions={actions}
        rowsPerPage={5}
      />

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={closeAllModals}
        className="max-w-[700px] m-4 p-6 lg:p-10"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--theme-text-primary)" }}
            >
              Add Course
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--theme-text-secondary)" }}
            >
              Fill in the details to add a new course to the system.
            </p>
          </div>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Course Name"
                  placeholder="e.g. Mathematics"
                  required
                  value={formState.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Course Code"
                  placeholder="e.g. MATH101"
                  required
                  value={formState.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <TextArea
                  name="description"
                  label="Description"
                  placeholder="Optional description"
                  defaultValue={formState.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeAllModals}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={closeAllModals}
        className="max-w-[700px] m-4 p-6 lg:p-10"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--theme-text-primary)" }}
            >
              Edit Course
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--theme-text-secondary)" }}
            >
              Update course information and status.
            </p>
          </div>
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Course Name"
                  placeholder="e.g. Mathematics"
                  required
                  value={formState.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Course Code"
                  placeholder="e.g. MATH101"
                  required
                  value={formState.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <TextArea
                  name="description"
                  label="Description"
                  placeholder="Optional description"
                  defaultValue={formState.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    checked={formState.is_active}
                    onChange={(e) => handleChange("is_active", e.target.checked)}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeAllModals}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Course Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={closeAllModals}
        className="max-w-[600px] m-4 p-6 lg:p-8"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-4">
            <h2
              className="text-xl font-semibold mb-1"
              style={{ color: "var(--theme-text-primary)" }}
            >
              Course Details
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--theme-text-secondary)" }}
            >
              Basic information about this course.
            </p>
          </div>
          {selectedCourse ? (
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
              <div>
                <span className="font-medium">Name: </span>
                <span>{selectedCourse.name}</span>
              </div>
              <div>
                <span className="font-medium">Code: </span>
                <span>{selectedCourse.code}</span>
              </div>
              <div>
                <span className="font-medium">Description: </span>
                <span>{selectedCourse.description || "-"}</span>
              </div>
              <div>
                <span className="font-medium">Status: </span>
                <span>{selectedCourse.is_active === 1 ? "Active" : "Inactive"}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No course selected.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}



