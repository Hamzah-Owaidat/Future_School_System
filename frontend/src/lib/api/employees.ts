/**
 * Example API service file for Employees
 * This demonstrates how to use the axios setup
 */

import { api } from "./axios";

// Employee interface
export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  hire_date: string;
  salary: string;
  role_id: number;
  is_active: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  role_name?: string;
}

// Create Employee DTO (Data Transfer Object)
export interface CreateEmployeeDTO {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female";
  address: string;
  hire_date: string;
  salary: number;
  role_id: number;
}

// Update Employee DTO
export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {
  is_active?: number;
}

export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  role_id?: number;
  is_active?: boolean;
  show_all?: boolean;
}

// Employee API Service
export const employeeApi = {
  // Get all employees
  getAll: async (params?: GetEmployeesParams): Promise<Employee[]> => {
    const response = await api.get("/employees", {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        role_id: params?.role_id,
        is_active: params?.is_active,
        show_all: params?.show_all,
      },
    });
    const payload: any = response.data;

    // Expected shape:
    // { success: true, message: string, data: { employees: Employee[], pagination: {...} } }
    if (Array.isArray(payload?.data?.employees)) {
      return payload.data.employees as Employee[];
    }

    console.warn("Unexpected employees response shape:", payload);
    return [];
  },

  // Get employee by ID (numeric ID from backend)
  getById: async (employeeId: number): Promise<Employee> => {
    const response = await api.get<Employee>(`/employees/${employeeId}`);
    const payload: any = response.data;
    
    // Handle response structure: { success, message, data: { employee: {...} } }
    if (payload?.data?.employee) {
      return payload.data.employee as Employee;
    }
    if (payload?.data) {
      return payload.data as Employee;
    }
    if (payload?.employee) {
      return payload.employee as Employee;
    }
    return payload as Employee;
  },

  // Create new employee
  create: async (data: CreateEmployeeDTO): Promise<Employee> => {
    const response = await api.post<Employee>("/employees", data);
    const payload: any = response.data;
    
    // Handle different response structures:
    // { data: { employee: {...} } }
    // { data: {...} }
    // { employee: {...} }
    // {...}
    if (payload?.data?.employee) {
      return payload.data.employee as Employee;
    }
    if (payload?.data) {
      return payload.data as Employee;
    }
    if (payload?.employee) {
      return payload.employee as Employee;
    }
    return payload as Employee;
  },

  // Update employee
  update: async (employeeId: number, data: UpdateEmployeeDTO): Promise<Employee> => {
    const response = await api.put<Employee>(`/employees/${employeeId}`, data);
    const payload: any = response.data;
    return (payload?.data ?? payload) as Employee;
  },

  // Delete employee
  delete: async (employeeId: number): Promise<void> => {
    await api.delete(`/employees/${employeeId}`);
  },

  // Update employee status (uses PUT endpoint to update is_active)
  updateStatus: async (employeeId: number, isActive: boolean): Promise<Employee> => {
    const response = await api.put<Employee>(`/employees/${employeeId}`, {
      is_active: isActive ? 1 : 0,
    });
    const payload: any = response.data;
    
    // Handle response structure: { success, message, data: { employee: {...} } }
    if (payload?.data?.employee) {
      return payload.data.employee as Employee;
    }
    if (payload?.data) {
      return payload.data as Employee;
    }
    if (payload?.employee) {
      return payload.employee as Employee;
    }
    return payload as Employee;
  },
};

