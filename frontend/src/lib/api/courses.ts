/**
 * Courses API service
 */

import { api } from "./axios";

// Course interface (matches backend controller contract)
export interface Course {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CoursesPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CoursesListResponse {
  courses: Course[];
  pagination?: CoursesPagination;
}

export interface GetCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  active_only?: boolean;
  show_all?: boolean;
}

export interface CreateCourseDTO {
  name: string;
  code: string;
  description?: string | null;
}

export interface UpdateCourseDTO extends Partial<CreateCourseDTO> {
  is_active?: number;
}

export const coursesApi = {
  // GET /api/courses
  getAll: async (params?: GetCoursesParams): Promise<Course[]> => {
    const response = await api.get<CoursesListResponse>("/courses", {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        search: params?.search ?? "",
        is_active: params?.is_active,
        active_only: params?.active_only,
        show_all: params?.show_all,
      },
    });

    const payload: any = response.data;

    // Expected: { success, message, data: { courses: [...], pagination: {...} } }
    if (Array.isArray(payload?.data?.courses)) {
      return payload.data.courses as Course[];
    }
    if (Array.isArray(payload?.courses)) {
      return payload.courses as Course[];
    }
    if (Array.isArray(payload?.data)) {
      return payload.data as Course[];
    }
    if (Array.isArray(payload)) {
      return payload as Course[];
    }

    console.warn("Unexpected courses response shape:", payload);
    return [];
  },

  // GET /api/courses/:id
  getById: async (courseId: number): Promise<Course> => {
    const response = await api.get<Course>(`/courses/${courseId}`);
    const payload: any = response.data;

    // Expected: { success, message, data: { course: {...} } }
    if (payload?.data?.course) return payload.data.course as Course;
    if (payload?.data) return payload.data as Course;
    if (payload?.course) return payload.course as Course;
    return payload as Course;
  },

  // POST /api/courses
  create: async (data: CreateCourseDTO): Promise<Course> => {
    const response = await api.post<Course>("/courses", data);
    const payload: any = response.data;

    if (payload?.data?.course) return payload.data.course as Course;
    if (payload?.data) return payload.data as Course;
    if (payload?.course) return payload.course as Course;
    return payload as Course;
  },

  // PUT /api/courses/:id
  update: async (courseId: number, data: UpdateCourseDTO): Promise<Course> => {
    const response = await api.put<Course>(`/courses/${courseId}`, data);
    const payload: any = response.data;

    if (payload?.data?.course) return payload.data.course as Course;
    if (payload?.data) return payload.data as Course;
    if (payload?.course) return payload.course as Course;
    return payload as Course;
  },

  // DELETE /api/courses/:id  (soft delete -> is_active = FALSE)
  delete: async (courseId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}`);
  },

  // Convenience method to update active status using update endpoint
  updateStatus: async (courseId: number, isActive: boolean): Promise<Course> => {
    return coursesApi.update(courseId, { is_active: isActive ? 1 : 0 });
  },
};



