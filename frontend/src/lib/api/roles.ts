/**
 * Roles API service
 */

import { api } from "./axios";

// Role interface
export interface Role {
  id: number;
  name: string;
  description: string;
  is_active: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Roles API Service
export const rolesApi = {
  // Get all roles
  getAll: async (activeOnly?: boolean, showAll?: boolean): Promise<Role[]> => {
    const params: Record<string, any> = {};
    if (activeOnly) params.active_only = "true";
    if (showAll !== undefined) params.show_all = showAll;
    const response = await api.get("/roles", { params });
    const payload: any = response.data;

    // Expected shape:
    // { success: true, message: string, data: { roles: Role[], pagination: {...} } }
    if (Array.isArray(payload?.data?.roles)) {
      return payload.data.roles as Role[];
    }

    // Fallback: if roles are directly in data
    if (Array.isArray(payload?.data)) {
      return payload.data as Role[];
    }

    // Fallback: if roles are at root
    if (Array.isArray(payload)) {
      return payload as Role[];
    }

    console.warn("Unexpected roles response shape:", payload);
    return [];
  },

  // Get role by ID (with permissions)
  getById: async (roleId: number): Promise<Role> => {
    const response = await api.get(`/roles/${roleId}`);
    const payload: any = response.data;

    if (payload?.data?.role) return payload.data.role as Role;
    if (payload?.data) return payload.data as Role;
    if (payload?.role) return payload.role as Role;
    return payload as Role;
  },

  // Create role
  create: async (data: {
    name: string;
    description: string;
    is_active?: number;
    permission_ids?: number[];
  }): Promise<Role> => {
    const response = await api.post("/roles", data);
    const payload: any = response.data;

    if (payload?.data?.role) return payload.data.role as Role;
    if (payload?.data) return payload.data as Role;
    if (payload?.role) return payload.role as Role;
    return payload as Role;
  },

  // Update role
  update: async (
    roleId: number,
    data: { name?: string; description?: string; is_active?: number; permission_ids?: number[] }
  ): Promise<Role> => {
    const response = await api.put(`/roles/${roleId}`, data);
    const payload: any = response.data;

    if (payload?.data?.role) return payload.data.role as Role;
    if (payload?.data) return payload.data as Role;
    if (payload?.role) return payload.role as Role;
    return payload as Role;
  },

  // Delete role
  delete: async (roleId: number): Promise<void> => {
    await api.delete(`/roles/${roleId}`);
  },
};

