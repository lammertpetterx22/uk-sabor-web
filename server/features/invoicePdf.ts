/**
 * Invoice PDF Generator
 * Generates branded PDF invoices for UK Sabor ticket/course/class purchases.
 */
import PDFDocument from "pdfkit";

export interface InvoiceData {
  orderId: string;
  orderDate: Date;
  buyerName: string;
  buyerEmail: string;
  itemType: "event" | "course" | "class";
  itemTitle: string;
  itemDate?: string; // e.g. "Saturday 15 March 2026"
  itemVenue?: string;
  quantity: number;
  unitPriceGBP: number;
  platformFeeGBP?: number;
  processingFeeGBP?: number;
  totalGBP: number;
  paymentMethod?: string;
}

function formatGBP(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

/**
 * Generate a PDF invoice and return it as a Buffer.
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 120; // accounting for margins

    // ── Header ──────────────────────────────────────────────────────────────
    // Brand bar
    doc.rect(60, 50, pageWidth, 4).fill("#e63946");
    doc.moveDown(0.5);

    // Logo / Brand name
    doc
      .font("Helvetica-Bold")
      .fontSize(28)
      .fillColor("#e63946")
      .text("UK SABOR", 60, 70);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#888888")
      .text("Dance Events & Online Courses", 60, 102);

    // Invoice label (top-right)
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#1a1a2e")
      .text("INVOICE", 0, 70, { align: "right" });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#888888")
      .text(`Invoice #${data.orderId}`, 0, 100, { align: "right" })
      .text(`Date: ${data.orderDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, 0, 113, { align: "right" });

    // Divider
    doc.moveTo(60, 135).lineTo(60 + pageWidth, 135).strokeColor("#e0e0e0").lineWidth(1).stroke();

    // ── Bill To ──────────────────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888888")
      .text("BILL TO", 60, 150);

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#1a1a2e")
      .text(data.buyerName, 60, 165);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#555555")
      .text(data.buyerEmail, 60, 181);

    // ── Items Table ──────────────────────────────────────────────────────────
    const tableTop = 230;
    const col1 = 60;
    const col2 = 340;
    const col3 = 420;
    const col4 = 490;

    // Table header background
    doc.rect(col1, tableTop - 8, pageWidth, 24).fill("#1a1a2e");

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#ffffff")
      .text("DESCRIPTION", col1 + 8, tableTop)
      .text("QTY", col2, tableTop, { width: 60, align: "center" })
      .text("UNIT PRICE", col3, tableTop, { width: 60, align: "right" })
      .text("AMOUNT", col4, tableTop, { width: 70, align: "right" });

    // Row 1: ticket/course/class
    const row1Y = tableTop + 30;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1a1a2e")
      .text(data.itemTitle, col1 + 8, row1Y, { width: 260 });

    const typeLabel = data.itemType === "event" ? "Event Ticket" : data.itemType === "course" ? "Online Course" : "Dance Class";
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#888888")
      .text(typeLabel, col1 + 8, row1Y + 14, { width: 260 });

    if (data.itemDate) {
      doc.text(data.itemDate, col1 + 8, row1Y + 26, { width: 260 });
    }
    if (data.itemVenue) {
      doc.text(data.itemVenue, col1 + 8, row1Y + 38, { width: 260 });
    }

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#1a1a2e")
      .text(String(data.quantity), col2, row1Y, { width: 60, align: "center" })
      .text(formatGBP(data.unitPriceGBP), col3, row1Y, { width: 60, align: "right" })
      .text(formatGBP(data.unitPriceGBP * data.quantity), col4, row1Y, { width: 70, align: "right" });

    let currentY = row1Y + (data.itemVenue ? 60 : data.itemDate ? 48 : 30);

    // Row separator
    doc.moveTo(col1, currentY).lineTo(col1 + pageWidth, currentY).strokeColor("#e0e0e0").lineWidth(0.5).stroke();
    currentY += 10;

    // Platform fee row (if present)
    if (data.platformFeeGBP && data.platformFeeGBP > 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#555555")
        .text("Platform fee", col1 + 8, currentY, { width: 260 })
        .text("1", col2, currentY, { width: 60, align: "center" })
        .text(formatGBP(data.platformFeeGBP), col3, currentY, { width: 60, align: "right" })
        .text(formatGBP(data.platformFeeGBP), col4, currentY, { width: 70, align: "right" });
      currentY += 20;
      doc.moveTo(col1, currentY).lineTo(col1 + pageWidth, currentY).strokeColor("#e0e0e0").lineWidth(0.5).stroke();
      currentY += 10;
    }

    // Processing fee row (if present)
    if (data.processingFeeGBP && data.processingFeeGBP > 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#555555")
        .text("Payment processing fee", col1 + 8, currentY, { width: 260 })
        .text("1", col2, currentY, { width: 60, align: "center" })
        .text(formatGBP(data.processingFeeGBP), col3, currentY, { width: 60, align: "right" })
        .text(formatGBP(data.processingFeeGBP), col4, currentY, { width: 70, align: "right" });
      currentY += 20;
      doc.moveTo(col1, currentY).lineTo(col1 + pageWidth, currentY).strokeColor("#e0e0e0").lineWidth(0.5).stroke();
      currentY += 10;
    }

    // ── Totals ───────────────────────────────────────────────────────────────
    currentY += 10;

    // Total box
    doc.rect(col3 - 10, currentY - 8, pageWidth - (col3 - col1) + 10, 36).fill("#e63946");

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#ffffff")
      .text("TOTAL", col3 - 2, currentY, { width: 60, align: "right" })
      .text(formatGBP(data.totalGBP), col4, currentY, { width: 70, align: "right" });

    currentY += 50;

    // ── Payment Info ─────────────────────────────────────────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888888")
      .text("PAYMENT METHOD", col1, currentY);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#1a1a2e")
      .text(data.paymentMethod || "Online Payment (Stripe)", col1, currentY + 14);

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888888")
      .text("STATUS", col3, currentY);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#22c55e")
      .text("PAID", col3, currentY + 14);

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 80;
    doc.moveTo(60, footerY).lineTo(60 + pageWidth, footerY).strokeColor("#e0e0e0").lineWidth(1).stroke();

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#aaaaaa")
      .text("Thank you for your purchase! For questions, contact us at info@consabor.uk", 60, footerY + 10, { align: "center", width: pageWidth })
      .text("UK Sabor · consabor.uk · Dance Events & Online Courses", 60, footerY + 24, { align: "center", width: pageWidth });

    doc.end();
  });
}

/**
 * Generate a filename for the invoice.
 */
export function getInvoiceFilename(orderId: string): string {
  return `invoice-${orderId}.pdf`;
}
