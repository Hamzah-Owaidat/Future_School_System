import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// API Response Type
export interface  ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
  error?: string;
}

// Error Response Type
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Create axios instance with default config
// Prefer env; fallback assumes backend on 8080
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api",
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor - Add auth token to requests
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (or wherever you store it)
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Add token to headers if it exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === "development") {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    // Handle request error
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle responses and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Log response in development
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    // Return the data directly if the response follows the ApiResponse structure
    // Otherwise return the full response
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Handle response errors
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      const method = error.config?.method?.toUpperCase() || "UNKNOWN";
      const url = error.config?.url || "unknown endpoint";
      console.error(`❌ ${method} ${url}`, {
        status: error.response?.status,
        error: error.response?.data || error.message,
      });
    }

    // Handle 401 Unauthorized - Token expired or invalid
    // Don't redirect if we're already on the login page (login endpoint)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoginRequest = originalRequest.url?.includes("/auth/login");
      
      // Only redirect if it's not a login request (i.e., token expired on protected route)
      if (!isLoginRequest && typeof window !== "undefined") {
        originalRequest._retry = true;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Redirect to login page
        window.location.href = "/auth/signin";
      }

      // For login requests, let the error pass through to the component
      // Don't reject here, let it be handled by the component
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Handle forbidden access
      console.error("Access forbidden");
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error("Resource not found");
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error("Server error occurred");
    }

    // Extract error message
    // Backend may return either 'error' or 'message' field
    const errorData = error.response?.data as any;
    const errorMessage =
      errorData?.message ||
      errorData?.error ||
      // some backends use `errors` as a string or array; fall back gracefully
      (typeof errorData?.errors === "string"
        ? errorData.errors
        : undefined) ||
      error.message ||
      "An unexpected error occurred";

    // Create a formatted error object
    const formattedError: ApiError = {
      message: errorMessage,
      errors: error.response?.data?.errors,
      status: error.response?.status,
    };

    return Promise.reject(formattedError);
  }
);

// API Methods
export const api = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return axiosInstance.get<ApiResponse<T>>(url, config);
  },

  // POST request
  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return axiosInstance.post<ApiResponse<T>>(url, data, config);
  },

  // PUT request
  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return axiosInstance.put<ApiResponse<T>>(url, data, config);
  },

  // PATCH request
  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return axiosInstance.patch<ApiResponse<T>>(url, data, config);
  },

  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return axiosInstance.delete<ApiResponse<T>>(url, config);
  },

  // Upload file
  upload: <T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return axiosInstance.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
  },
};

// Export the axios instance for advanced usage
export default axiosInstance;

// Export types
export type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError };

