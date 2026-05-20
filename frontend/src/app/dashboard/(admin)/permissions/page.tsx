"use client";

import React, { useEffect, useState } from "react";
import { ReusableTable, Column, ActionHandlers } from "@/components/tables/ReusableTable";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import SelectInput from "@/components/form/SelectInput";
import { permissionsApi, Permission, CreatePermissionDTO, UpdatePermissionDTO } from "@/lib/api/permissions";
import { useToast } from "@/components/ui/toast/ToastProvider";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [viewPermission, setViewPermission] = useState<Permission | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();
  const addEditModal = useModal();
  const viewModal = useModal();

  // Available resources and actions for select inputs
  const resourceOptions = [
    { value: "employee", label: "Employee" },
    { value: "student", label: "Student" },
    { value: "class", label: "Class" },
    { value: "role", label: "Role" },
    { value: "permission", label: "Permission" },
    { value: "note", label: "Note" },
  ];

  const actionOptions = [
    { value: "create", label: "Create" },
    { value: "read", label: "Read" },
    { value: "update", label: "Update" },
    { value: "delete", label: "Delete" },
    { value: "manage", label: "Manage" },
    { value: "view", label: "View" },
  ];

  const refetchPermissions = async () => {
    const data = await permissionsApi.getAll();
    // Filter out deleted permissions (those with deleted_at) - backend should handle this
    setPermissions(data);
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await refetchPermissions();
      } catch (err: any) {
        console.error("Failed to fetch permissions:", err);
        setError(err?.message || "Failed to load permissions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleAddPermission = () => {
    setSelectedPermission(null);
    setIsEditMode(false);
    addEditModal.openModal();
  };

  const handleEditPermission = async (permission: Permission) => {
    try {
      setIsEditMode(true);
      const details = await permissionsApi.getById(permission.id);
      setSelectedPermission(details);
      addEditModal.openModal();
    } catch (err: any) {
      console.error("Failed to load permission details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load permission details",
      });
    }
  };

  const handleViewPermission = async (permission: Permission) => {
    try {
      const details = await permissionsApi.getById(permission.id);
      setViewPermission(details);
      viewModal.openModal();
    } catch (err: any) {
      console.error("Failed to load permission details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load permission details",
      });
    }
  };

  const handleDeletePermission = (permission: Permission) => {
    if (confirm(`Are you sure you want to delete ${permission.name}?`)) {
      permissionsApi
        .delete(permission.id)
        .then(() => {
          setPermissions((prev) => prev.filter((p) => p.id !== permission.id));
        })
        .catch((err: any) => {
          console.error("Failed to delete permission:", err);
          showToast({
            type: "error",
            message: err?.message || "Failed to delete permission",
          });
        });
    }
  };

  const handleSavePermission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: CreatePermissionDTO = {
      name: (formData.get("name") as string) || "",
      resource: (formData.get("resource") as string) || "",
      action: (formData.get("action") as string) || "",
      description: (formData.get("description") as string) || "",
    };

    const save = async () => {
      try {
        setIsSaving(true);
        setError(null);

        if (isEditMode && selectedPermission) {
          const updatePayload: UpdatePermissionDTO = {
            name: payload.name,
            resource: payload.resource,
            action: payload.action,
            description: payload.description,
          };
          await permissionsApi.update(selectedPermission.id, updatePayload);
        } else {
          await permissionsApi.create(payload);
        }

        await refetchPermissions();
        addEditModal.closeModal();
        form.reset();
      } catch (err: any) {
        console.error("Failed to save permission:", err);
        setError(err?.message || "Failed to save permission");
        showToast({
          type: "error",
          message: err?.message || "Failed to save permission",
        });
      } finally {
        setIsSaving(false);
      }
    };

    void save();
  };

  // Column definitions
  const columns: Column<Permission>[] = [
    {
      key: "name",
      label: "Permission Name",
      sortable: true,
      width: "180px",
      minWidth: "180px",
      render: (value) => (
        <span className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
          {value.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "resource",
      label: "Resource",
      sortable: true,
      width: "120px",
      minWidth: "120px",
      render: (value) => (
        <span className="capitalize px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: "rgba(70, 95, 255, 0.1)",
            color: "#465fff",
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      sortable: true,
      width: "100px",
      minWidth: "100px",
      render: (value) => (
        <span className="capitalize px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: "rgba(11, 165, 236, 0.1)",
            color: "#0ba5ec",
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
      width: "250px",
      minWidth: "200px",
      maxWidth: "350px",
    },
    {
      key: "role_count",
      label: "Roles",
      sortable: true,
      width: "100px",
      minWidth: "100px",
      render: (value) => (
        <span className="px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: "rgba(18, 183, 106, 0.1)",
            color: "#12b76a",
          }}
        >
          {value}
        </span>
      ),
    },
  ];

  // Action handlers
  const actions: ActionHandlers<Permission> = {
    onView: (permission) => {
      handleViewPermission(permission);
    },
    onEdit: (permission) => {
      handleEditPermission(permission);
    },
    onDelete: (permission) => {
      handleDeletePermission(permission);
    },
    onCopyId: (permission) => {
      // Copy permission ID to clipboard
      navigator.clipboard.writeText(permission.id.toString());
      navigator.clipboard.writeText(String(permission.id));
      showToast({
        type: "success",
        message: `Copied ID: ${permission.id}`,
      });
    },
    // Example of custom actions - each page can add their own
    customActions: [
      {
        label: "View Roles",
        onClick: (permission) => {
          showToast({
            type: "info",
            message: `Viewing ${permission.role_count} role(s) with permission: ${permission.name}`,
          });
        },
      },
      {
        label: "Manage Access",
        onClick: (permission) => {
          showToast({
            type: "info",
            message: `Managing access for: ${permission.name}`,
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
            Permissions
          </h1>
          <p className="text-theme-sm mt-1" style={{ color: "var(--theme-text-secondary)" }}>
            Manage and view all permissions in the system
          </p>
        </div>
        <Button onClick={handleAddPermission} size="md" variant="primary">
          Add Permission
        </Button>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--theme-text-error, #f04438)" }}>
          {error}
        </p>
      )}

      {/* Permissions Table */}
      <ReusableTable
        data={permissions}
        columns={columns}
        actions={actions}
      />

      {/* Add/Edit Permission Modal */}
      <Modal
        isOpen={addEditModal.isOpen}
        onClose={addEditModal.closeModal}
        className="max-w-[650px] m-4 p-6 lg:p-8"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              {isEditMode ? "Edit Permission" : "Add Permission"}
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              {isEditMode ? "Update permission information." : "Create a new permission."}
            </p>
          </div>
          <form onSubmit={handleSavePermission} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  name="name"
                  defaultValue={selectedPermission?.name || ""}
                  placeholder="e.g. create_employee"
                  required
                />
              </div>
              <div>
                <Label htmlFor="resource">Resource</Label>
                <SelectInput
                  name="resource"
                  options={resourceOptions}
                  defaultValue={selectedPermission?.resource || ""}
                  placeholder="Select resource"
                  required
                />
              </div>
              <div>
                <Label htmlFor="action">Action</Label>
                <SelectInput
                  name="action"
                  options={actionOptions}
                  defaultValue={selectedPermission?.action || ""}
                  placeholder="Select action"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <TextArea
                  name="description"
                  defaultValue={(selectedPermission?.description as string) || ""}
                  placeholder="Describe what this permission allows"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={addEditModal.closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isEditMode ? "Update Permission" : "Add Permission"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Permission Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={viewModal.closeModal}
        className="max-w-[750px] m-4 p-6 lg:p-8"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--theme-text-primary)" }}>
              {viewPermission?.name || "Permission Details"}
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              {viewPermission?.description || "No description"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs" style={{ color: "var(--theme-text-tertiary)" }}>Resource</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewPermission?.resource}
              </div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs" style={{ color: "var(--theme-text-tertiary)" }}>Action</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewPermission?.action}
              </div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs" style={{ color: "var(--theme-text-tertiary)" }}>Roles using it</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewPermission?.role_count ?? "-"}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              Assigned Roles
            </h3>
            {Array.isArray(viewPermission?.roles) && viewPermission!.roles!.length > 0 ? (
              <div className="space-y-2">
                {viewPermission!.roles!.map((role: any) => (
                  <div
                    key={role.id}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--theme-border)" }}
                  >
                    <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                      {role.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--theme-text-secondary)" }}>
                      {role.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
                No roles assigned to this permission.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}



