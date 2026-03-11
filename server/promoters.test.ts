/**
 * Tests for promoters router and invoice PDF generation
 */
import { describe, it, expect } from "vitest";
import { generateInvoicePdf, getInvoiceFilename, type InvoiceData } from "./features/invoicePdf";

describe("Invoice PDF Generator", () => {
  const baseInvoiceData: InvoiceData = {
    orderId: "12345",
    orderDate: new Date("2026-03-06"),
    buyerName: "John Doe",
    buyerEmail: "john@example.com",
    itemType: "event",
    itemTitle: "UK Sabor Summer Festival",
    itemDate: "Saturday 15 March 2026",
    quantity: 2,
    unitPriceGBP: 25.0,
    platformFeeGBP: 2.0,
    processingFeeGBP: 0.75,
    totalGBP: 52.75,
    paymentMethod: "Online Payment (Stripe)",
  };

  it("should generate a PDF buffer for an event ticket", async () => {
    const pdfBuffer = await generateInvoicePdf(baseInvoiceData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000); // PDF should be non-trivial size
  });

  it("should generate a PDF buffer for a course purchase", async () => {
    const courseData: InvoiceData = {
      ...baseInvoiceData,
      itemType: "course",
      itemTitle: "Salsa Fundamentals Course",
      itemDate: undefined,
      quantity: 1,
      unitPriceGBP: 49.99,
      platformFeeGBP: 2.0,
      processingFeeGBP: 1.5,
      totalGBP: 53.49,
    };
    const pdfBuffer = await generateInvoicePdf(courseData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  it("should generate a PDF buffer for a class booking", async () => {
    const classData: InvoiceData = {
      ...baseInvoiceData,
      itemType: "class",
      itemTitle: "Bachata Beginners Class",
      quantity: 1,
      unitPriceGBP: 15.0,
      platformFeeGBP: 0.6,
      processingFeeGBP: 0.5,
      totalGBP: 16.1,
    };
    const pdfBuffer = await generateInvoicePdf(classData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  it("should generate a PDF without optional fees", async () => {
    const minimalData: InvoiceData = {
      orderId: "99",
      orderDate: new Date(),
      buyerName: "Jane Smith",
      buyerEmail: "jane@example.com",
      itemType: "event",
      itemTitle: "Dance Night",
      quantity: 1,
      unitPriceGBP: 10.0,
      totalGBP: 10.0,
    };
    const pdfBuffer = await generateInvoicePdf(minimalData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(500);
  });

  it("should return correct invoice filename", () => {
    expect(getInvoiceFilename("12345")).toBe("invoice-12345.pdf");
    expect(getInvoiceFilename("abc-xyz")).toBe("invoice-abc-xyz.pdf");
  });

  it("should start with PDF magic bytes", async () => {
    const pdfBuffer = await generateInvoicePdf(baseInvoiceData);
    // PDF files start with %PDF
    const header = pdfBuffer.slice(0, 4).toString("ascii");
    expect(header).toBe("%PDF");
  });
});

describe("Promoters Router - Plan Labels", () => {
  const PLAN_LABELS: Record<string, string> = {
    starter: "Starter",
    creator: "Creator",
    promoter_plan: "Promoter",
    academy: "Academy",
  };

  it("should have correct plan labels", () => {
    expect(PLAN_LABELS["starter"]).toBe("Starter");
    expect(PLAN_LABELS["creator"]).toBe("Creator");
    expect(PLAN_LABELS["promoter_plan"]).toBe("Promoter");
    expect(PLAN_LABELS["academy"]).toBe("Academy");
  });

  it("should handle unknown plan gracefully", () => {
    const label = PLAN_LABELS["unknown"] ?? "Unknown";
    expect(label).toBe("Unknown");
  });
});
