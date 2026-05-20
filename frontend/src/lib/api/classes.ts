/**
 * Classes API service
 */

import { api } from "./axios";

// Class interface (matches backend controller)
export interface Class {
  id: number;
  class_name: string;
  class_code: string;
  grade_level: number;
  section: string | null;
  capacity: number;
  room_number: string | null;
  academic_year: string;
  teacher_id: number | null;
  is_active: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  teacher_first_name?: string | null;
  teacher_last_name?: string | null;
  teacher_code?: string | null;
  student_count?: number;
}

export interface ClassesPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ClassesListResponse {
  classes: Class[];
  pagination?: ClassesPagination;
}

export interface GetClassesParams {
  page?: number;
  limit?: number;
  search?: string;
  grade_level?: number;
  academic_year?: string;
  teacher_id?: number;
  active_only?: boolean;
  show_all?: boolean;
  is_active?: boolean;
}

export interface CreateClassDTO {
  class_name: string;
  class_code: string;
  grade_level: number;
  section?: string | null;
  capacity?: number;
  room_number?: string | null;
  academic_year: string;
  teacher_id?: number | null;
}

export interface UpdateClassDTO extends Partial<CreateClassDTO> {
  is_active?: number;
}

export const classesApi = {
  // GET /api/classes
  getAll: async (params?: GetClassesParams): Promise<Class[]> => {
    const response = await api.get<ClassesListResponse>("/classes", {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        search: params?.search ?? "",
        grade_level: params?.grade_level,
        academic_year: params?.academic_year,
        teacher_id: params?.teacher_id,
        active_only: params?.active_only,
        show_all: params?.show_all,
        is_active: params?.is_active,
      },
    });

    const payload: any = response.data;

    // Expected: { success, message, data: { classes: [...], pagination: {...} } }
    if (Array.isArray(payload?.data?.classes)) {
      return payload.data.classes as Class[];
    }
    if (Array.isArray(payload?.classes)) {
      return payload.classes as Class[];
    }
    if (Array.isArray(payload?.data)) {
      return payload.data as Class[];
    }
    if (Array.isArray(payload)) {
      return payload as Class[];
    }

    console.warn("Unexpected classes response shape:", payload);
    return [];
  },

  // GET /api/classes/:id
  getById: async (classId: number): Promise<Class> => {
    const response = await api.get<Class>(`/classes/${classId}`);
    const payload: any = response.data;

    // Expected: { success, message, data: { class: {...} } }
    if (payload?.data?.class) return payload.data.class as Class;
    if (payload?.data) return payload.data as Class;
    if (payload?.class) return payload.class as Class;
    return payload as Class;
  },

  // POST /api/classes
  create: async (data: CreateClassDTO): Promise<Class> => {
    const response = await api.post<Class>("/classes", data);
    const payload: any = response.data;

    if (payload?.data?.class) return payload.data.class as Class;
    if (payload?.data) return payload.data as Class;
    if (payload?.class) return payload.class as Class;
    return payload as Class;
  },

  // PUT /api/classes/:id
  update: async (classId: number, data: UpdateClassDTO): Promise<Class> => {
    const response = await api.put<Class>(`/classes/${classId}`, data);
    const payload: any = response.data;

    if (payload?.data?.class) return payload.data.class as Class;
    if (payload?.data) return payload.data as Class;
    if (payload?.class) return payload.class as Class;
    return payload as Class;
  },

  // DELETE /api/classes/:id  (soft delete -> is_active = FALSE)
  delete: async (classId: number): Promise<void> => {
    await api.delete(`/classes/${classId}`);
  },

  // Convenience method to update active status using update endpoint
  updateStatus: async (classId: number, isActive: boolean): Promise<Class> => {
    return classesApi.update(classId, { is_active: isActive ? 1 : 0 });
  },
};


