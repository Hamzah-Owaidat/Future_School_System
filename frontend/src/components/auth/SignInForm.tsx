"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/axios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast/ToastProvider";
import type { ApiError } from "@/lib/api/axios";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const router = useRouter();
  const { showToast } = useToast();
  const { setUser } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setStatus("loading");

      const response = await api.post<{
        employee: any;
        token: string;
      }>("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const payload: any = response.data;
      const data = payload?.data ?? payload;

      if (typeof window !== "undefined") {
        if (data?.token) {
          localStorage.setItem("token", data.token);
        }
        if (data?.employee) {
          localStorage.setItem("user", JSON.stringify(data.employee));
        }
      }

      if (data?.employee) {
        setUser(data.employee);
      } else {
        // fallback: try to read from storage
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              setUser(JSON.parse(stored));
            } catch {
              // ignore parse error
            }
          }
        }
      }

      showToast({
        type: "success",
        message: payload?.message || "Login successful.",
      });

      router.push("/dashboard");
    } catch (error: any) {
      const apiError = error as ApiError;

      if (apiError.status === 401) {
        showToast({
          type: "error",
          message: apiError.message || "Invalid email or password.",
        });
        setErrors((prev) => ({
          ...prev,
          email: "Invalid email or password.",
          password: "Invalid email or password.",
        }));
      } else {
        showToast({
          type: "error",
          message: apiError.message || "Something went wrong while signing in.",
        });
      }
    } finally {
      setStatus("idle");
    }
  };
  return (
    <div className="flex flex-col flex-1 py-4 px-1 sm:px-2">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <Label>
                  Email {errors.email && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  value={formData.email}
                  placeholder="Enter your email"
                  onChange={handleChange}
                  className={
                    !errors.email
                      ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                      : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                  }
                />
                {errors.email && (
                  <p className="text-error-500 text-sm pt-2">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label>
                  Password {errors.password && <span className="text-error-500">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={
                      !errors.password
                        ? `border-l-[3px] border-l-green-700 dark:border-l-green-500`
                        : `border-l-[3px] border-l-red-500 dark:border-l-red-500`
                    }
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
                {errors.password && (
                  <p className="text-error-500 text-sm pt-2">{errors.password}</p>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="text-sm text-gray-700 dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>
                <Link
                  href="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
