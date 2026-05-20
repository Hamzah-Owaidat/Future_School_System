/**
 * Class-Courses (assignments) API service
 */

import { api } from "./axios";

export interface ClassCourse {
  id: number;
  class_id: number;
  course_id: number;
  teacher_id: number;
  academic_year: string;
  is_active: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  // Optional denormalized fields commonly returned by backends
  class_name?: string;
  class_code?: string;
  course_name?: string;
  course_code?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  teacher_code?: string;
}

export interface GetClassCoursesParams {
  class_id?: number;
  course_id?: number;
  teacher_id?: number;
  academic_year?: string;
  is_active?: boolean;
  show_all?: boolean;
}

export interface CreateClassCourseDTO {
  class_id: number;
  course_id: number;
  teacher_id: number;
  academic_year: string;
}

export interface UpdateClassCourseDTO extends Partial<CreateClassCourseDTO> {
  is_active?: number;
}

export const classCoursesApi = {
  // GET /api/class-courses
  getAll: async (params?: GetClassCoursesParams): Promise<ClassCourse[]> => {
    const response = await api.get<ClassCourse[]>("/class-courses", {
      params,
    });
    const payload: any = response.data;

    // Common shapes:
    // - { data: { class_courses: [...] } }
    // - { data: { assignments: [...] } }
    // - { class_courses: [...] }
    // - { assignments: [...] }
    // - { data: [...] }
    // - [ ... ]
    if (Array.isArray(payload?.data?.class_courses)) {
      return payload.data.class_courses as ClassCourse[];
    }
    if (Array.isArray(payload?.data?.assignments)) {
      return payload.data.assignments as ClassCourse[];
    }
    if (Array.isArray(payload?.class_courses)) {
      return payload.class_courses as ClassCourse[];
    }
    if (Array.isArray(payload?.assignments)) {
      return payload.assignments as ClassCourse[];
    }
    if (Array.isArray(payload?.data)) {
      return payload.data as ClassCourse[];
    }
    if (Array.isArray(payload)) {
      return payload as ClassCourse[];
    }

    console.warn("Unexpected class-courses response shape:", payload);
    return [];
  },

  // GET /api/class-courses/:id
  getById: async (id: number): Promise<ClassCourse> => {
    const response = await api.get<ClassCourse>(`/class-courses/${id}`);
    const payload: any = response.data;

    if (payload?.data?.class_course) return payload.data.class_course as ClassCourse;
    if (payload?.data) return payload.data as ClassCourse;
    if (payload?.class_course) return payload.class_course as ClassCourse;
    return payload as ClassCourse;
  },

  // POST /api/class-courses
  create: async (data: CreateClassCourseDTO): Promise<ClassCourse> => {
    const response = await api.post<ClassCourse>("/class-courses", data);
    const payload: any = response.data;

    if (payload?.data?.class_course) return payload.data.class_course as ClassCourse;
    if (payload?.data) return payload.data as ClassCourse;
    if (payload?.class_course) return payload.class_course as ClassCourse;
    return payload as ClassCourse;
  },

  // PUT /api/class-courses/:id
  update: async (id: number, data: UpdateClassCourseDTO): Promise<ClassCourse> => {
    const response = await api.put<ClassCourse>(`/class-courses/${id}`, data);
    const payload: any = response.data;

    if (payload?.data?.class_course) return payload.data.class_course as ClassCourse;
    if (payload?.data) return payload.data as ClassCourse;
    if (payload?.class_course) return payload.class_course as ClassCourse;
    return payload as ClassCourse;
  },

  // DELETE /api/class-courses/:id (soft delete)
  delete: async (id: number): Promise<void> => {
    await api.delete(`/class-courses/${id}`);
  },

  updateStatus: async (id: number, isActive: boolean): Promise<ClassCourse> => {
    return classCoursesApi.update(id, { is_active: isActive ? 1 : 0 });
  },
};



