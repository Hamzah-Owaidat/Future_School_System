"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { courseNotesApi, type CourseNote, type UpsertCourseNoteDTO } from "@/lib/api/courseNotes";
import { studentsApi, type Student } from "@/lib/api/students";
import { classesApi, type Class } from "@/lib/api/classes";
import { coursesApi, type Course } from "@/lib/api/courses";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import SelectInput from "@/components/form/SelectInput";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { useAuth } from "@/context/AuthContext";

const formatSemester = (semester: number) => `Semester ${semester}`;

export default function StudentGradesPage() {
  const params = useParams();
  const router = useRouter();
  const studentIdParam = params?.id as string | undefined;
  const studentId = studentIdParam ? parseInt(studentIdParam, 10) : NaN;

  const [student, setStudent] = useState<Student | null>(null);
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formAcademicYear, setFormAcademicYear] = useState<string>("");
  const [formClassId, setFormClassId] = useState<string>("");
  const [formCourseId, setFormCourseId] = useState<string>("");
  const [formSemester, setFormSemester] = useState<string>("");
  const [formP1Score, setFormP1Score] = useState<string>("");
  const [formP1Total, setFormP1Total] = useState<string>("100");
  const [formP2Score, setFormP2Score] = useState<string>("");
  const [formP2Total, setFormP2Total] = useState<string>("100");
  const [formFinalScore, setFormFinalScore] = useState<string>("");
  const [formFinalTotal, setFormFinalTotal] = useState<string>("100");
  const [isSaving, setIsSaving] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  const isAdminOrPrincipal =
    user?.role_name?.toLowerCase() === "admin" ||
    user?.role_name?.toLowerCase() === "principal";
  const isTeacher = user?.role_name?.toLowerCase() === "teacher";

  useEffect(() => {
    if (!studentId || Number.isNaN(studentId)) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const [stu, courseNotes, allClasses, allCourses] = await Promise.all([
          studentsApi.getById(studentId),
          courseNotesApi.getByStudent(studentId),
          classesApi.getAll({ show_all: false }),
          coursesApi.getAll({ show_all: false }),
        ]);
        setStudent(stu);
        setNotes(courseNotes);

        // Restrict classes/courses to those relevant to this student (by class_id) if available
        const studentClassId = stu.class_id;
        if (studentClassId) {
          setClasses(allClasses.filter((c) => c.id === studentClassId));
        } else {
          setClasses(allClasses);
        }
        setCourses(allCourses);

        // Pre-fill add form defaults
        if (stu.class_id) {
          setFormClassId(String(stu.class_id));
        }
      } catch (error) {
        console.error("Failed to load student grades", error);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [studentId]);

  // Group notes by course and academic year
  const grouped = notes.reduce<Record<string, CourseNote[]>>((acc, note) => {
    const key = `${note.academic_year} | ${note.course_name ?? note.course_code ?? `Course #${note.course_id}`}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {});

  const canAddNote = isAdminOrPrincipal || isTeacher;

  const resetForm = () => {
    setFormAcademicYear("");
    setFormSemester("");
    setFormP1Score("");
    setFormP2Score("");
    setFormFinalScore("");
    setFormP1Total("100");
    setFormP2Total("100");
    setFormFinalTotal("100");
    if (student?.class_id) {
      setFormClassId(String(student.class_id));
    } else {
      setFormClassId("");
    }
    setFormCourseId("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !user) return;

    try {
      if (!formAcademicYear.trim() || !formClassId || !formCourseId || !formSemester) {
        showToast({
          type: "error",
          message: "Academic year, class, course, and semester are required.",
        });
        return;
      }

      const classId = parseInt(formClassId, 10);
      const courseId = parseInt(formCourseId, 10);
      const semester = parseInt(formSemester, 10);

      if (Number.isNaN(classId) || Number.isNaN(courseId) || Number.isNaN(semester)) {
        showToast({
          type: "error",
          message: "Please select valid class, course, and semester.",
        });
        return;
      }

      const p1Score = formP1Score ? parseFloat(formP1Score) : 0;
      const p2Score = formP2Score ? parseFloat(formP2Score) : 0;
      const fScore = formFinalScore ? parseFloat(formFinalScore) : 0;
      const p1Total = formP1Total ? parseFloat(formP1Total) : 100;
      const p2Total = formP2Total ? parseFloat(formP2Total) : 100;
      const fTotal = formFinalTotal ? parseFloat(formFinalTotal) : 100;

      const payload: UpsertCourseNoteDTO = {
        student_id: student.id,
        class_id: classId,
        course_id: courseId,
        teacher_id: user.id,
        academic_year: formAcademicYear.trim(),
        semester,
        partial1_score: p1Score,
        partial1_total: p1Total,
        partial2_score: p2Score,
        partial2_total: p2Total,
        final_score: fScore,
        final_total: fTotal,
        semester_total: p1Score + p2Score + fScore,
      };

      setIsSaving(true);
      await courseNotesApi.upsert(payload);

      showToast({
        type: "success",
        message: "Note saved successfully.",
      });

      // Refresh notes
      const updatedNotes = await courseNotesApi.getByStudent(student.id);
      setNotes(updatedNotes);
      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to save note", error);
      showToast({
        type: "error",
        message: "Failed to save note.",
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
            {student
              ? `${student.first_name} ${student.last_name} – Grades`
              : "Student Grades"}
          </h1>
          {student && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {student.student_code} · {student.class_name ?? "No class"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {canAddNote && (
            <Button type="button" size="sm" onClick={handleOpenAdd}>
              Add Note
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading grades...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No course notes found for this student.
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([key, courseNotes]) => (
            <div
              key={key}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-md dark:border-gray-800 dark:bg-gray-dark"
            >
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
                {key}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                        Semester
                      </th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                        P1 (score/total)
                      </th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                        P2 (score/total)
                      </th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                        Final (score/total)
                      </th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                        Semester Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseNotes
                      .slice()
                      .sort((a, b) => (a.semester ?? 0) - (b.semester ?? 0))
                      .map((note) => (
                        <tr
                          key={note.id}
                          className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-100">
                            {formatSemester(note.semester)}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-800 dark:text-gray-100">
                            {note.partial1_score ?? "-"} / {note.partial1_total ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-800 dark:text-gray-100">
                            {note.partial2_score ?? "-"} / {note.partial2_total ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-800 dark:text-gray-100">
                            {note.final_score ?? "-"} / {note.final_total ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-gray-800 dark:text-gray-100">
                            {note.semester_total ?? "-"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {canAddNote && (
        <Modal
          isOpen={isAddOpen}
          onClose={handleCloseAdd}
          className="max-w-[700px] m-4 p-6 lg:p-8"
        >
          <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
            <div className="mb-6">
              <h2
                className="text-2xl font-semibold mb-2"
                style={{ color: "var(--theme-text-primary)" }}
              >
                Add Note for {student?.first_name} {student?.last_name}
              </h2>
              <p
                className="text-sm"
                style={{ color: "var(--theme-text-secondary)" }}
              >
                Select class, course, academic year, and semester, then enter the scores.
              </p>
            </div>
            <form onSubmit={handleSaveNote} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Academic Year <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. 2024-2025"
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Class <span className="text-red-500">*</span></Label>
                  <SelectInput
                    name="class_id"
                    placeholder="Select a class"
                    required
                    options={classes.map((cls) => ({
                      value: cls.id,
                      label: `${cls.class_name} (${cls.class_code})`,
                    }))}
                    value={formClassId || ""}
                    onChange={(e) => setFormClassId(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Course <span className="text-red-500">*</span></Label>
                  <SelectInput
                    name="course_id"
                    placeholder="Select a course"
                    required
                    options={courses.map((course) => ({
                      value: course.id,
                      label: `${course.name} (${course.code})`,
                    }))}
                    value={formCourseId || ""}
                    onChange={(e) => setFormCourseId(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Semester <span className="text-red-500">*</span></Label>
                  <SelectInput
                    name="semester"
                    placeholder="Select semester"
                    required
                    options={[
                      { value: 1, label: "Semester 1" },
                      { value: 2, label: "Semester 2" },
                      { value: 3, label: "Semester 3" },
                    ]}
                    value={formSemester || ""}
                    onChange={(e) => setFormSemester(e.target.value)}
                  />
                </div>
                <div>
                  <Label>P1 Score</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formP1Score}
                    onChange={(e) => setFormP1Score(e.target.value)}
                    placeholder="e.g. 85"
                  />
                </div>
                <div>
                  <Label>P1 Total</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formP1Total}
                    onChange={(e) => setFormP1Total(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <Label>P2 Score</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formP2Score}
                    onChange={(e) => setFormP2Score(e.target.value)}
                    placeholder="e.g. 90"
                  />
                </div>
                <div>
                  <Label>P2 Total</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formP2Total}
                    onChange={(e) => setFormP2Total(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <Label>Final Score</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formFinalScore}
                    onChange={(e) => setFormFinalScore(e.target.value)}
                    placeholder="e.g. 88"
                  />
                </div>
                <div>
                  <Label>Final Total</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formFinalTotal}
                    onChange={(e) => setFormFinalTotal(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleCloseAdd}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

