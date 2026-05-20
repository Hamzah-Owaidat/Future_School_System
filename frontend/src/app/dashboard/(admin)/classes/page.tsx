"use client";

import React, { useEffect, useState } from "react";
import { ReusableTable, Column, ActionHandlers } from "@/components/tables/ReusableTable";
import { ToggleSwitch } from "@/components/ui/toggle/ToggleSwitch";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { classesApi, Class, CreateClassDTO, UpdateClassDTO } from "@/lib/api/classes";
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

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [viewClass, setViewClass] = useState<Class | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const addModal = useModal();
  const editModal = useModal();
  const viewModal = useModal();

  // Fetch classes from API
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await classesApi.getAll({ show_all: false });
        setClasses(data);
      } catch (err: any) {
        console.error("Failed to fetch classes:", err);
        setError(err?.message || "Failed to load classes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const refetchClasses = async () => {
    const data = await classesApi.getAll({ show_all: false });
    setClasses(data);
  };

  // Handle toggle active status
  const handleToggleActive = (classId: number, newStatus: boolean) => {
    setClasses((prev) =>
      prev.map((cls) =>
        cls.id === classId ? { ...cls, is_active: newStatus ? 1 : 0 } : cls
      )
    );

    classesApi
      .updateStatus(classId, newStatus)
      .catch((err: any) => {
        console.error("Failed to update class status:", err);
        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === classId ? { ...cls, is_active: newStatus ? 0 : 1 } : cls
          )
        );
        showToast({
          type: "error",
          message: err?.message || "Failed to update class status",
        });
      });
  };

  // Handle add class
  const handleAddClass = () => {
    setSelectedClass(null);
    setIsEditMode(false);
    addModal.openModal();
  };

  // Handle edit class
  const handleEditClass = async (classItem: Class) => {
    try {
      setIsEditMode(true);
      const details = await classesApi.getById(classItem.id);
      setSelectedClass(details);
      editModal.openModal();
    } catch (err: any) {
      console.error("Failed to load class details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load class details",
      });
    }
  };

  // Handle view class
  const handleViewClass = async (classItem: Class) => {
    try {
      const details = await classesApi.getById(classItem.id);
      setViewClass(details);
      viewModal.openModal();
    } catch (err: any) {
      console.error("Failed to load class details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load class details",
      });
    }
  };

  // Handle save class (both add and edit)
  const handleSaveClass = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const saveClass = async () => {
      try {
        setIsSaving(true);
        setError(null);

        const basePayload: CreateClassDTO = {
          class_name: (formData.get("class_name") as string) || "",
          class_code: (formData.get("class_code") as string) || "",
          grade_level: parseInt((formData.get("grade_level") as string) || "0", 10),
          section: ((formData.get("section") as string) || "").trim() || null,
          capacity: formData.get("capacity")
            ? parseInt(formData.get("capacity") as string, 10)
            : undefined,
          room_number: ((formData.get("room_number") as string) || "").trim() || null,
          academic_year: (formData.get("academic_year") as string) || "",
          // teacher_id is optional and not in the current form; can be added later
        };

        if (isEditMode && selectedClass) {
          const updatePayload: UpdateClassDTO = {
            ...basePayload,
          };

          await classesApi.update(selectedClass.id, updatePayload);
          await refetchClasses();

          editModal.closeModal();
          setSelectedClass(null);
          setIsEditMode(false);
        } else {
          await classesApi.create(basePayload);
          await refetchClasses();

          addModal.closeModal();
          form.reset();
        }
      } catch (err: any) {
        console.error("Failed to save class:", err);
        setError(err?.message || "Failed to save class");
        showToast({
          type: "error",
          message: err?.message || "Failed to save class",
        });
      } finally {
        setIsSaving(false);
      }
    };

    void saveClass();
  };

  // Column definitions
  const columns: Column<Class>[] = [
    {
      key: "class_code",
      label: "Class Code",
      sortable: true,
      width: "100px",
      minWidth: "100px",
    },
    {
      key: "class_name",
      label: "Class Name",
      sortable: true,
      width: "150px",
      minWidth: "150px",
    },
    {
      key: "grade_level",
      label: "Grade Level",
      sortable: true,
      width: "110px",
      minWidth: "110px",
    },
    {
      key: "section",
      label: "Section",
      sortable: true,
      width: "100px",
      minWidth: "100px",
    },
    {
      key: "capacity",
      label: "Capacity",
      sortable: true,
      width: "100px",
      minWidth: "100px",
    },
    {
      key: "student_count",
      label: "Students",
      sortable: true,
      width: "100px",
      minWidth: "100px",
      render: (value, row) => (
        <span>
          {value} / {row.capacity}
        </span>
      ),
    },
    {
      key: "room_number",
      label: "Room",
      sortable: true,
      width: "100px",
      minWidth: "100px",
    },
    {
      key: "academic_year",
      label: "Academic Year",
      sortable: true,
      width: "140px",
      minWidth: "140px",
    },
    {
      key: "teacher_first_name",
      label: "Teacher",
      sortable: true,
      width: "180px",
      minWidth: "150px",
      maxWidth: "200px",
      render: (value, row) => (
        <span>
          {row.teacher_first_name} {row.teacher_last_name}
        </span>
      ),
    },
    {
      key: "teacher_code",
      label: "Teacher Code",
      sortable: true,
      width: "120px",
      minWidth: "120px",
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

  // Action handlers
  const actions: ActionHandlers<Class> = {
    onView: (classItem) => {
      handleViewClass(classItem);
    },
    onEdit: (classItem) => {
      handleEditClass(classItem);
    },
    onDelete: (classItem) => {
      if (
        confirm(
          `Are you sure you want to delete ${classItem.class_name}? This will deactivate the class.`
        )
      ) {
        const deleteClass = async () => {
          try {
            await classesApi.delete(classItem.id);
            setClasses((prev) => prev.filter((cls) => cls.id !== classItem.id));
          } catch (err: any) {
            console.error("Failed to delete class:", err);
            showToast({
              type: "error",
              message: err?.message || "Failed to delete class",
            });
          }
        };

        void deleteClass();
      }
    },
    onCopyId: (classItem) => {
      // Copy class code to clipboard
      navigator.clipboard.writeText(classItem.class_code);
      navigator.clipboard.writeText(classItem.class_code);
      showToast({
        type: "success",
        message: `Copied: ${classItem.class_code}`,
      });
    },
    // Example of custom actions - each page can add their own
    customActions: [
      {
        label: "View Students",
        onClick: (classItem) => {
          showToast({
            type: "info",
            message: `Viewing students in: ${classItem.class_name}`,
          });
        },
      },
      {
        label: "Assign Teacher",
        onClick: (classItem) => {
          showToast({
            type: "info",
            message: `Assigning teacher to: ${classItem.class_name}`,
          });
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
            Classes
          </h1>
          <p className="text-theme-sm mt-1" style={{ color: "var(--theme-text-secondary)" }}>
            Manage and view all classes in the system
          </p>
        </div>
        <Button onClick={handleAddClass} size="md" variant="primary">
          Add Class
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm" style={{ color: "var(--theme-text-error, #f04438)" }}>
          {error}
        </p>
      )}

      {/* Classes Table */}
      <ReusableTable data={classes} columns={columns} actions={actions} />

      {/* Add Class Modal */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        className="max-w-[700px] m-4 p-6 lg:p-10"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              Add Class
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              Fill in the details to add a new class to the system.
            </p>
          </div>
          <form onSubmit={handleSaveClass} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>Class Name</Label>
                <Input type="text" name="class_name" placeholder="Enter class name" required />
              </div>
              <div>
                <Label>Class Code</Label>
                <Input type="text" name="class_code" placeholder="Enter class code" required />
              </div>
              <div>
                <Label>Grade Level</Label>
                <Input type="number" name="grade_level" placeholder="Enter grade level" min="1" required />
              </div>
              <div>
                <Label>Section</Label>
                <Input type="text" name="section" placeholder="Enter section" required />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input type="number" name="capacity" placeholder="Enter capacity" min="1" required />
              </div>
              <div>
                <Label>Room Number</Label>
                <Input type="text" name="room_number" placeholder="Enter room number" required />
              </div>
              <div>
                <Label>Academic Year</Label>
                <Input type="text" name="academic_year" placeholder="e.g., 2024-2025" required />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={addModal.closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                Add Class
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        className="max-w-[700px] m-4 p-6 lg:p-10"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              Edit Class
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              Update the class information below.
            </p>
          </div>
          <form onSubmit={handleSaveClass} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>Class Name</Label>
                <Input 
                  type="text" 
                  name="class_name" 
                  defaultValue={selectedClass?.class_name || ""} 
                  required 
                />
              </div>
              <div>
                <Label>Class Code</Label>
                <Input 
                  type="text" 
                  name="class_code" 
                  defaultValue={selectedClass?.class_code || ""} 
                  required 
                />
              </div>
              <div>
                <Label>Grade Level</Label>
                <Input 
                  type="number" 
                  name="grade_level" 
                  defaultValue={selectedClass?.grade_level || ""} 
                  min="1" 
                  required 
                />
              </div>
              <div>
                <Label>Section</Label>
                <Input 
                  type="text" 
                  name="section" 
                  defaultValue={selectedClass?.section || ""} 
                  required 
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input 
                  type="number" 
                  name="capacity" 
                  defaultValue={selectedClass?.capacity || ""} 
                  min="1" 
                  required 
                />
              </div>
              <div>
                <Label>Room Number</Label>
                <Input 
                  type="text" 
                  name="room_number" 
                  defaultValue={selectedClass?.room_number || ""} 
                  required 
                />
              </div>
              <div>
                <Label>Academic Year</Label>
                <Input 
                  type="text" 
                  name="academic_year" 
                  defaultValue={selectedClass?.academic_year || ""} 
                  required 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={editModal.closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                Update Class
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Class Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={viewModal.closeModal}
        className="max-w-[800px] m-4 p-6 lg:p-8"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--theme-text-primary)" }}>
              {viewClass?.class_name} ({viewClass?.class_code})
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              Grade {viewClass?.grade_level} {viewClass?.section && `• Section ${viewClass.section}`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Academic Year</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewClass?.academic_year || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Room</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewClass?.room_number || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Capacity</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewClass?.capacity ?? "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Students</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewClass?.student_count ?? 0} / {viewClass?.capacity ?? "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Teacher</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewClass?.teacher_first_name
                  ? `${viewClass.teacher_first_name} ${viewClass.teacher_last_name ?? ""}`.trim()
                  : "-"}
              </div>
              {viewClass?.teacher_code && (
                <div className="text-xs mt-1" style={{ color: "var(--theme-text-secondary)" }}>
                  Code: {viewClass.teacher_code}
                </div>
              )}
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Status</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    viewClass?.is_active === 1
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {viewClass?.is_active === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={viewModal.closeModal}>
              Close
            </Button>
            {viewClass && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  viewModal.closeModal();
                  handleEditClass(viewClass);
                }}
              >
                Edit Class
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}


