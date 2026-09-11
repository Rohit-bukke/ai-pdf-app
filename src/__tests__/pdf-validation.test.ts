import { describe, it, expect } from "vitest";
import { validatePdfSignature, validatePdfFile } from "../lib/storage/supabase";
import { BadRequestError } from "../lib/errors";

describe("PDF Upload Security & File Signature Validation", () => {
  it("validates authentic PDF buffer starting with %PDF- (0x25 0x50 0x44 0x46 0x2D)", () => {
    // Standard PDF header '%PDF-1.4'
    const pdfBuffer = Buffer.from("%PDF-1.4 sample pdf stream content");
    expect(validatePdfSignature(pdfBuffer)).toBe(true);
    expect(() => validatePdfFile(pdfBuffer, pdfBuffer.length)).not.toThrow();
  });

  it("rejects malicious/spoofed files (e.g. EXE disguised as PDF)", () => {
    // MZ header (Windows executable)
    const exeBuffer = Buffer.from("MZ90\x00\x03\x00\x00\x00\x04\x00\x00");
    expect(validatePdfSignature(exeBuffer)).toBe(false);
    expect(() => validatePdfFile(exeBuffer, exeBuffer.length)).toThrow(BadRequestError);
  });

  it("rejects image/PNG files disguised as PDF", () => {
    // PNG header \x89PNG
    const pngBuffer = Buffer.from("\x89PNG\r\n\x1a\n");
    expect(validatePdfSignature(pngBuffer)).toBe(false);
    expect(() => validatePdfFile(pngBuffer, pngBuffer.length)).toThrow(BadRequestError);
  });

  it("rejects oversized documents exceeding 20 MB", () => {
    const validHeader = Buffer.from("%PDF-1.7 text data");
    const over20MB = 21 * 1024 * 1024;
    expect(() => validatePdfFile(validHeader, over20MB)).toThrow("File size exceeds the maximum limit of 20MB");
  });
});
