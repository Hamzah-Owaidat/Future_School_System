# API Setup Guide

## Installation

First, install axios:

```bash
npm install axios
```

## Environment Variables

Create a `.env.local` file in the root of your project:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

## Usage

### Basic API Calls

```typescript
import { api } from "@/lib/api/axios";

// GET request
const fetchEmployees = async () => {
  try {
    const response = await api.get("/employees");
    return response.data.data; // Access the data property
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

// POST request
const createEmployee = async (employeeData: any) => {
  try {
    const response = await api.post("/employees", employeeData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
};

// PUT request
const updateEmployee = async (id: string, employeeData: any) => {
  try {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data.data;
  } catch (error) {
    console.error("Error updating employee:", error);
    throw error;
  }
};

// PATCH request
const updateEmployeeStatus = async (id: string, status: boolean) => {
  try {
    const response = await api.patch(`/employees/${id}/status`, { is_active: status });
    return response.data.data;
  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
};

// DELETE request
const deleteEmployee = async (id: string) => {
  try {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw error;
  }
};

// File upload
const uploadFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await api.upload("/upload", formData, (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / (progressEvent.total || 1)
      );
      console.log(`Upload progress: ${percentCompleted}%`);
    });
    
    return response.data.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
```

### With TypeScript Types

```typescript
import { api, ApiResponse } from "@/lib/api/axios";

interface Employee {
  id: string;
  name: string;
  email: string;
}

// Typed GET request
const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await api.get<Employee[]>("/employees");
  return response.data.data;
};

// Typed POST request
const createEmployee = async (data: Omit<Employee, "id">): Promise<Employee> => {
  const response = await api.post<Employee>("/employees", data);
  return response.data.data;
};
```

### Error Handling

```typescript
import { api, ApiError } from "@/lib/api/axios";

const fetchData = async () => {
  try {
    const response = await api.get("/data");
    return response.data.data;
  } catch (error) {
    const apiError = error as ApiError;
    
    if (apiError.status === 401) {
      // Already handled by interceptor - redirects to login
      console.log("Unauthorized");
    } else if (apiError.status === 403) {
      console.log("Access forbidden");
    } else if (apiError.status === 404) {
      console.log("Resource not found");
    } else {
      console.error("Error:", apiError.message);
    }
    
    throw error;
  }
};
```

## Features

- ✅ Automatic token injection from localStorage
- ✅ Automatic error handling and formatting
- ✅ 401 redirect to login page
- ✅ Request/Response logging in development
- ✅ TypeScript support
- ✅ File upload with progress tracking
- ✅ Timeout configuration (30 seconds)

## Authentication

The axios instance automatically adds the Bearer token from localStorage to all requests. Make sure to store the token after login:

```typescript
// After successful login
localStorage.setItem("token", response.data.token);
```

## Advanced Usage

For advanced configurations, you can import the axios instance directly:

```typescript
import axiosInstance from "@/lib/api/axios";

// Custom request with specific headers
const customRequest = async () => {
  const response = await axiosInstance.get("/custom-endpoint", {
    headers: {
      "Custom-Header": "value",
    },
  });
  return response.data;
};
```

