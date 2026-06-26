import { describe, expect, it } from "vitest";
import { loginSchema } from "./schemas";

describe("loginSchema", () => {
  it("validates email and password credentials", () => {
    const result = loginSchema.safeParse({
      email: "member@example.com",
      password: "password123"
    });

    expect(result.success).toBe(true);
  });
});
