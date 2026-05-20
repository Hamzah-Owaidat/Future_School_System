"use client";

import React, { useEffect, useState } from "react";
import { ReusableTable, Column, ActionHandlers } from "@/components/tables/ReusableTable";
import { ToggleSwitch } from "@/components/ui/toggle/ToggleSwitch";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SelectInput from "@/components/form/SelectInput";
import { studentsApi, Student, CreateStudentDTO, UpdateStudentDTO } from "@/lib/api/students";
import { classesApi, Class } from "@/lib/api/classes";
import { useToast } from "@/components/ui/toast/ToastProvider";

// Format date helper
const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const addModal = useModal();
  const editModal = useModal();
  const viewModal = useModal();

  // Fetch students and classes from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [studentsData, classesData] = await Promise.all([
          studentsApi.getAll({ show_all: false }),
          classesApi.getAll({ show_all: false }),
        ]);
        setStudents(studentsData);
        setClasses(classesData);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError(err?.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const refetchStudents = async () => {
    const data = await studentsApi.getAll({ show_all: false });
    setStudents(data);
  };

  // Handle toggle active status
  const handleToggleActive = (studentId: number, newStatus: boolean) => {
    // Optimistic UI update
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, is_active: newStatus ? 1 : 0 }
          : student
      )
    );

    // Persist change to API
    studentsApi
      .updateStatus(studentId, newStatus)
      .catch((err) => {
        console.error("Failed to update student status:", err);
        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? { ...student, is_active: newStatus ? 0 : 1 }
              : student
          )
        );
        showToast({
          type: "error",
          message: err?.message || "Failed to update student status",
        });
      });
  };

  // Handle add student
  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsEditMode(false);
    addModal.openModal();
  };

  // Handle edit student
  const handleEditStudent = async (student: Student) => {
    try {
      setIsEditMode(true);
      // Fetch full student details to ensure we have all fields
      const details = await studentsApi.getById(student.id);
      setSelectedStudent(details);
      editModal.openModal();
    } catch (err: any) {
      console.error("Failed to load student details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load student details",
      });
    }
  };

  // Handle view student
  const handleViewStudent = async (student: Student) => {
    try {
      // Fetch full student details
      const details = await studentsApi.getById(student.id);
      setViewStudent(details);
      viewModal.openModal();
    } catch (err: any) {
      console.error("Failed to load student details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load student details",
      });
    }
  };

  // Handle save student (both add and edit)
  const handleSaveStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const saveStudent = async () => {
      try {
        setIsSaving(true);
        setError(null);

        // Format the payload according to API requirements
        const basePayload: CreateStudentDTO = {
          student_code: (formData.get("student_code") as string) || "",
          first_name: (formData.get("first_name") as string) || "",
          last_name: (formData.get("last_name") as string) || "",
          email: (formData.get("email") as string) || null,
          phone: (formData.get("phone") as string) || null,
          date_of_birth: (formData.get("date_of_birth") as string) || "",
          gender: (formData.get("gender") as string) || "other",
          address: (formData.get("address") as string) || null,
          parent_name: (formData.get("parent_name") as string) || null,
          parent_phone: (formData.get("parent_phone") as string) || null,
          parent_email: (formData.get("parent_email") as string) || null,
          enrollment_date: (formData.get("enrollment_date") as string) || "",
          class_id: formData.get("class_id")
            ? parseInt(formData.get("class_id") as string, 10)
            : null,
        };

        if (isEditMode && selectedStudent) {
          // Update existing student
          const updatePayload: UpdateStudentDTO = { ...basePayload };
          const updated = await studentsApi.update(selectedStudent.id, updatePayload);

          // Refetch students to ensure we have complete data
          try {
            const refreshedStudents = await studentsApi.getAll({ show_all: false });
            setStudents(refreshedStudents);
          } catch (refreshError) {
            console.warn("Failed to refresh students list:", refreshError);
            // Fallback: Update optimistically
            setStudents((prev) =>
              prev.map((stu) => (stu.id === updated.id ? updated : stu))
            );
          }

          editModal.closeModal();
          setSelectedStudent(null);
          setIsEditMode(false);
        } else {
          // Create new student
          await studentsApi.create(basePayload);
          await refetchStudents();
          addModal.closeModal();
          form.reset();
        }
      } catch (err: any) {
        console.error("Failed to save student:", err);
        setError(err?.message || "Failed to save student");
        showToast({
          type: "error",
          message: err?.message || "Failed to save student",
        });
      } finally {
        setIsSaving(false);
      }
    };

    void saveStudent();
  };

  // Column definitions
  const columns: Column<Student>[] = [
    {
      key: "student_code",
      label: "Student Code",
      sortable: true,
      width: "120px",
      minWidth: "120px",
    },
    {
      key: "first_name",
      label: "First Name",
      sortable: true,
      width: "130px",
      minWidth: "130px",
    },
    {
      key: "last_name",
      label: "Last Name",
      sortable: true,
      width: "130px",
      minWidth: "130px",
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      width: "220px",
      minWidth: "200px",
      maxWidth: "280px",
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      width: "140px",
      minWidth: "140px",
    },
    {
      key: "date_of_birth",
      label: "Date of Birth",
      sortable: true,
      width: "130px",
      minWidth: "130px",
      render: (value) => formatDate(value),
    },
    {
      key: "gender",
      label: "Gender",
      sortable: true,
      width: "100px",
      minWidth: "100px",
      render: (value) => (
        <span className="capitalize">{value}</span>
      ),
    },
    {
      key: "address",
      label: "Address",
      sortable: true,
      width: "180px",
      minWidth: "150px",
      maxWidth: "250px",
    },
    {
      key: "parent_name",
      label: "Parent Name",
      sortable: true,
      width: "150px",
      minWidth: "150px",
    },
    {
      key: "parent_phone",
      label: "Parent Phone",
      sortable: true,
      width: "140px",
      minWidth: "140px",
    },
    {
      key: "parent_email",
      label: "Parent Email",
      sortable: true,
      width: "200px",
      minWidth: "180px",
      maxWidth: "250px",
    },
    {
      key: "enrollment_date",
      label: "Enrollment Date",
      sortable: true,
      width: "150px",
      minWidth: "150px",
      render: (value) => formatDate(value),
    },
    {
      key: "class_name",
      label: "Class",
      sortable: true,
      width: "150px",
      minWidth: "150px",
      render: (value, row) => (
        <span>
          {value} ({row.class_code})
        </span>
      ),
    },
    {
      key: "grade_level",
      label: "Grade",
      sortable: true,
      width: "100px",
      minWidth: "100px",
    },
    {
      key: "is_active",
      label: "Active",
      sortable: true,
      width: "100px",
      minWidth: "100px",
      render: (value, row) => (
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
  ];

  // Handle delete student
  const handleDeleteStudent = (student: Student) => {
    if (
      confirm(
        `Are you sure you want to delete ${student.first_name} ${student.last_name}? This will deactivate the student.`
      )
    ) {
      const deleteStudent = async () => {
        try {
          await studentsApi.delete(student.id);
          setStudents((prev) => prev.filter((stu) => stu.id !== student.id));
        } catch (err: any) {
          console.error("Failed to delete student:", err);
          showToast({
            type: "error",
            message: err?.message || "Failed to delete student",
          });
        }
      };

      void deleteStudent();
    }
  };

  // Action handlers
  const actions: ActionHandlers<Student> = {
    onView: (student) => {
      handleViewStudent(student);
    },
    onEdit: (student) => {
      handleEditStudent(student);
    },
    onDelete: (student) => {
      handleDeleteStudent(student);
    },
    onCopyId: (student) => {
      // Copy student code to clipboard
      navigator.clipboard.writeText(student.student_code);
      navigator.clipboard.writeText(student.student_code);
      showToast({
        type: "success",
        message: `Copied: ${student.student_code}`,
      });
    },
    customActions: [
      {
        label: "View Grades",
        onClick: (student) => {
          window.location.href = `/dashboard/students/${student.id}/grades`;
        },
      },
    ],
  };

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--theme-text-primary)" }}>
            Students
          </h1>
          <p className="text-theme-sm mt-1" style={{ color: "var(--theme-text-secondary)" }}>
            Manage and view all students in the system
          </p>
        </div>
        <Button onClick={handleAddStudent} size="md" variant="primary">
          Add Student
        </Button>
      </div>

      {/* Students Table */}
      {error && (
        <p className="text-sm" style={{ color: "var(--theme-text-error, #f04438)" }}>
          {error}
        </p>
      )}
      <ReusableTable
        data={students}
        columns={columns}
        actions={actions}
      />

      {/* Add Student Modal */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        className="max-w-[700px] m-4 p-6 lg:p-10"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              Add Student
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              Fill in the details to add a new student to the system.
            </p>
          </div>
          <form onSubmit={handleSaveStudent} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="student_code">Student Code</Label>
                <Input type="text" name="student_code" placeholder="e.g. STU001" required />
              </div>
              <div>
                <Label htmlFor="class_id">Class</Label>
                <SelectInput
                  name="class_id"
                  options={classes.map((cls) => ({
                    value: cls.id,
                    label: `${cls.class_name} (${cls.class_code})`,
                  }))}
                  placeholder="Select class (optional)"
                />
              </div>
              <div>
                <Label>First Name</Label>
                <Input type="text" name="first_name" placeholder="Enter first name" required />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input type="text" name="last_name" placeholder="Enter last name" required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" name="email" placeholder="Enter email address" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="text" name="phone" placeholder="Enter phone number" />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" name="date_of_birth" required />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <SelectInput
                  name="gender"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                  placeholder="Select gender"
                  defaultValue="other"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input type="text" name="address" placeholder="Enter address" />
              </div>
              <div>
                <Label>Parent Name</Label>
                <Input type="text" name="parent_name" placeholder="Enter parent name" />
              </div>
              <div>
                <Label>Parent Phone</Label>
                <Input type="text" name="parent_phone" placeholder="Enter parent phone" />
              </div>
              <div>
                <Label>Parent Email</Label>
                <Input type="email" name="parent_email" placeholder="Enter parent email" />
              </div>
              <div>
                <Label>Enrollment Date</Label>
                <Input type="date" name="enrollment_date" required />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={addModal.closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? "Adding..." : "Add Student"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        className="max-w-[700px] m-4 p-6 lg:p-10"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              Edit Student
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              Update the student information below.
            </p>
          </div>
          <form onSubmit={handleSaveStudent} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="student_code">Student Code</Label>
                <Input 
                  type="text" 
                  name="student_code" 
                  defaultValue={selectedStudent?.student_code || ""} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="class_id">Class</Label>
                <SelectInput
                  name="class_id"
                  options={classes.map((cls) => ({
                    value: cls.id,
                    label: `${cls.class_name} (${cls.class_code})`,
                  }))}
                  placeholder="Select class (optional)"
                  defaultValue={
                    selectedStudent?.class_id !== undefined && selectedStudent?.class_id !== null
                      ? selectedStudent.class_id
                      : ""
                  }
                />
              </div>
              <div>
                <Label>First Name</Label>
                <Input 
                  type="text" 
                  name="first_name" 
                  defaultValue={selectedStudent?.first_name || ""} 
                  required 
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input 
                  type="text" 
                  name="last_name" 
                  defaultValue={selectedStudent?.last_name || ""} 
                  required 
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email" 
                  name="email" 
                  defaultValue={selectedStudent?.email || ""} 
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  type="text" 
                  name="phone" 
                  defaultValue={selectedStudent?.phone || ""} 
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input 
                  type="date" 
                  name="date_of_birth" 
                  defaultValue={selectedStudent?.date_of_birth ? new Date(selectedStudent.date_of_birth).toISOString().split('T')[0] : ""} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <SelectInput
                  name="gender"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                  placeholder="Select gender"
                  defaultValue={selectedStudent?.gender || "other"}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input 
                  type="text" 
                  name="address" 
                  defaultValue={selectedStudent?.address || ""} 
                />
              </div>
              <div>
                <Label>Parent Name</Label>
                <Input 
                  type="text" 
                  name="parent_name" 
                  defaultValue={selectedStudent?.parent_name || ""} 
                />
              </div>
              <div>
                <Label>Parent Phone</Label>
                <Input 
                  type="text" 
                  name="parent_phone" 
                  defaultValue={selectedStudent?.parent_phone || ""} 
                />
              </div>
              <div>
                <Label>Parent Email</Label>
                <Input 
                  type="email" 
                  name="parent_email" 
                  defaultValue={selectedStudent?.parent_email || ""} 
                />
              </div>
              <div>
                <Label>Enrollment Date</Label>
                <Input 
                  type="date" 
                  name="enrollment_date" 
                  defaultValue={selectedStudent?.enrollment_date ? new Date(selectedStudent.enrollment_date).toISOString().split('T')[0] : ""} 
                  required 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={editModal.closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? "Updating..." : "Update Student"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Student Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={viewModal.closeModal}
        className="max-w-[800px] m-4 p-6 lg:p-8"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--theme-text-primary)" }}>
              {viewStudent?.first_name} {viewStudent?.last_name}
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              Student Code: {viewStudent?.student_code}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Email</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewStudent?.email || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Phone</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewStudent?.phone || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Date of Birth</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewStudent?.date_of_birth ? formatDate(viewStudent.date_of_birth) : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Gender</div>
              <div className="font-medium capitalize" style={{ color: "var(--theme-text-primary)" }}>
                {viewStudent?.gender || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Enrollment Date</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewStudent?.enrollment_date ? formatDate(viewStudent.enrollment_date) : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Class</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewStudent?.class_name ? `${viewStudent.class_name} (${viewStudent.class_code})` : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Grade Level</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewStudent?.grade_level || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Status</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    viewStudent?.is_active === 1
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {viewStudent?.is_active === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {viewStudent?.address && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
                Address
              </h3>
              <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
                <p className="text-sm" style={{ color: "var(--theme-text-primary)" }}>
                  {viewStudent.address}
                </p>
              </div>
            </div>
          )}

          {(viewStudent?.parent_name || viewStudent?.parent_phone || viewStudent?.parent_email) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
                Parent Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {viewStudent?.parent_name && (
                  <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Parent Name</div>
                    <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                      {viewStudent.parent_name}
                    </div>
                  </div>
                )}
                {viewStudent?.parent_phone && (
                  <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Parent Phone</div>
                    <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                      {viewStudent.parent_phone}
                    </div>
                  </div>
                )}
                {viewStudent?.parent_email && (
                  <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Parent Email</div>
                    <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                      {viewStudent.parent_email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={viewModal.closeModal}>
              Close
            </Button>
            {viewStudent && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  viewModal.closeModal();
                  handleEditStudent(viewStudent);
                }}
              >
                Edit Student
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}


