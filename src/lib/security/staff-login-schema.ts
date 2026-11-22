import { z } from "zod";

export const staffIdentifierSchema = z.string().trim().min(3).max(254).transform(value => value.includes("@") ? value.toLowerCase() : value.toUpperCase()).refine(value => /^[A-Z0-9_-]{3,32}$/.test(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
export const staffLoginSchema = z.object({ identifier: staffIdentifierSchema, password: z.string().min(1).max(1024) });
export const passwordSetupSchema = z.object({ password: z.string().min(12).max(128), confirmation: z.string() }).refine(value => value.password === value.confirmation, { path: ["confirmation"], message: "Passwords must match" });export const setupTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const directPasswordSetupSchema = z.object({ token: setupTokenSchema, password: z.string().min(12).max(128), confirmation: z.string() }).refine(value => value.password === value.confirmation, { path: ["confirmation"], message: "Passwords must match" });
