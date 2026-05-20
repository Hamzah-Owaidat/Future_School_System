/**
 * Example usage of ReusableTable component
 * 
 * This file demonstrates how to use the ReusableTable component
 * with different data types and configurations.
 */

import React from "react";
import ReusableTable, { Column, ActionHandlers } from "./ReusableTable";

// Example 1: Simple data structure
interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
}

const employeeData: Employee[] = [
  { id: 1, name: "John Doe", email: "john@example.com", department: "IT", salary: 5000 },
  { id: 2, name: "Jane Smith", email: "jane@example.com", department: "HR", salary: 4500 },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", department: "Finance", salary: 6000 },
];

const employeeColumns: Column<Employee>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "department", label: "Department", sortable: true },
  { 
    key: "salary", 
    label: "Salary", 
    sortable: true,
    render: (value) => `$${value.toLocaleString()}` 
  },
];

const employeeActions: ActionHandlers<Employee> = {
  onView: (employee) => {
    console.log("View employee:", employee);
    // Navigate to view page or open modal
  },
  onEdit: (employee) => {
    console.log("Edit employee:", employee);
    // Navigate to edit page or open edit modal
  },
  onDelete: (employee) => {
    console.log("Delete employee:", employee);
    // Show confirmation dialog and delete
    if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
      // Perform delete operation
    }
  },
};

export function EmployeeTableExample() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Employees Table</h2>
      <ReusableTable
        data={employeeData}
        columns={employeeColumns}
        actions={employeeActions}
      />
    </div>
  );
}

// Example 2: Complex data with custom rendering
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  grade: string;
  enrolled: boolean;
}

const studentData: Student[] = [
  { id: 1, firstName: "Alice", lastName: "Williams", age: 20, grade: "A", enrolled: true },
  { id: 2, firstName: "Charlie", lastName: "Brown", age: 19, grade: "B", enrolled: true },
  { id: 3, firstName: "Diana", lastName: "Prince", age: 21, grade: "A+", enrolled: false },
];

const studentColumns: Column<Student>[] = [
  { 
    key: "firstName", 
    label: "First Name", 
    sortable: true 
  },
  { 
    key: "lastName", 
    label: "Last Name", 
    sortable: true 
  },
  { 
    key: "age", 
    label: "Age", 
    sortable: true 
  },
  { 
    key: "grade", 
    label: "Grade", 
    sortable: true 
  },
  { 
    key: "enrolled", 
    label: "Status", 
    sortable: true,
    render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        value 
          ? "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400" 
          : "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400"
      }`}>
        {value ? "Enrolled" : "Not Enrolled"}
      </span>
    )
  },
];

const studentActions: ActionHandlers<Student> = {
  onView: (student) => console.log("View:", student),
  onEdit: (student) => console.log("Edit:", student),
  onDelete: (student) => console.log("Delete:", student),
};

export function StudentTableExample() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Students Table</h2>
      <ReusableTable
        data={studentData}
        columns={studentColumns}
        actions={studentActions}
      />
    </div>
  );
}

// Example 3: Table with only view action
export function ViewOnlyTableExample() {
  const viewOnlyActions: ActionHandlers<Employee> = {
    onView: (employee) => console.log("View:", employee),
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">View Only Table</h2>
      <ReusableTable
        data={employeeData}
        columns={employeeColumns}
        actions={viewOnlyActions}
      />
    </div>
  );
}

// Example 4: Table without actions
export function NoActionsTableExample() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Table Without Actions</h2>
      <ReusableTable
        data={employeeData}
        columns={employeeColumns}
      />
    </div>
  );
}

