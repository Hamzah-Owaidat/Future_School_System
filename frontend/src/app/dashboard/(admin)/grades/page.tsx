"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import SelectInput from "@/components/form/SelectInput";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { studentsApi, type Student } from "@/lib/api/students";
import {
  courseNotesApi,
  type CourseNote,
  type UpsertCourseNoteDTO,
} from "@/lib/api/courseNotes";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { useCourseNoteAccess } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import PermissionGate from "@/components/auth/PermissionGate";
import {
  useClassesList,
  useCoursesList,
  useClassCoursesList,
  useInvalidateCache,
} from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/queryKeys";
import { STALE } from "@/lib/query/cacheTimes";

type Semester = 1 | 2 | 3;

type GradeRow = {
  student: Student;
  note?: CourseNote;
  partial1_score: string;
  partial2_score: string;
  final_score: string;
  partial1_total: string;
  partial2_total: string;
  final_total: string;
  semester_total: number;
};

export default function GradesPage() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCache();
  const { data: allClasses = [] } = useClassesList({ show_all: false });
  const { data: allCourses = [] } = useCoursesList({ show_all: false });
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [semester, setSemester] = useState<Semester | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();
  const { user, session } = useAuth();
  const teacherId = session?.employee?.id ?? user?.id;
  const { canWrite, isScopedWriter, employeeId } = useCourseNoteAccess();
  const { data: teacherAssignments = [] } = useClassCoursesList(
    { teacher_id: employeeId!, show_all: false },
    Boolean(isScopedWriter && employeeId)
  );
  const gradeInputClass =
    "w-full max-w-[90px] rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900/60 disabled:cursor-not-allowed disabled:opacity-60";

  const classes = useMemo(() => {
    if (isScopedWriter && employeeId && teacherAssignments.length > 0) {
      const classIds = new Set(teacherAssignments.map((a) => a.class_id));
      return allClasses.filter((cls) => classIds.has(cls.id));
    }
    return allClasses;
  }, [allClasses, isScopedWriter, employeeId, teacherAssignments]);

  const courses = useMemo(() => {
    if (isScopedWriter && employeeId && teacherAssignments.length > 0) {
      const courseIds = new Set(teacherAssignments.map((a) => a.course_id));
      return allCourses.filter((course) => courseIds.has(course.id));
    }
    return allCourses;
  }, [allCourses, isScopedWriter, employeeId, teacherAssignments]);

  const canLoadGrades = useMemo(
    () => !!selectedClassId && !!selectedCourseId && !!academicYear && !!semester,
    [selectedClassId, selectedCourseId, academicYear, semester]
  );

  const currentKey = useMemo(
    () =>
      canLoadGrades
        ? `${academicYear}::${selectedClassId}::${selectedCourseId}::${semester}`
        : "",
    [canLoadGrades, academicYear, selectedClassId, selectedCourseId, semester]
  );

  const recalcSemesterTotal = (row: GradeRow): number => {
    const p1 = parseFloat(row.partial1_score || "0");
    const p2 = parseFloat(row.partial2_score || "0");
    const f = parseFloat(row.final_score || "0");
    return p1 + p2 + f;
  };

  const handleCellChange = (
    studentId: number,
    field:
      | "partial1_score"
      | "partial2_score"
      | "final_score"
      | "partial1_total"
      | "partial2_total"
      | "final_total",
    value: string
  ) => {
    setGradeRows((prev) =>
      prev.map((row) => {
        if (row.student.id !== studentId) return row;
        const updatedRow: GradeRow = {
          ...row,
          [field]: value,
        } as GradeRow;
        updatedRow.semester_total = recalcSemesterTotal(updatedRow);
        return updatedRow;
      })
    );
  };

  const loadGrades = async () => {
    if (!canLoadGrades || !currentKey) return;

    const cachedRows = queryClient.getQueryData<GradeRow[]>([
      "grades-grid",
      currentKey,
    ]);
    if (cachedRows?.length) {
      setGradeRows(cachedRows);
      return;
    }

    try {
      setIsLoading(true);
      const classId = parseInt(selectedClassId, 10);
      const courseId = parseInt(selectedCourseId, 10);

      const studentsParams = { class_id: classId, is_active: true };
      const notesParams = {
        class_id: classId,
        course_id: courseId,
        academic_year: academicYear,
        semester: semester ?? undefined,
      };

      const [studentsData, notesData] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: queryKeys.students.list(studentsParams),
          queryFn: () => studentsApi.getAll(studentsParams),
          staleTime: STALE.GRADES,
        }),
        queryClient.fetchQuery({
          queryKey: queryKeys.courseNotes.list(notesParams),
          queryFn: () => courseNotesApi.getAll(notesParams),
          staleTime: STALE.GRADES,
        }),
      ]);

      const rows: GradeRow[] = studentsData.map((student) => {
        const existing = notesData.find(
          (note) =>
            note.student_id === student.id &&
            note.class_id === classId &&
            note.course_id === courseId &&
            note.academic_year === academicYear &&
            note.semester === semester
        );

        const row: GradeRow = {
          student,
          note: existing,
          partial1_score: existing?.partial1_score != null ? String(existing.partial1_score) : "",
          partial2_score: existing?.partial2_score != null ? String(existing.partial2_score) : "",
          final_score: existing?.final_score != null ? String(existing.final_score) : "",
          partial1_total:
            existing?.partial1_total != null ? String(existing.partial1_total) : "100",
          partial2_total:
            existing?.partial2_total != null ? String(existing.partial2_total) : "100",
          final_total:
            existing?.final_total != null ? String(existing.final_total) : "100",
          semester_total: existing?.semester_total ?? 0,
        };

        row.semester_total = recalcSemesterTotal(row);
        return row;
      });

      setGradeRows(rows);
      queryClient.setQueryData(["grades-grid", currentKey], rows);
    } catch (error) {
      console.error("Failed to load grades", error);
      showToast({
        type: "error",
        message: "Failed to load grades.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // When filters change, clear the table if filters are incomplete.
  // Only restore from cache when explicitly loading via Load button.
  useEffect(() => {
    if (!canLoadGrades) {
      setGradeRows([]);
      return;
    }
    // Don't auto-load - wait for user to click Load button
  }, [canLoadGrades]);

  const handleSaveAll = async () => {
    if (!canLoadGrades || gradeRows.length === 0) return;
    if (!canWrite) {
      showToast({
        type: "error",
        message: "You do not have permission to save grades.",
      });
      return;
    }
    if (!teacherId) {
      showToast({
        type: "error",
        message: "Missing teacher profile for saving grades.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const classId = parseInt(selectedClassId, 10);
      const courseId = parseInt(selectedCourseId, 10);

      // Only send rows where there is an existing note or the user actually entered some scores.
      const payloads: UpsertCourseNoteDTO[] = gradeRows.reduce<UpsertCourseNoteDTO[]>(
        (acc, row) => {
          const hasAnyScore =
            row.partial1_score.trim() !== "" ||
            row.partial2_score.trim() !== "" ||
            row.final_score.trim() !== "";

          // If there is no existing note and user didn't enter any scores, skip this row.
          if (!row.note && !hasAnyScore) {
            return acc;
          }

          // If there is an existing note and user cleared all scores, keep the old note (skip).
          if (row.note && !hasAnyScore) {
            return acc;
          }

          const p1Score = row.partial1_score ? parseFloat(row.partial1_score) : 0;
          const p2Score = row.partial2_score ? parseFloat(row.partial2_score) : 0;
          const fScore = row.final_score ? parseFloat(row.final_score) : 0;

          const p1Total = row.partial1_total ? parseFloat(row.partial1_total) : 100;
          const p2Total = row.partial2_total ? parseFloat(row.partial2_total) : 100;
          const fTotal = row.final_total ? parseFloat(row.final_total) : 100;

          acc.push({
            student_id: row.student.id,
            class_id: classId,
            course_id: courseId,
            teacher_id: teacherId!,
            academic_year: academicYear,
            semester: semester as number,
            partial1_score: p1Score,
            partial1_total: p1Total,
            partial2_score: p2Score,
            partial2_total: p2Total,
            final_score: fScore,
            final_total: fTotal,
            semester_total: p1Score + p2Score + fScore,
          });

          return acc;
        },
        []
      );

      if (payloads.length === 0) {
        showToast({
          type: "info",
          message: "No changes to save.",
        });
        setIsSaving(false);
        return;
      }

      await Promise.all(payloads.map((dto) => courseNotesApi.upsert(dto)));
      await invalidate.courseNotes();
      if (currentKey) {
        queryClient.removeQueries({ queryKey: ["grades-grid", currentKey] });
      }

      showToast({
        type: "success",
        message: "Grades saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save grades", error);
      showToast({
        type: "error",
        message: "Failed to save grades.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Course Notes / Grades
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter and manage grades by class, course, academic year, and semester.
          </p>
        </div>
        <PermissionGate permissions={["course_note.write", "course_note.manage"]}>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveAll}
            disabled={!canLoadGrades || gradeRows.length === 0 || isSaving}
          >
            {isSaving ? "Saving..." : "Save All"}
          </Button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-5">
        <div>
          <Label>Academic Year</Label>
          <Input
            placeholder="e.g. 2024-2025"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />
        </div>
        <div>
          <Label>Class</Label>
          <SelectInput
            name="class_id"
            placeholder="Select class"
            options={classes.map((cls) => ({
              value: cls.id,
              label: `${cls.class_name} (${cls.class_code})`,
            }))}
            value={selectedClassId || ""}
            onChange={(e) => setSelectedClassId(e.target.value)}
          />
        </div>
        <div>
          <Label>Course</Label>
          <SelectInput
            name="course_id"
            placeholder="Select course"
            options={courses.map((course) => ({
              value: course.id,
              label: `${course.name} (${course.code})`,
            }))}
            value={selectedCourseId || ""}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          />
        </div>
        <div>
          <Label>Semester</Label>
          <SelectInput
            name="semester"
            placeholder="Select semester"
            options={[
              { value: 1, label: "Semester 1" },
              { value: 2, label: "Semester 2" },
              { value: 3, label: "Semester 3" },
            ]}
            value={semester != null ? String(semester) : ""}
            onChange={(e) => {
              const value = e.target.value;
              setSemester(
                value === "1" ? 1 : value === "2" ? 2 : value === "3" ? 3 : null
              );
            }}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadGrades}
            disabled={!canLoadGrades || isLoading}
          >
            {isLoading ? "Loading..." : "Load"}
          </Button>
        </div>
      </div>

      {/* Grades Table */}
      {!canLoadGrades ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select academic year, class, course, and semester to load students and grades.
        </p>
      ) : gradeRows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No students found for the selected class.
        </p>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-md dark:border-gray-800 dark:bg-gray-dark overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Student
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  P1 Score
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  P1 Total
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  P2 Score
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  P2 Total
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  Final Score
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  Final Total
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  Semester Total
                </th>
              </tr>
            </thead>
            <tbody>
              {gradeRows.map((row) => (
                <tr
                  key={row.student.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-100">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {row.student.first_name} {row.student.last_name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {row.student.student_code}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className={gradeInputClass}
                      value={row.partial1_score}
                      readOnly={!canWrite}
                      disabled={!canWrite}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "partial1_score", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className={gradeInputClass}
                      value={row.partial1_total}
                      readOnly={!canWrite}
                      disabled={!canWrite}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "partial1_total", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className={gradeInputClass}
                      value={row.partial2_score}
                      readOnly={!canWrite}
                      disabled={!canWrite}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "partial2_score", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className={gradeInputClass}
                      value={row.partial2_total}
                      readOnly={!canWrite}
                      disabled={!canWrite}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "partial2_total", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className={gradeInputClass}
                      value={row.final_score}
                      readOnly={!canWrite}
                      disabled={!canWrite}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "final_score", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className={gradeInputClass}
                      value={row.final_total}
                      readOnly={!canWrite}
                      disabled={!canWrite}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "final_total", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-gray-800 dark:text-gray-100">
                    {row.semester_total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



