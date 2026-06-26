import { describe, expect, it } from "vitest";
import { pesosToWords } from "./loan-utils";

describe("pesosToWords", () => {
  it("converts whole peso amounts", () => {
    expect(pesosToWords(5000)).toBe("Five thousand pesos only");
    expect(pesosToWords(1)).toBe("One peso only");
    expect(pesosToWords(0)).toBe("Zero pesos only");
    expect(pesosToWords(100)).toBe("One hundred pesos only");
    expect(pesosToWords(125)).toBe("One hundred twenty-five pesos only");
  });

  it("converts large amounts across scales", () => {
    expect(pesosToWords(1_000_000)).toBe("One million pesos only");
    expect(pesosToWords(2_350_000)).toBe(
      "Two million three hundred fifty thousand pesos only"
    );
  });

  it("includes centavos when present", () => {
    expect(pesosToWords(1250.5)).toBe(
      "One thousand two hundred fifty pesos and fifty centavos only"
    );
    expect(pesosToWords(0.01)).toBe("Zero pesos and one centavo only");
  });

  it("accepts string input with commas and rejects invalid", () => {
    expect(pesosToWords("12,500")).toBe("Twelve thousand five hundred pesos only");
    expect(pesosToWords("")).toBe("");
    expect(pesosToWords("abc")).toBe("");
    expect(pesosToWords(-5)).toBe("");
  });
});
