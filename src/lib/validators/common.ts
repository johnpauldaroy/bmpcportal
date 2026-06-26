import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const dateStringSchema = z.string().date();
export const moneySchema = z.coerce.number().nonnegative().multipleOf(0.01);
