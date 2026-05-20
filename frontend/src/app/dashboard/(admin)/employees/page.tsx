"use client";

import React, { useEffect, useState } from "react";
import { ReusableTable, Column, ActionHandlers } from "@/components/tables/ReusableTable";
import { ToggleSwitch } from "@/components/ui/toggle/ToggleSwitch";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SelectInput from "@/components/form/SelectInput";
import { employeeApi, Employee, CreateEmployeeDTO } from "@/lib/api/employees";
import { rolesApi, Role } from "@/lib/api/roles";
import { useToast } from "@/components/ui/toast/ToastProvider";

// Format date helper
const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format currency helper
const formatCurrency = (amount: string): string => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(num);
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]); // Store all roles for edge cases
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();
  const addModal = useModal();
  const editModal = useModal();
  const viewModal = useModal();

  // Fetch employees and roles from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [employeesData, activeRolesData, allRolesData] = await Promise.all([
          employeeApi.getAll({ show_all: false }),
          rolesApi.getAll(true), // Only active roles for dropdown
          rolesApi.getAll(false), // All roles for reference
        ]);
        setEmployees(employeesData);
        setRoles(activeRolesData);
        setAllRoles(allRolesData);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError(err?.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle toggle active status
  const handleToggleActive = (employeeCode: string, newStatus: boolean, employeeId: number) => {
    // Optimistic UI update
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employee_code === employeeCode
          ? { ...emp, is_active: newStatus ? 1 : 0 }
          : emp
      )
    );

    // Persist change to API
    employeeApi
      .updateStatus(employeeId, newStatus)
      .catch((err) => {
        console.error("Failed to update employee status:", err);
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.employee_code === employeeCode
              ? { ...emp, is_active: newStatus ? 0 : 1 }
              : emp
          )
        );
        showToast({
          type: "error",
          message: err?.message || "Failed to update employee status",
        });
      });
  };

  // Handle field change to clear errors
  const handleFieldChange = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle add employee
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsEditMode(false);
    setFieldErrors({});
    setError(null);
    addModal.openModal();
  };

  // Handle edit employee
  const handleEditEmployee = async (employee: Employee) => {
    try {
      setIsEditMode(true);
      // Fetch full employee details by numeric ID to ensure we have all fields
      const details = await employeeApi.getById(employee.id);
      setSelectedEmployee(details);
      
      // If employee's current role is inactive, include it in the roles list for the dropdown
      if (details.role_id) {
        const currentRole = allRoles.find(r => r.id === details.role_id);
        if (currentRole && currentRole.is_active === 0) {
          // Add inactive role to the roles list if not already present
          setRoles(prev => {
            const exists = prev.some(r => r.id === currentRole.id);
            if (!exists) {
              return [...prev, currentRole];
            }
            return prev;
          });
        }
      }
      
      editModal.openModal();
    } catch (err: any) {
      console.error("Failed to load employee details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load employee details",
      });
    }
  };

  // Handle view employee
  const handleViewEmployee = async (employee: Employee) => {
    try {
      // Fetch full employee details by numeric ID
      const details = await employeeApi.getById(employee.id);
      setViewEmployee(details);
      viewModal.openModal();
    } catch (err: any) {
      console.error("Failed to load employee details:", err);
      showToast({
        type: "error",
        message: err?.message || "Failed to load employee details",
      });
    }
  };

  // Handle save employee (both add and edit)
  const handleSaveEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Client-side validation - check before making any API calls
    const errors: Record<string, string> = {};
    
    // Get form values and trim them
    const first_name = (formData.get("first_name") as string | null)?.trim() || "";
    const last_name = (formData.get("last_name") as string | null)?.trim() || "";
    const email = (formData.get("email") as string | null)?.trim() || "";
    const password = (formData.get("password") as string | null)?.trim() || "";
    const hire_date = (formData.get("hire_date") as string | null)?.trim() || "";
    const role_id = (formData.get("role_id") as string | null)?.trim() || "";
    const gender = (formData.get("gender") as string | null)?.trim() || "";

    // Validate required fields - check for empty strings explicitly
    if (first_name === "") errors.first_name = "First name is required";
    if (last_name === "") errors.last_name = "Last name is required";
    if (email === "") errors.email = "Email is required";
    if (!isEditMode && password === "") errors.password = "Password is required";
    if (hire_date === "") errors.hire_date = "Hire date is required";
    if (role_id === "") errors.role_id = "Role is required";
    if (gender === "") errors.gender = "Gender is required";

    // If there are validation errors, set them and stop immediately
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Don't show toast for field-level validation errors - only show field errors
      return; // Stop execution here - don't proceed with API call
    }

    // Clear any previous errors since validation passed
    setFieldErrors({});

    const saveEmployee = async () => {
      try {
        setIsSaving(true);
        setError(null);

        // Format the payload according to API requirements
        const payload: CreateEmployeeDTO = {
          first_name: first_name!,
          last_name: last_name!,
          email: email!,
          password: password!,
          phone: (formData.get("phone") as string)?.trim() || "",
          date_of_birth: (formData.get("date_of_birth") as string)?.trim() || "",
          gender: gender as "male" | "female",
          address: (formData.get("address") as string)?.trim() || "",
          hire_date: hire_date!,
          salary: parseFloat((formData.get("salary") as string) || "0") || 0,
          role_id: parseInt(role_id),
        };

        if (isEditMode && selectedEmployee) {
          // Update existing employee (password is optional for updates)
          const updatePayload: any = { ...payload };
          // Don't send password if it's empty in edit mode
          if (!updatePayload.password || updatePayload.password.trim() === "") {
            delete updatePayload.password;
          }
          
          console.log("Updating employee with id:", selectedEmployee.id);
          console.log("Update payload:", updatePayload);
          
          const updated = await employeeApi.update(selectedEmployee.id, updatePayload);
          
          console.log("Updated employee response:", updated);
          
          // Refetch employees to ensure we have complete data
          try {
            const refreshedEmployees = await employeeApi.getAll({ show_all: false });
            setEmployees(refreshedEmployees);
          } catch (refreshError) {
            console.warn("Failed to refresh employees list:", refreshError);
            // Fallback: Update optimistically
            setEmployees((prev) =>
              prev.map((emp) =>
                emp.employee_code === updated.employee_code ? updated : emp
              )
            );
          }
          
          editModal.closeModal();
          setSelectedEmployee(null);
          setIsEditMode(false);
          setFieldErrors({});
          setError(null);
        } else {
          // Create new employee
          const created = await employeeApi.create(payload);
          
          console.log("Created employee response:", created);
          
          // Enrich with role_name if not provided by backend
          const enrichedEmployee = {
            ...created,
            role_name: created.role_name || roles.find(r => r.id === created.role_id)?.name || "Unknown",
          };
          
          console.log("Enriched employee:", enrichedEmployee);
          
          // Refetch employees to ensure we have complete data from server
          // This ensures the new employee appears in the table with all fields
          try {
            const refreshedEmployees = await employeeApi.getAll({ show_all: false });
            console.log("Refreshed employees:", refreshedEmployees);
            setEmployees(refreshedEmployees);
          } catch (refreshError) {
            console.warn("Failed to refresh employees list:", refreshError);
            // Fallback: Add the enriched employee optimistically
            setEmployees((prev) => [enrichedEmployee, ...prev]);
          }
          
          addModal.closeModal();
          form.reset();
          setFieldErrors({});
          setError(null);
        }
      } catch (err: any) {
        console.error("Failed to save employee:", err);
        
        // Parse field-level errors from backend
        const errors: Record<string, string> = {};
        
        // Check for errors in different possible locations
        const errorData = err?.response?.data || err?.data || err;
        
        if (errorData?.errors && typeof errorData.errors === "object") {
          // Backend may return errors as an object with field names as keys
          Object.keys(errorData.errors).forEach((field) => {
            const fieldError = errorData.errors[field];
            if (Array.isArray(fieldError)) {
              errors[field] = fieldError[0]; // Take first error message
            } else if (typeof fieldError === "string") {
              errors[field] = fieldError;
            }
          });
        }
        
        // Also check for error message that might contain field information
        if (Object.keys(errors).length === 0 && errorData?.error) {
          // Try to parse common error patterns
          const errorMsg = errorData.error;
          // Check for common field error patterns like "email is required", "first_name: required", etc.
          const fieldPatterns = [
            /(\w+)\s+(?:is\s+)?(?:required|invalid|already exists|must be)/i,
            /(\w+):\s*(.+)/,
          ];
          
          for (const pattern of fieldPatterns) {
            const match = errorMsg.match(pattern);
            if (match) {
              const fieldName = match[1];
              errors[fieldName] = errorMsg;
              break;
            }
          }
        }
        
        // If no field errors, set general error
        if (Object.keys(errors).length === 0) {
          const errorMessage = err?.message || err?.error || "Failed to save employee";
          setError(errorMessage);
          showToast({
            type: "error",
            message: errorMessage,
          });
        } else {
          // Set field-level errors
          setFieldErrors(errors);
          // Also show a general toast
          showToast({
            type: "error",
            message: "Please fix the errors in the form",
          });
        }
      } finally {
        setIsSaving(false);
      }
    };

    void saveEmployee();
  };

  // Column definitions
  const columns: Column<Employee>[] = [
  {
    key: "employee_code",
    label: "Employee Code",
    sortable: true,
    width: "120px",
    minWidth: "120px",
  },
  {
    key: "first_name",
    label: "First Name",
    sortable: true,
    width: "130px",
    minWidth: "130px",
  },
  {
    key: "last_name",
    label: "Last Name",
    sortable: true,
    width: "130px",
    minWidth: "130px",
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
    width: "200px",
    minWidth: "180px",
    maxWidth: "250px",
  },
  {
    key: "phone",
    label: "Phone",
    sortable: true,
    width: "140px",
    minWidth: "140px",
  },
  {
    key: "date_of_birth",
    label: "Date of Birth",
    sortable: true,
    width: "130px",
    minWidth: "130px",
    render: (value) => formatDate(value),
  },
  {
    key: "gender",
    label: "Gender",
    sortable: true,
    width: "100px",
    minWidth: "100px",
    render: (value) => (
      <span className="capitalize">{value}</span>
    ),
  },
  {
    key: "address",
    label: "Address",
    sortable: true,
    width: "180px",
    minWidth: "150px",
    maxWidth: "250px",
  },
  {
    key: "hire_date",
    label: "Hire Date",
    sortable: true,
    width: "130px",
    minWidth: "130px",
    render: (value) => formatDate(value),
  },
  {
    key: "salary",
    label: "Salary",
    sortable: true,
    width: "120px",
    minWidth: "120px",
    render: (value) => formatCurrency(value),
  },
  {
    key: "role_name",
    label: "Role",
    sortable: true,
    width: "120px",
    minWidth: "120px",
    render: (value) => {
      if (!value) return <span className="text-gray-400">-</span>;
      const roleValue = String(value).toLowerCase();
      return (
      <span 
        className="capitalize px-3 py-1.5 rounded-lg text-xs font-medium inline-block whitespace-nowrap"
        style={{
            backgroundColor: roleValue === "admin" 
            ? "rgba(70, 95, 255, 0.15)" 
            : "rgba(11, 165, 236, 0.15)",
            color: roleValue === "admin" 
            ? "#465fff" 
            : "#0ba5ec",
        }}
      >
        {value}
      </span>
      );
    },
  },
  {
    key: "is_active",
    label: "Active",
    sortable: true,
    width: "100px",
    minWidth: "100px",
    render: (value, row) => (
      <div className="flex justify-center">
        <ToggleSwitch
          checked={value === 1}
          onChange={(checked) => {
            handleToggleActive(row.employee_code, checked, row.id);
          }}
        />
      </div>
    ),
  },
  ];

  // Action handlers
  const actions: ActionHandlers<Employee> = {
    onView: (employee) => {
      handleViewEmployee(employee);
    },
    onEdit: (employee) => {
      handleEditEmployee(employee);
    },
    onDelete: (employee) => {
      if (
        confirm(
          `Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`
        )
      ) {
        const deleteEmployee = async () => {
          try {
            // Optimistically update the employee status to inactive (soft delete)
            setEmployees((prev) =>
              prev.map((emp) =>
                emp.id === employee.id
                  ? { ...emp, is_active: 0 }
                  : emp
              )
            );

            await employeeApi.delete(employee.id);
            
            // Optionally refetch to ensure consistency with backend
            try {
              const refreshedEmployees = await employeeApi.getAll({ show_all: false });
              setEmployees(refreshedEmployees);
            } catch (refreshError) {
              console.warn("Failed to refresh employees list:", refreshError);
              // Keep the optimistic update if refresh fails
            }
          } catch (err: any) {
            console.error("Failed to delete employee:", err);
            // Revert the optimistic update on error
            setEmployees((prev) =>
              prev.map((emp) =>
                emp.id === employee.id
                  ? { ...emp, is_active: employee.is_active }
                  : emp
              )
            );
            showToast({
              type: "error",
              message: err?.message || "Failed to delete employee",
            });
          }
        };

        void deleteEmployee();
      }
    },
    onCopyId: (employee) => {
      // Copy employee code to clipboard
      navigator.clipboard.writeText(employee.employee_code);
      navigator.clipboard.writeText(employee.employee_code);
      showToast({
        type: "success",
        message: `Copied: ${employee.employee_code}`,
      });
    },
    // Example of custom actions - each page can add their own
    customActions: [
      {
        label: "Send Email",
        onClick: (employee) => {
          showToast({
            type: "info",
            message: `Sending email to: ${employee.email}`,
          });
        },
      },
      {
        label: "View Profile",
        onClick: (employee) => {
          showToast({
            type: "info",
            message: `Opening profile for: ${employee.first_name} ${employee.last_name}`,
          });
        },
      },
    ],
  };

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--theme-text-primary)" }}>
            Employees
          </h1>
          <p className="text-theme-sm mt-1" style={{ color: "var(--theme-text-secondary)" }}>
            Manage and view all employees in the system
          </p>
        </div>
        <Button onClick={handleAddEmployee} size="md" variant="primary">
          Add Employee
        </Button>
      </div>

      {/* Employees Table */}
      {error && (
        <p className="text-sm" style={{ color: "var(--theme-text-error, #f04438)" }}>
          {error}
        </p>
      )}
      <ReusableTable
        data={employees}
        columns={columns}
        actions={actions}
      />

      {/* Add Employee Modal */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        className="max-w-[700px] m-4 p-6 lg:p-10"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              Add Employee
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              Fill in the details to add a new employee to the system.
            </p>
          </div>
          <form onSubmit={handleSaveEmployee} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>
                  First Name {fieldErrors.first_name && <span className="text-error-500">*</span>}
                </Label>
                <Input 
                  type="text" 
                  name="first_name" 
                  placeholder="Enter first name"
                  onChange={() => handleFieldChange("first_name")}
                  className={
                    !fieldErrors.first_name
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.first_name && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.first_name}</p>
                )}
              </div>
              <div>
                <Label>
                  Last Name {fieldErrors.last_name && <span className="text-error-500">*</span>}
                </Label>
                <Input 
                  type="text" 
                  name="last_name" 
                  placeholder="Enter last name"
                  onChange={() => handleFieldChange("last_name")}
                  className={
                    !fieldErrors.last_name
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.last_name && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.last_name}</p>
                )}
              </div>
              <div>
                <Label>
                  Email {fieldErrors.email && <span className="text-error-500">*</span>}
                </Label>
                <Input 
                  type="email" 
                  name="email" 
                  placeholder="Enter email address"
                  onChange={() => handleFieldChange("email")}
                  className={
                    !fieldErrors.email
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.email && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.email}</p>
                )}
              </div>
              <div>
                <Label>
                  Password {fieldErrors.password && <span className="text-error-500">*</span>}
                </Label>
                <Input 
                  type="password" 
                  name="password" 
                  placeholder="Enter password"
                  onChange={() => handleFieldChange("password")}
                  className={
                    !fieldErrors.password
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.password && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.password}</p>
                )}
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  type="text" 
                  name="phone" 
                  placeholder="Enter phone number"
                  onChange={() => handleFieldChange("phone")}
                  className={
                    !fieldErrors.phone
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.phone && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.phone}</p>
                )}
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input 
                  type="date" 
                  name="date_of_birth"
                  onChange={() => handleFieldChange("date_of_birth")}
                  className={
                    !fieldErrors.date_of_birth
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.date_of_birth && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.date_of_birth}</p>
                )}
              </div>
              <div>
                <Label>
                  Gender {fieldErrors.gender && <span className="text-error-500">*</span>}
                </Label>
                <SelectInput
                  name="gender"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ]}
                  placeholder="Select gender"
                  required
                  onChange={() => handleFieldChange("gender")}
                  error={!!fieldErrors.gender}
                />
                {fieldErrors.gender && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.gender}</p>
                )}
              </div>
              <div>
                <Label>
                  Role {fieldErrors.role_id && <span className="text-error-500">*</span>}
                </Label>
                <SelectInput
                  name="role_id"
                  options={roles
                    .filter((role) => role.is_active === 1) // Only show active roles when adding
                    .map((role) => ({
                      value: role.id,
                      label: role.name.charAt(0).toUpperCase() + role.name.slice(1),
                    }))}
                  placeholder="Select role"
                  required
                  onChange={() => handleFieldChange("role_id")}
                  error={!!fieldErrors.role_id}
                />
                {fieldErrors.role_id && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.role_id}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input 
                  type="text" 
                  name="address" 
                  placeholder="Enter address"
                  onChange={() => handleFieldChange("address")}
                  className={
                    !fieldErrors.address
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.address && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.address}</p>
                )}
              </div>
              <div>
                <Label>
                  Hire Date {fieldErrors.hire_date && <span className="text-error-500">*</span>}
                </Label>
                <Input 
                  type="date" 
                  name="hire_date"
                  onChange={() => handleFieldChange("hire_date")}
                  className={
                    !fieldErrors.hire_date
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.hire_date && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.hire_date}</p>
                )}
              </div>
              <div>
                <Label>Salary</Label>
                <Input 
                  type="number" 
                  name="salary" 
                  placeholder="Enter salary" 
                  step={0.01}
                  onChange={() => handleFieldChange("salary")}
                  className={
                    !fieldErrors.salary
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.salary && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.salary}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={addModal.closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                Add Employee
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        className="max-w-[700px] m-4 p-6 lg:p-10"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
              Edit Employee
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              Update the employee information below.
            </p>
          </div>
          <form onSubmit={handleSaveEmployee} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>
                  First Name {fieldErrors.first_name && <span className="text-error-500">*</span>}
                </Label>
                <Input 
                  type="text" 
                  name="first_name" 
                  defaultValue={selectedEmployee?.first_name || ""}
                  onChange={() => handleFieldChange("first_name")}
                  className={
                    !fieldErrors.first_name
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.first_name && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.first_name}</p>
                )}
              </div>
              <div>
                <Label>
                  Last Name {fieldErrors.last_name && <span className="text-error-500">*</span>}
                </Label>
                <Input 
                  type="text" 
                  name="last_name" 
                  defaultValue={selectedEmployee?.last_name || ""}
                  onChange={() => handleFieldChange("last_name")}
                  className={
                    !fieldErrors.last_name
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.last_name && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.last_name}</p>
                )}
              </div>
              <div>
                <Label>
                  Email {fieldErrors.email && <span className="text-error-500">*</span>}
                </Label>
                <Input 
                  type="email" 
                  name="email" 
                  defaultValue={selectedEmployee?.email || ""}
                  onChange={() => handleFieldChange("email")}
                  className={
                    !fieldErrors.email
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.email && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.email}</p>
                )}
              </div>
              <div>
                <Label>Password (leave blank to keep current)</Label>
                <Input 
                  type="password" 
                  name="password" 
                  placeholder="Enter new password (optional)"
                  onChange={() => handleFieldChange("password")}
                  className={
                    !fieldErrors.password
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.password && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.password}</p>
                )}
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  type="text" 
                  name="phone" 
                  defaultValue={selectedEmployee?.phone || ""}
                  onChange={() => handleFieldChange("phone")}
                  className={
                    !fieldErrors.phone
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.phone && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.phone}</p>
                )}
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input 
                  type="date" 
                  name="date_of_birth" 
                  defaultValue={selectedEmployee?.date_of_birth ? new Date(selectedEmployee.date_of_birth).toISOString().split('T')[0] : ""}
                  onChange={() => handleFieldChange("date_of_birth")}
                  className={
                    !fieldErrors.date_of_birth
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.date_of_birth && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.date_of_birth}</p>
                )}
              </div>
              <div>
                <Label>
                  Gender {fieldErrors.gender && <span className="text-error-500">*</span>}
                </Label>
                <SelectInput
                  name="gender"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ]}
                  placeholder="Select gender"
                  defaultValue={selectedEmployee?.gender || ""}
                  required
                  onChange={() => handleFieldChange("gender")}
                  error={!!fieldErrors.gender}
                />
                {fieldErrors.gender && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.gender}</p>
                )}
              </div>
              <div>
                <Label>
                  Role {fieldErrors.role_id && <span className="text-error-500">*</span>}
                </Label>
                <SelectInput
                  name="role_id"
                  options={roles
                    .filter((role) => {
                      // Show active roles OR the current employee's role (even if inactive)
                      return role.is_active === 1 || role.id === selectedEmployee?.role_id;
                    })
                    .map((role) => ({
                      value: role.id,
                      label: role.is_active === 1
                        ? role.name.charAt(0).toUpperCase() + role.name.slice(1)
                        : `${role.name.charAt(0).toUpperCase() + role.name.slice(1)} (Inactive)`,
                    }))}
                  placeholder="Select role"
                  defaultValue={selectedEmployee?.role_id !== undefined ? selectedEmployee.role_id : ""}
                  required
                  onChange={() => handleFieldChange("role_id")}
                  error={!!fieldErrors.role_id}
                />
                {fieldErrors.role_id && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.role_id}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input 
                  type="text" 
                  name="address" 
                  defaultValue={selectedEmployee?.address || ""}
                  onChange={() => handleFieldChange("address")}
                  className={
                    !fieldErrors.address
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.address && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.address}</p>
                )}
              </div>
              <div>       
                <Label>
                  Hire Date {fieldErrors.hire_date && <span className="text-error-500">*</span>}
                </Label>
                <Input 
                  type="date" 
                  name="hire_date" 
                  defaultValue={selectedEmployee?.hire_date ? new Date(selectedEmployee.hire_date).toISOString().split('T')[0] : ""}
                  onChange={() => handleFieldChange("hire_date")}
                  className={
                    !fieldErrors.hire_date
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.hire_date && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.hire_date}</p>
                )}
              </div>
              <div>
                <Label>Salary</Label> 
                <Input 
                  type="number" 
                  name="salary" 
                  defaultValue={selectedEmployee?.salary ? (selectedEmployee.salary as string | number) : ""} 
                  step={0.01}
                  onChange={() => handleFieldChange("salary")}
                  className={
                    !fieldErrors.salary
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {fieldErrors.salary && (
                  <p className="text-error-500 text-sm pt-2">{fieldErrors.salary}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={editModal.closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                Update Employee
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Employee Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={viewModal.closeModal}
        className="max-w-[800px] m-4 p-6 lg:p-8"
      >
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)] pr-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--theme-text-primary)" }}>
              {viewEmployee?.first_name} {viewEmployee?.last_name}
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
              Employee Code: {viewEmployee?.employee_code}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Email</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewEmployee?.email || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Phone</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewEmployee?.phone || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Date of Birth</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewEmployee?.date_of_birth ? formatDate(viewEmployee.date_of_birth) : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Gender</div>
              <div className="font-medium capitalize" style={{ color: "var(--theme-text-primary)" }}>
                {viewEmployee?.gender || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Hire Date</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewEmployee?.hire_date ? formatDate(viewEmployee.hire_date) : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Salary</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                {viewEmployee?.salary ? formatCurrency(viewEmployee.salary) : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Role</div>
              <div className="font-medium capitalize" style={{ color: "var(--theme-text-primary)" }}>
                {viewEmployee?.role_name || "-"}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-tertiary)" }}>Status</div>
              <div className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    viewEmployee?.is_active === 1
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {viewEmployee?.is_active === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {viewEmployee?.address && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--theme-text-primary)" }}>
                Address
              </h3>
              <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border)" }}>
                <p className="text-sm" style={{ color: "var(--theme-text-primary)" }}>
                  {viewEmployee.address}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={viewModal.closeModal}>
              Close
            </Button>
            {viewEmployee && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  viewModal.closeModal();
                  handleEditEmployee(viewEmployee);
                }}
              >
                Edit Employee
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

