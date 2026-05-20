/**
 * Students API service
 */

import { api } from "./axios";

// Student interface (matches backend controller)
export interface Student {
  id: number;
  student_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string;
  gender: string;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  enrollment_date: string;
  class_id: number | null;
  is_active: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  // Joined from classes table
  class_name?: string | null;
  class_code?: string | null;
  grade_level?: number | null;
}

export interface StudentsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface StudentsListResponse {
  students: Student[];
  pagination?: StudentsPagination;
}

export interface GetStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  class_id?: number;
  is_active?: boolean;
  show_all?: boolean;
}

export interface CreateStudentDTO {
  student_code: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  date_of_birth: string;
  gender?: string;
  address?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  enrollment_date: string;
  class_id?: number | null;
}

export interface UpdateStudentDTO extends Partial<CreateStudentDTO> {
  is_active?: number;
}

// Students API Service
export const studentsApi = {
  // Get all students
  getAll: async (params?: GetStudentsParams): Promise<Student[]> => {
    const response = await api.get("/students", {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        class_id: params?.class_id,
        is_active: params?.is_active,
        show_all: params?.show_all,
      },
    });
    const payload: any = response.data;

    // Expected shape:
    // { success: true, message: string, data: { students: Student[], pagination: {...} } }
    if (Array.isArray(payload?.data?.students)) {
      return payload.data.students as Student[];
    }

    // Fallback: if students are directly in data
    if (Array.isArray(payload?.data)) {
      return payload.data as Student[];
    }

    // Fallback: if students are at root
    if (Array.isArray(payload)) {
      return payload as Student[];
    }

    console.warn("Unexpected students response shape:", payload);
    return [];
  },

  // Get student by ID
  getById: async (studentId: number): Promise<Student> => {
    const response = await api.get<Student>(`/students/${studentId}`);
    const payload: any = response.data;

    // Handle response structure: { success, message, data: { student: {...} } }
    if (payload?.data?.student) {
      return payload.data.student as Student;
    }
    if (payload?.data) {
      return payload.data as Student;
    }
    if (payload?.student) {
      return payload.student as Student;
    }
    return payload as Student;
  },

  // Create new student
  create: async (data: CreateStudentDTO): Promise<Student> => {
    const response = await api.post<Student>("/students", data);
    const payload: any = response.data;

    // Handle different response structures:
    // { data: { student: {...} } }
    // { data: {...} }
    // { student: {...} }
    // {...}
    if (payload?.data?.student) {
      return payload.data.student as Student;
    }
    if (payload?.data) {
      return payload.data as Student;
    }
    if (payload?.student) {
      return payload.student as Student;
    }
    return payload as Student;
  },

  // Update student
  update: async (studentId: number, data: UpdateStudentDTO): Promise<Student> => {
    const response = await api.put<Student>(`/students/${studentId}`, data);
    const payload: any = response.data;

    if (payload?.data?.student) {
      return payload.data.student as Student;
    }
    if (payload?.data) {
      return payload.data as Student;
    }
    if (payload?.student) {
      return payload.student as Student;
    }
    return payload as Student;
  },

  // Delete student (soft delete)
  delete: async (studentId: number): Promise<void> => {
    await api.delete(`/students/${studentId}`);
  },

  // Update student status (convenience method)
  updateStatus: async (studentId: number, isActive: boolean): Promise<Student> => {
    return studentsApi.update(studentId, { is_active: isActive ? 1 : 0 });
  },
};

