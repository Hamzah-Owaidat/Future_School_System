"use client";

import React, { useEffect, useState } from "react";
import { ReusableTable, Column, ActionHandlers } from "@/components/tables/ReusableTable";
import { ToggleSwitch } from "@/components/ui/toggle/ToggleSwitch";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import { rolesApi, Role, Permission } from "@/lib/api/roles";
import { permissionsApi, GroupedPermissions } from "@/lib/api/permissions";
import { useToast } from "@/components/ui/toast/ToastProvider";

interface RoleWithCounts extends Role {
  employee_count?: number;
  permission_count?: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithCounts[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleWithCounts | null>(null);
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [roleActive, setRoleActive] = useState<boolean>(true);

  const { showToast } = useToast();
  const addEditModal = useModal();
  const viewModal = useModal();

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await rolesApi.getAll(false, false); // activeOnly=false, showAll=false (exclude deleted)
        setRoles(data);
      } catch (err: any) {
        console.error("Failed to fetch roles:", err);
        setError(err?.message || "Failed to load roles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Refetch helper
  const refetchRoles = async () => {
    const data = await rolesApi.getAll(false, false); // activeOnly=false, showAll=false (exclude deleted)
    setRoles(data);
  };

  // Handle toggle active status
  const handleToggleActive = (roleId: number, newStatus: boolean) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId ? { ...role, is_active: newStatus ? 1 : 0 } : role
      )
    );

