import type { User } from "../../types";
import { apiFetch } from "./client";

export async function getCurrentUser() {
  return apiFetch<{ data: User }>("/api/auth/me");
}

export async function login(input: { login: string; password: string }) {
  return apiFetch<{ data: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout() {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}

