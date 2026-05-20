"use client";

import React, { useEffect, useMemo, useState } from "react";
import SelectInput from "@/components/form/SelectInput";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { classesApi, type Class } from "@/lib/api/classes";
import { coursesApi, type Course } from "@/lib/api/courses";
import { studentsApi, type Student } from "@/lib/api/students";
import { classCoursesApi } from "@/lib/api/classCourses";
import {
  courseNotesApi,
  type CourseNote,
  type UpsertCourseNoteDTO,
} from "@/lib/api/courseNotes";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { useAuth } from "@/context/AuthContext";

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
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([]);
  const [gradeCache, setGradeCache] = useState<Record<string, GradeRow[]>>({});
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [semester, setSemester] = useState<Semester | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  const isTeacher = user?.role_name?.toLowerCase() === "teacher";

  // Load reference data, limiting options for teachers based on assignments
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        if (isTeacher && user?.id) {
          // Teachers: only classes/courses they are assigned to
          const assignments = await classCoursesApi.getAll({ teacher_id: user.id });

          const uniqueClassIds = Array.from(
            new Set(assignments.map((a) => a.class_id))
          );
          const uniqueCourseIds = Array.from(
            new Set(assignments.map((a) => a.course_id))
          );

          const [allClasses, allCourses] = await Promise.all([
            classesApi.getAll({ show_all: false }),
            coursesApi.getAll({ show_all: false }),
          ]);

          setClasses(allClasses.filter((cls) => uniqueClassIds.includes(cls.id)));
          setCourses(allCourses.filter((course) => uniqueCourseIds.includes(course.id)));
        } else {
          // Admin / principal: all classes and courses
          const [allClasses, allCourses] = await Promise.all([
            classesApi.getAll({ show_all: false }),
            coursesApi.getAll({ show_all: false }),
          ]);
          setClasses(allClasses);
          setCourses(allCourses);
        }
      } catch (error) {
        console.error("Failed to load classes or courses", error);
        showToast({
          type: "error",
          message: "Failed to load classes or courses.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [isTeacher, user]);

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
    
    // Check cache first - if we have cached data, restore it without making a request
    const cached = gradeCache[currentKey];
    if (cached && cached.length > 0) {
      setGradeRows(cached);
      return;
    }

    // No cache - fetch from backend
    try {
      setIsLoading(true);
      const classId = parseInt(selectedClassId, 10);
      const courseId = parseInt(selectedCourseId, 10);

      const [studentsData, notesData] = await Promise.all([
        studentsApi.getAll({ class_id: classId, is_active: true }),
        courseNotesApi.getAll({
          class_id: classId,
          course_id: courseId,
          academic_year: academicYear,
          semester: semester ?? undefined,
        }),
      ]);

      setStudents(studentsData);

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

  // Cache the current rows for the active filter combination so if the user
  // switches filters away and back, their data is still shown.
  useEffect(() => {
    if (!canLoadGrades || !currentKey) return;
    if (gradeRows.length === 0) return;

    setGradeCache((prev) => {
      // Avoid unnecessary state updates if the reference is the same
      if (prev[currentKey] === gradeRows) return prev;
      return {
        ...prev,
        [currentKey]: gradeRows,
      };
    });
  }, [gradeRows, canLoadGrades, currentKey]);

  const handleSaveAll = async () => {
    if (!canLoadGrades || gradeRows.length === 0) return;
    if (!user?.id) {
      showToast({
        type: "error",
        message: "Missing current user information.",
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
            teacher_id: user.id,
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
        <Button
          type="button"
          size="sm"
          onClick={handleSaveAll}
          disabled={!canLoadGrades || gradeRows.length === 0 || isSaving}
        >
          {isSaving ? "Saving..." : "Save All"}
        </Button>
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
                      className="w-full max-w-[90px] rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900/60"
                      value={row.partial1_score}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "partial1_score", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className="w-full max-w-[90px] rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900/60"
                      value={row.partial1_total}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "partial1_total", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className="w-full max-w-[90px] rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900/60"
                      value={row.partial2_score}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "partial2_score", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className="w-full max-w-[90px] rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900/60"
                      value={row.partial2_total}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "partial2_total", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className="w-full max-w-[90px] rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900/60"
                      value={row.final_score}
                      onChange={(e) =>
                        handleCellChange(row.student.id, "final_score", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      className="w-full max-w-[90px] rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900/60"
                      value={row.final_total}
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