    rolesApi.update(roleId, { is_active: newStatus ? 1 : 0 }).catch((err) => {
      console.error("Failed to update role status:", err);
      setRoles((prev) =>
        prev.map((role) =>
          role.id === roleId ? { ...role, is_active: newStatus ? 0 : 1 } : role
        )
      );
      showToast({
        type: "error",
        message: err?.message || "Failed to update role status",
      });
    });
  };

  // Handle add role
  const handleAddRole = () => {
    setSelectedRole(null);
    setIsEditMode(false);
    setSelectedPermissionIds([]);
    setRoleActive(true);
    // Load grouped permissions once
    if (Object.keys(groupedPermissions).length === 0) {
      permissionsApi
        .getGrouped()
        .then(setGroupedPermissions)
        .catch((err) => {
          console.error("Failed to fetch grouped permissions:", err);
        });
    }
    addEditModal.openModal();
  };

  // Handle edit role
  const handleEditRole = async (role: RoleWithCounts) => {
    try {
      setIsEditMode(true);
      setSelectedRole(role);
      // Optionally fetch full role details (with permissions)
      const details = await rolesApi.getById(role.id);
      setSelectedRole(details);
      setRoleActive((details.is_active ?? 1) === 1);
      setSelectedPermissionIds((details.permissions ?? []).map((p) => p.id));
      if (Object.keys(groupedPermissions).length === 0) {
        const grouped = await permissionsApi.getGrouped();
        setGroupedPermissions(grouped);
      }
      addEditModal.openModal();
    } catch (err: any) {
      console.error("Failed to load role details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load role details",
      });
    }
  };

  // Handle view role
  const handleViewRole = async (role: RoleWithCounts) => {
    try {
      const details = await rolesApi.getById(role.id);
      setViewRole(details);
      viewModal.openModal();
    } catch (err: any) {
      console.error("Failed to load role details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load role details",
      });
    }
  };

  // Handle delete role
  const handleDeleteRole = (role: RoleWithCounts) => {
    if (confirm(`Are you sure you want to delete ${role.name}?`)) {
      rolesApi
        .delete(role.id)
        .then(() => {
          setRoles((prev) => prev.filter((r) => r.id !== role.id));
        })
        .catch((err) => {
          console.error("Failed to delete role:", err);
          showToast({
            type: "error",
            message: err?.message || "Failed to delete role",
          });
        });
    }
  };

  // Handle save role (add/edit)
  const handleSaveRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: (formData.get("name") as string) || "",
      description: (formData.get("description") as string) || "",
      is_active: roleActive ? 1 : 0,
      permission_ids: selectedPermissionIds,
    };

    const saveRole = async () => {
      try {
        setIsSaving(true);
        setError(null);

        if (isEditMode && selectedRole) {
          await rolesApi.update(selectedRole.id, payload);
        } else {
          await rolesApi.create(payload);
        }

        await refetchRoles();
        addEditModal.closeModal();
        form.reset();
      } catch (err: any) {
        console.error("Failed to save role:", err);
        setError(err?.message || "Failed to save role");
        showToast({
          type: "error",
          message: err?.message || "Failed to save role",
        });
      } finally {
        setIsSaving(false);
      }
    };

    void saveRole();
  };

  // Column definitions
  const columns: Column<RoleWithCounts>[] = [
    {
      key: "name",
      label: "Role Name",
      sortable: true,
      width: "150px",
      minWidth: "150px",
      render: (value) => (
        <span className="capitalize font-medium">{value}</span>
      ),
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
      width: "300px",
      minWidth: "250px",
      maxWidth: "400px",
    },
    {
      key: "employee_count",
      label: "Employees",
      sortable: true,
      width: "120px",
      minWidth: "120px",
      render: (value) => (
        <span className="px-2 py-1 rounded text-xs font-medium"
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
      key: "permission_count",
      label: "Permissions",
      sortable: true,
      width: "120px",
      minWidth: "120px",
      render: (value) => (
        <span className="px-2 py-1 rounded text-xs font-medium"
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
  const actions: ActionHandlers<RoleWithCounts> = {
    onView: (role) => {
      handleViewRole(role);
    },
    onEdit: (role) => {
      handleEditRole(role);
    },
    onDelete: (role) => {
      handleDeleteRole(role);
    },
    onCopyId: (role) => {
      // Copy role ID to clipboard
      navigator.clipboard.writeText(role.id.toString());
      navigator.clipboard.writeText(String(role.id));
      showToast({
        type: "success",
        message: `Copied ID: ${role.id}`,
      });
    },
    // Example of custom actions - each page can add their own
    customActions: [
      {
        label: "Assign Permissions",
        onClick: (role) => {
          // Open the role edit modal focused on permissions
          handleEditRole(role);
        },
      },
      {
        label: "View Employees",
        onClick: (role) => {
          showToast({
            type: "info",
            message: `Viewing ${role.employee_count} employee(s) with role: ${role.name}`,
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
            Roles
          </h1>
          <p className="text-theme-sm mt-1" style={{ color: "var(--theme-text-secondary)" }}>
            Manage and view all roles in the system
          </p>
        </div>
        <Button onClick={handleAddRole} size="md" variant="primary">
          Add Role
        </Button>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--theme-text-error, #f04438)" }}>
          {error}
        </p>
      )}

      {/* Roles Table */}
      <ReusableTable
        data={roles}
        columns={columns}
        actions={actions}
      />

      {/* Add/Edit Role Modal */}
      <Modal
        isOpen={addEditModal.isOpen}
        onClose={addEditModal.closeModal}
        className="max-w-[600px] m-4 p-6 lg:p-8"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              {isEditMode ? "Edit Role" : "Add Role"}
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              {isEditMode ? "Update role information." : "Create a new role with permissions."}
            </p>
          </div>
          <form onSubmit={handleSaveRole} className="space-y-5">
            <div className="space-y-4">
              <div>
                <Label>Role Name</Label>
                <Input
                  type="text"
                  name="name"
                  defaultValue={selectedRole?.name || ""}
                  placeholder="Enter role name"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <TextArea
                  name="description"
                  defaultValue={selectedRole?.description || ""}
                  placeholder="Enter role description"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={roleActive}
                  onChange={(checked) => setRoleActive(checked)}
                />
                <span className="text-theme-sm" style={{ color: "var(--theme-text-secondary)" }}>
                  Active
                </span>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Permissions</Label>
                  <span className="text-xs" style={{ color: "var(--theme-text-tertiary)" }}>
                    Selected: {selectedPermissionIds.length}
                  </span>
                </div>

                {Object.keys(groupedPermissions).length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
                    Loading permissions...
                  </p>
                ) : (
                  <div
                    className="rounded-xl border p-3 space-y-4 max-h-[320px] overflow-y-auto custom-scrollbar"
                    style={{ borderColor: "var(--theme-border)" }}
                  >
                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                      <div key={resource}>
                        <div
                          className="text-sm font-semibold mb-2 capitalize"
                          style={{ color: "var(--theme-text-primary)" }}
                        >
                          {resource}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((perm) => {
                            const checked = selectedPermissionIds.includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className="flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:opacity-90"
                                style={{ borderColor: "var(--theme-border)" }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked;
                                    setSelectedPermissionIds((prev) =>
                                      next
                                        ? Array.from(new Set([...prev, perm.id]))
                                        : prev.filter((id) => id !== perm.id)
                                    );
                                  }}
                                />
                                <div>
                                  <div
                                    className="text-sm font-medium"
                                    style={{ color: "var(--theme-text-primary)" }}
                                  >
                                    {perm.name}
                                  </div>
                                  <div
                                    className="text-xs"
                                    style={{ color: "var(--theme-text-secondary)" }}
                                  >
                                    {perm.description || `${perm.resource}:${perm.action}`}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={addEditModal.closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isEditMode ? "Update Role" : "Add Role"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Role Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={viewModal.closeModal}
        className="max-w-[700px] m-4 p-6 lg:p-8"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--theme-text-primary)" }}>
              {viewRole?.name || "Role Details"}
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              {viewRole?.description || "No description"}
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--theme-text-tertiary)" }}>
              Status: {(viewRole?.is_active ?? 1) === 1 ? "Active" : "Inactive"}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              Permissions
            </h3>
            {viewRole?.permissions && viewRole.permissions.length > 0 ? (
              <div className="space-y-2">
                {viewRole.permissions.map((perm: Permission) => (
                  <div
                    key={perm.id}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--theme-border)" }}
                  >
                    <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                      {perm.name} ({perm.resource}:{perm.action})
                    </div>
                    <div className="text-xs" style={{ color: "var(--theme-text-secondary)" }}>
                      {perm.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
                No permissions found for this role.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}



