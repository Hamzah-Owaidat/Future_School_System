/**
 * Course Notes (grades) API service
 */

import { api } from "./axios";

export interface CourseNote {
  id: number;
  student_id: number;
  class_id: number;
  course_id: number;
  teacher_id: number;
  academic_year: string;
  semester: number;
  partial1_score: number | null;
  partial2_score: number | null;
  final_score: number | null;
  partial1_total: number | null;
  partial2_total: number | null;
  final_total: number | null;
  semester_total: number | null;
  comment?: string | null;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  // Optional denormalized fields
  student_first_name?: string;
  student_last_name?: string;
  class_name?: string;
  course_name?: string;
  course_code?: string;
}

export interface GetCourseNotesParams {
  student_id?: number;
  class_id?: number;
  course_id?: number;
  teacher_id?: number;
  academic_year?: string;
  semester?: number;
}

export type UpsertCourseNoteDTO = Omit<
  CourseNote,
  "id" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

export const courseNotesApi = {
  // GET /api/course-notes
  getAll: async (params?: GetCourseNotesParams): Promise<CourseNote[]> => {
    const response = await api.get<CourseNote[]>("/course-notes", { params });
    const payload: any = response.data;

    if (Array.isArray(payload?.data?.course_notes)) {
      return payload.data.course_notes as CourseNote[];
    }
    if (Array.isArray(payload?.course_notes)) {
      return payload.course_notes as CourseNote[];
    }
    if (Array.isArray(payload?.data)) {
      return payload.data as CourseNote[];
    }
    if (Array.isArray(payload)) {
      return payload as CourseNote[];
    }

    console.warn("Unexpected course-notes response shape:", payload);
    return [];
  },

  // GET /api/course-notes/student/:studentId
  getByStudent: async (studentId: number, academicYear?: string): Promise<CourseNote[]> => {
    const params = academicYear ? { academic_year: academicYear } : {};
    const response = await api.get<CourseNote[]>(`/course-notes/student/${studentId}`, { params });
    const payload: any = response.data;

    if (Array.isArray(payload?.data?.course_notes)) {
      return payload.data.course_notes as CourseNote[];
    }
    if (Array.isArray(payload?.course_notes)) {
      return payload.course_notes as CourseNote[];
    }
    if (Array.isArray(payload?.data)) {
      return payload.data as CourseNote[];
    }
    if (Array.isArray(payload)) {
      return payload as CourseNote[];
    }

    console.warn("Unexpected course-notes-by-student response shape:", payload);
    return [];
  },

  // POST /api/course-notes (upsert)
  upsert: async (data: UpsertCourseNoteDTO): Promise<CourseNote> => {
    const response = await api.post<CourseNote>("/course-notes", data);
    const payload: any = response.data;

    if (payload?.data?.course_note) return payload.data.course_note as CourseNote;
    if (payload?.data) return payload.data as CourseNote;
    if (payload?.course_note) return payload.course_note as CourseNote;
    return payload as CourseNote;
  },

  // PUT /api/course-notes/:id
  update: async (id: number, data: Partial<UpsertCourseNoteDTO>): Promise<CourseNote> => {
    const response = await api.put<CourseNote>(`/course-notes/${id}`, data);
    const payload: any = response.data;

    if (payload?.data?.course_note) return payload.data.course_note as CourseNote;
    if (payload?.data) return payload.data as CourseNote;
    if (payload?.course_note) return payload.course_note as CourseNote;
    return payload as CourseNote;
  },

  // DELETE /api/course-notes/:id
  delete: async (id: number): Promise<void> => {
    await api.delete(`/course-notes/${id}`);
  },
};



