// API response helpers — consistent response format across all routes
// Security: error messages are generic, no internal details [SO §9]

import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export const Errors = {
  UNAUTHORIZED: (msg = "Authentication required") => errorResponse("UNAUTHORIZED", msg, 401),
  FORBIDDEN: (msg = "Insufficient permissions") => errorResponse("FORBIDDEN", msg, 403),
  NOT_FOUND: (msg = "Resource not found") => errorResponse("NOT_FOUND", msg, 404),
  VALIDATION: (msg: string) => errorResponse("VALIDATION_ERROR", msg, 400),
  RATE_LIMITED: () => errorResponse("RATE_LIMITED", "Too many requests", 429),
  INTERNAL: () => errorResponse("INTERNAL_ERROR", "Something went wrong", 500),
};
