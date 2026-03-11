import { describe, it, expect, vi } from "vitest";
import { generateQRCodeEmailTemplate, generateQRCodeEmailText } from "./features/email";

describe("Email Service", () => {
  describe("generateQRCodeEmailTemplate", () => {
    it("generates HTML email with recipient name", () => {
      const html = generateQRCodeEmailTemplate(
        "John Doe",
        "event",
        "Salsa Night",
        "data:image/png;base64,abc123",
        "UK-TEST1234"
      );
      expect(html).toContain("John Doe");
      expect(html).toContain("Salsa Night");
      expect(html).toContain("UK-TEST1234");
    });

    it("includes QR code image in email", () => {
      const html = generateQRCodeEmailTemplate(
        "Jane",
        "class",
        "Bachata Beginners",
        "data:image/png;base64,xyz",
        "CLS-ABCD5678"
      );
      expect(html).toContain("data:image/png;base64,xyz");
      expect(html).toContain("CLS-ABCD5678");
    });

    it("includes event date and time when provided", () => {
      const html = generateQRCodeEmailTemplate(
        "Test User",
        "event",
        "Latin Night",
        "data:image/png;base64,img",
        "UK-CODE123",
        "Monday, 9 March 2026",
        "19:30"
      );
      expect(html).toContain("Monday, 9 March 2026");
      expect(html).toContain("19:30");
    });

    it("shows correct item type label for event", () => {
      const html = generateQRCodeEmailTemplate("User", "event", "Event", "img", "CODE");
      expect(html).toContain("Event Check-In Code");
    });

    it("shows correct item type label for class", () => {
      const html = generateQRCodeEmailTemplate("User", "class", "Class", "img", "CODE");
      expect(html).toContain("Class Check-In Code");
    });
  });

  describe("generateQRCodeEmailText", () => {
    it("generates plain text email with code", () => {
      const text = generateQRCodeEmailText(
        "John",
        "event",
        "Salsa Night",
        "UK-TEST1234"
      );
      expect(text).toContain("John");
      expect(text).toContain("Salsa Night");
      expect(text).toContain("UK-TEST1234");
    });

    it("includes check-in instructions", () => {
      const text = generateQRCodeEmailText("User", "class", "Class", "CLS-CODE");
      expect(text).toContain("HOW TO USE");
    });
  });

  describe("sendEmail configuration", () => {
    it("exports sendEmail function", async () => {
      const { sendEmail } = await import("./features/email");
      expect(typeof sendEmail).toBe("function");
    });

    it("exports sendQRCodeEmail function", async () => {
      const { sendQRCodeEmail } = await import("./features/email");
      expect(typeof sendQRCodeEmail).toBe("function");
    });

    it("exports sendOrderConfirmationEmail function", async () => {
      const { sendOrderConfirmationEmail } = await import("./features/email");
      expect(typeof sendOrderConfirmationEmail).toBe("function");
    });
  });
});
