/**
 * Permissions API service
 */

import { api } from "./axios";

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  role_count?: number;
  roles?: any[];
}

export type GroupedPermissions = Record<string, Permission[]>;

export interface CreatePermissionDTO {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionDTO extends Partial<CreatePermissionDTO> {}

export const permissionsApi = {
  // GET /api/permissions?resource=&action=
  getAll: async (params?: { resource?: string; action?: string }): Promise<Permission[]> => {
    const response = await api.get("/permissions", { params });
    const payload: any = response.data;

    // Expected: { success, message, data: { permissions: Permission[] } }
    if (Array.isArray(payload?.data?.permissions)) return payload.data.permissions as Permission[];
    if (Array.isArray(payload?.permissions)) return payload.permissions as Permission[];
    if (Array.isArray(payload?.data)) return payload.data as Permission[];
    if (Array.isArray(payload)) return payload as Permission[];

    console.warn("Unexpected permissions response shape:", payload);
    return [];
  },

  // GET /api/permissions/grouped
  getGrouped: async (): Promise<GroupedPermissions> => {
    const response = await api.get("/permissions/grouped");
    const payload: any = response.data;

    // Expected: { success, message, data: { permissions: { [resource]: Permission[] } } }
    if (payload?.data?.permissions && typeof payload.data.permissions === "object") {
      return payload.data.permissions as GroupedPermissions;
    }
    if (payload?.permissions && typeof payload.permissions === "object") {
      return payload.permissions as GroupedPermissions;
    }

    console.warn("Unexpected grouped permissions response shape:", payload);
    return {};
  },

  // GET /api/permissions/:id
  getById: async (id: number): Promise<Permission> => {
    const response = await api.get(`/permissions/${id}`);
    const payload: any = response.data;

    // Expected: { success, message, data: { permission: Permission } }
    if (payload?.data?.permission) return payload.data.permission as Permission;
    if (payload?.permission) return payload.permission as Permission;
    if (payload?.data) return payload.data as Permission;
    return payload as Permission;
  },

  // POST /api/permissions
  create: async (data: CreatePermissionDTO): Promise<Permission> => {
    const response = await api.post("/permissions", data);
    const payload: any = response.data;

    // Expected: { data: { permission: Permission } }
    if (payload?.data?.permission) return payload.data.permission as Permission;
    if (payload?.permission) return payload.permission as Permission;
    if (payload?.data) return payload.data as Permission;
    return payload as Permission;
  },

  // PUT /api/permissions/:id
  update: async (id: number, data: UpdatePermissionDTO): Promise<Permission> => {
    const response = await api.put(`/permissions/${id}`, data);
    const payload: any = response.data;

    if (payload?.data?.permission) return payload.data.permission as Permission;
    if (payload?.permission) return payload.permission as Permission;
    if (payload?.data) return payload.data as Permission;
    return payload as Permission;
  },

  // DELETE /api/permissions/:id
  delete: async (id: number): Promise<void> => {
    await api.delete(`/permissions/${id}`);
  },
};


