import type { Request } from "express";

/**
 * Safely extract a single string param from req.params.
 * Express 5 types params as string | string[]; this extracts the first value.
 */
export function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}
