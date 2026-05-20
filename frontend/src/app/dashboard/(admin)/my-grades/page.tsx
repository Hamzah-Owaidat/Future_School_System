"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useMyCourseNotes } from "@/lib/query/hooks";

export default function MyGradesPage() {
  const { session } = useAuth();
  const { data: notes = [], isLoading: loading } = useMyCourseNotes();

  const student = session?.student;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-2xl border p-5 shadow-theme-md"
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: "var(--theme-surface)",
        }}
      >
        <h1 className="text-2xl font-semibold mb-1">My grades</h1>
        <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
          {student
            ? `${student.first_name} ${student.last_name} (${student.student_code})`
            : "Your course notes and semester marks"}
        </p>
      </div>

      {loading ? (
        <p style={{ color: "var(--theme-text-secondary)" }}>Loading...</p>
      ) : notes.length === 0 ? (
        <p style={{ color: "var(--theme-text-secondary)" }}>
          No grades published yet for your classes.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--theme-border)" }}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--theme-border)" }}>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Class</th>
                <th className="px-4 py-3 text-left">Year</th>
                <th className="px-4 py-3 text-left">Semester</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr
                  key={n.id}
                  className="border-b"
                  style={{ borderColor: "var(--theme-border)" }}
                >
                  <td className="px-4 py-3">
                    {n.course_name ?? n.course_id}
                    {n.course_code ? ` (${n.course_code})` : ""}
                  </td>
                  <td className="px-4 py-3">{n.class_name ?? n.class_id}</td>
                  <td className="px-4 py-3">{n.academic_year}</td>
                  <td className="px-4 py-3">{n.semester}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {n.semester_total ?? "—"}
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
