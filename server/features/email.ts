import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Premium Email Template Base
 * Consistent design across all UK Sabor emails
 */
function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            margin: 0;
            padding: 20px 0;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(255, 20, 147, 0.15), 0 8px 16px rgba(0, 0, 0, 0.2);
          }
          .header {
            background: linear-gradient(135deg, #ff1493 0%, #ff8c00 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 8s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          .logo-container {
            position: relative;
            z-index: 1;
            margin-bottom: 20px;
          }
          .logo {
            width: 120px;
            height: auto;
            display: inline-block;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
          }
          .header-title {
            position: relative;
            z-index: 1;
            margin: 0;
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            letter-spacing: -0.5px;
          }
          .header-subtitle {
            position: relative;
            z-index: 1;
            margin: 10px 0 0 0;
            font-size: 16px;
            color: rgba(255, 255, 255, 0.95);
            font-weight: 500;
          }
          .content {
            padding: 40px 30px;
            background: #ffffff;
          }
          .content h2 {
            color: #ff1493;
            margin: 0 0 20px 0;
            font-size: 24px;
            font-weight: 700;
          }
          .content p {
            margin: 15px 0;
            font-size: 16px;
            color: #333333;
            line-height: 1.6;
          }
          .feature-box {
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            border-left: 4px solid #ff1493;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
          }
          .feature {
            display: flex;
            align-items: start;
            margin: 18px 0;
          }
          .feature-icon {
            font-size: 28px;
            margin-right: 16px;
            flex-shrink: 0;
            line-height: 1;
          }
          .feature-content { flex: 1; }
          .feature h3 {
            margin: 0 0 6px 0;
            font-size: 18px;
            color: #1a1a1a;
            font-weight: 600;
          }
          .feature p {
            margin: 0;
            font-size: 14px;
            color: #666666;
            line-height: 1.5;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff1493 0%, #ff8c00 100%);
            color: #ffffff;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            margin: 25px 0;
            box-shadow: 0 8px 20px rgba(255, 20, 147, 0.3);
            transition: all 0.3s ease;
            text-align: center;
          }
          .cta-button:hover {
            box-shadow: 0 12px 28px rgba(255, 20, 147, 0.4);
            transform: translateY(-2px);
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e5e5e5 50%, transparent 100%);
            margin: 30px 0;
          }
          .footer {
            background: linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%);
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e5e5;
          }
          .footer-brand {
            font-weight: 700;
            font-size: 18px;
            background: linear-gradient(135deg, #ff1493 0%, #ff8c00 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
          }
          .footer p {
            font-size: 13px;
            color: #666666;
            margin: 8px 0;
          }
          .footer a {
            color: #ff1493;
            text-decoration: none;
            font-weight: 600;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .social-links {
            margin: 20px 0 10px 0;
          }
          .social-links a {
            display: inline-block;
            margin: 0 8px;
            font-size: 24px;
            text-decoration: none;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper { border-radius: 0; margin: 0; }
            .header { padding: 30px 20px; }
            .header-title { font-size: 26px; }
            .content { padding: 30px 20px; }
            .cta-button { padding: 14px 30px; font-size: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo-container">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png" alt="UK Sabor" class="logo" />
            </div>
            ${content.includes('HEADER_TITLE') ? '' : '<h1 class="header-title">UK Sabor</h1>'}
            ${content.includes('HEADER_SUBTITLE') ? '' : '<p class="header-subtitle">Latin Dance Community in the UK</p>'}
          </div>
          ${content}
          <div class="footer">
            <p class="footer-brand">UK SABOR</p>
            <p style="margin: 15px 0 5px 0; color: #999; font-size: 12px;">Tu comunidad de baile latino en el UK</p>
            <div class="divider" style="margin: 20px auto; max-width: 200px;"></div>
            <p><a href="https://www.consabor.uk">www.consabor.uk</a></p>
            <p><a href="mailto:info@consabor.uk">info@consabor.uk</a></p>
            <p style="margin-top: 20px; font-size: 11px; color: #999;">© ${new Date().getFullYear()} UK Sabor. All rights reserved.</p>
            <p style="font-size: 11px; color: #999; margin-top: 10px;">This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

/**
 * Send email using Resend (real email delivery).
 * Falls back to console logging if RESEND_API_KEY is not configured.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log("[EMAIL] sendEmail called with:", { to: options.to, subject: options.subject });

  const client = getResendClient();
  // Use Resend's verified onboarding domain until consabor.uk is verified
  const fromAddress = options.from || process.env.RESEND_FROM_EMAIL || "UK Sabor <onboarding@resend.dev>";

  console.log("[EMAIL] Resend client status:", { hasClient: !!client, fromAddress });
  console.log("[EMAIL] Environment check:", {
    hasApiKey: !!process.env.RESEND_API_KEY,
    hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
    apiKeyPreview: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET'
  });

  if (!client) {
    // Fallback: log email for debugging when no API key is set
    console.log("[EMAIL] ❌ No RESEND_API_KEY configured - logging email instead:");
    console.log(`[EMAIL] To: ${options.to}`);
    console.log(`[EMAIL] From: ${fromAddress}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
    console.log(`[EMAIL] Content preview: ${options.htmlContent.substring(0, 200)}...`);
    return true; // Return true so the flow doesn't break
  }

  try {
    console.log("[EMAIL] ✅ Resend client found - attempting to send email");

    const emailPayload: Parameters<typeof client.emails.send>[0] = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.htmlContent,
      text: options.textContent,
    };

    if (options.attachments && options.attachments.length > 0) {
      (emailPayload as any).attachments = options.attachments.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
        type: a.contentType,
        disposition: "attachment",
      }));
    }

    console.log("[EMAIL] Sending email via Resend API...");
    const { error } = await client.emails.send(emailPayload);

    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return false;
    }

    console.log(`[EMAIL] Sent successfully to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", error);
    return false;
  }
}

/**
 * Send QR code email to ticket buyer after successful payment
 */
export async function sendQRCodeEmail(options: {
  to: string;
  userName: string;
  itemType: "event" | "class";
  itemName: string;
  qrCodeImage: string;
  ticketCode?: string;
  accessCode?: string;
  eventDate?: string;
  eventTime?: string;
}): Promise<boolean> {
  try {
    const code = options.ticketCode || options.accessCode || "NO-CODE";
    const htmlContent = generateQRCodeEmailTemplate(
      options.userName,
      options.itemType,
      options.itemName,
      options.qrCodeImage,
      code,
      options.eventDate,
      options.eventTime
    );

    const textContent = generateQRCodeEmailText(
      options.userName,
      options.itemType,
      options.itemName,
      code,
      options.eventDate,
      options.eventTime
    );

    return await sendEmail({
      to: options.to,
      subject: `Your ${options.itemType === "event" ? "Event Ticket" : "Class Booking"} - ${options.itemName}`,
      htmlContent,
      textContent,
    });
  } catch (error) {
    console.error("[EMAIL] Failed to send QR code email:", error);
    return false;
  }
}

/**
 * Send order confirmation email after successful payment
 */
export async function sendOrderConfirmationEmail(options: {
  to: string;
  userName: string;
  orderId: number;
  itemType: "event" | "class" | "course";
  itemName: string;
  amount: number;
  currency?: string;
  invoicePdf?: Buffer;
}): Promise<boolean> {
  const currency = options.currency || "GBP";
  const currencySymbol = currency === "GBP" ? "£" : "$";
  const itemTypeLabel = options.itemType === "event" ? "Event Ticket" : options.itemType === "class" ? "Class Booking" : "Course Access";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff1493 0%, #ff8c00 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; }
          .content { padding: 30px 20px; }
          .order-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .order-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .order-row:last-child { border-bottom: none; font-weight: bold; font-size: 16px; }
          .label { color: #666; }
          .value { color: #333; font-weight: 500; }
          .total { color: #ff1493; font-size: 18px; font-weight: bold; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
          .badge { display: inline-block; background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${options.userName},</p>
            <p>Your payment has been confirmed. Here are your order details:</p>
            <div class="order-box">
              <div class="order-row">
                <span class="label">Order ID</span>
                <span class="value">#${options.orderId}</span>
              </div>
              <div class="order-row">
                <span class="label">Item</span>
                <span class="value">${options.itemName}</span>
              </div>
              <div class="order-row">
                <span class="label">Type</span>
                <span class="value">${itemTypeLabel}</span>
              </div>
              <div class="order-row">
                <span class="label">Status</span>
                <span class="value"><span class="badge">Confirmed</span></span>
              </div>
              <div class="order-row">
                <span class="label">Total Paid</span>
                <span class="total">${currencySymbol}${(options.amount / 100).toFixed(2)}</span>
              </div>
            </div>
            <p style="font-size: 14px; color: #666;">You will receive a separate email with your check-in QR code shortly.</p>
            <p style="font-size: 14px; color: #666;">If you have any questions, please contact us at <a href="mailto:info@consabor.uk">info@consabor.uk</a></p>
          </div>
          <div class="footer">
            <p>© 2026 UK Sabor. All rights reserved.</p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const attachments: EmailOptions["attachments"] = [];
  if (options.invoicePdf) {
    attachments.push({
      filename: `invoice-${options.orderId}.pdf`,
      content: options.invoicePdf,
      contentType: "application/pdf",
    });
  }

  return await sendEmail({
    to: options.to,
    subject: `Order Confirmed - ${options.itemName} | UK Sabor`,
    htmlContent,
    attachments,
  });
}

export function generateQRCodeEmailTemplate(
  recipientName: string,
  itemType: "event" | "class",
  itemTitle: string,
  qrCodeImage: string,
  qrCode: string,
  eventDate?: string,
  eventTime?: string
): string {
  const itemTypeLabel = itemType === "event" ? "Event" : "Class";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff1493 0%, #ff8c00 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 30px 20px; }
          .item-details { background-color: #f9f9f9; border-left: 4px solid #ff1493; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .item-details h3 { margin: 0 0 10px 0; color: #ff1493; }
          .item-details p { margin: 5px 0; font-size: 14px; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
          .qr-section h3 { margin-top: 0; color: #333; }
          .qr-image { max-width: 250px; height: auto; margin: 15px 0; border: 2px solid #ddd; padding: 10px; background-color: white; border-radius: 4px; }
          .qr-code-text { font-family: monospace; font-size: 14px; background-color: white; padding: 12px 16px; border-radius: 4px; border: 1px solid #ddd; word-break: break-all; margin-top: 10px; letter-spacing: 2px; font-weight: bold; color: #ff1493; }
          .instructions { background-color: #e8f4f8; border-left: 4px solid #0099cc; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
          .instructions h4 { margin-top: 0; color: #0099cc; }
          .instructions ol { margin: 10px 0; padding-left: 20px; }
          .instructions li { margin: 8px 0; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your ${itemTypeLabel} Check-In Code</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>Thank you for booking! Here's your check-in code for the upcoming ${itemTypeLabel.toLowerCase()}.</p>
            <div class="item-details">
              <h3>${itemTitle}</h3>
              <p><strong>Type:</strong> ${itemTypeLabel}</p>
              ${eventDate ? `<p><strong>Date:</strong> ${eventDate}</p>` : ""}
              ${eventTime ? `<p><strong>Time:</strong> ${eventTime}</p>` : ""}
            </div>
            <div class="qr-section">
              <h3>📱 Your Check-In QR Code</h3>
              <p>Show this at the entrance to check in:</p>
              <img src="${qrCodeImage}" alt="Check-in QR Code" class="qr-image">
              <div class="qr-code-text">${qrCode}</div>
            </div>
            <div class="instructions">
              <h4>How to Use Your Check-In Code:</h4>
              <ol>
                <li><strong>Show the QR code</strong> on your phone screen to the staff at the entrance</li>
                <li><strong>Or scan it</strong> with your phone camera if needed</li>
                <li><strong>Or give the code</strong> (${qrCode}) to staff if scanning doesn't work</li>
              </ol>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Questions? Contact us at <a href="mailto:info@consabor.uk">info@consabor.uk</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 UK Sabor. All rights reserved.</p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text version of QR code email
 */
export function generateQRCodeEmailText(
  recipientName: string,
  itemType: "event" | "class",
  itemTitle: string,
  qrCode: string,
  eventDate?: string,
  eventTime?: string
): string {
  const itemTypeLabel = itemType === "event" ? "Event" : "Class";

  return `
Hi ${recipientName},

Thank you for booking! Here's your check-in code for the upcoming ${itemTypeLabel.toLowerCase()}.

${itemTypeLabel}: ${itemTitle}
${eventDate ? `Date: ${eventDate}` : ""}
${eventTime ? `Time: ${eventTime}` : ""}

YOUR CHECK-IN CODE:
${qrCode}

HOW TO USE:
1. Show the QR code on your phone to the staff at the entrance
2. Or give the code above to staff if scanning doesn't work

Questions? Contact us at info@consabor.uk

© 2026 UK Sabor. All rights reserved.
  `.trim();
}

/**
 * Send welcome email to new user after registration
 */
export async function sendWelcomeEmail(options: {
  to: string;
  userName: string;
}): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            margin: 0;
            padding: 20px 0;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(255, 20, 147, 0.15), 0 8px 16px rgba(0, 0, 0, 0.2);
          }
          .header {
            background: linear-gradient(135deg, #ff1493 0%, #ff8c00 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 8s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          .logo-container {
            position: relative;
            z-index: 1;
            margin-bottom: 20px;
          }
          .logo {
            width: 120px;
            height: auto;
            display: inline-block;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
          }
          .header-title {
            position: relative;
            z-index: 1;
            margin: 0;
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            letter-spacing: -0.5px;
          }
          .header-subtitle {
            position: relative;
            z-index: 1;
            margin: 10px 0 0 0;
            font-size: 16px;
            color: rgba(255, 255, 255, 0.95);
            font-weight: 500;
          }
          .content {
            padding: 40px 30px;
            background: #ffffff;
          }
          .content h2 {
            color: #ff1493;
            margin: 0 0 20px 0;
            font-size: 24px;
            font-weight: 700;
          }
          .content p {
            margin: 15px 0;
            font-size: 16px;
            color: #333333;
            line-height: 1.6;
          }
          .feature-box {
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            border-left: 4px solid #ff1493;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
          }
          .feature {
            display: flex;
            align-items: start;
            margin: 18px 0;
          }
          .feature-icon {
            font-size: 28px;
            margin-right: 16px;
            flex-shrink: 0;
            line-height: 1;
          }
          .feature-content { flex: 1; }
          .feature h3 {
            margin: 0 0 6px 0;
            font-size: 18px;
            color: #1a1a1a;
            font-weight: 600;
          }
          .feature p {
            margin: 0;
            font-size: 14px;
            color: #666666;
            line-height: 1.5;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff1493 0%, #ff8c00 100%);
            color: #ffffff;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            margin: 25px 0;
            box-shadow: 0 8px 20px rgba(255, 20, 147, 0.3);
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e5e5e5 50%, transparent 100%);
            margin: 30px 0;
          }
          .footer {
            background: linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%);
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e5e5;
          }
          .footer-brand {
            font-weight: 700;
            font-size: 18px;
            background: linear-gradient(135deg, #ff1493 0%, #ff8c00 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
          }
          .footer p {
            font-size: 13px;
            color: #666666;
            margin: 8px 0;
          }
          .footer a {
            color: #ff1493;
            text-decoration: none;
            font-weight: 600;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper { border-radius: 0; margin: 0; }
            .header { padding: 30px 20px; }
            .header-title { font-size: 26px; }
            .content { padding: 30px 20px; }
            .cta-button { padding: 14px 30px; font-size: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo-container">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png" alt="UK Sabor" class="logo" />
            </div>
            <h1 class="header-title">🎉 ¡Bienvenido a UK Sabor!</h1>
            <p class="header-subtitle">Welcome to the UK's hottest Latin dance community</p>
          </div>
          <div class="content">
            <h2>Hola ${options.userName},</h2>
            <p>¡Gracias por unirte a UK Sabor! Estamos emocionados de tenerte en nuestra comunidad de baile latino.</p>
            <p>Tu cuenta ha sido creada exitosamente y ya puedes disfrutar de todo lo que tenemos para ti:</p>

            <div class="feature-box">
              <div class="feature">
                <div class="feature-icon">🎟️</div>
                <div class="feature-content">
                  <h3>Eventos de Baile</h3>
                  <p>Accede a los mejores eventos de salsa, bachata, y más en todo el UK</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">💃</div>
                <div class="feature-content">
                  <h3>Clases de Baile</h3>
                  <p>Aprende con los mejores instructores profesionales</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📚</div>
                <div class="feature-content">
                  <h3>Cursos Online</h3>
                  <p>Mejora tus habilidades con nuestros cursos en video</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">🎫</div>
                <div class="feature-content">
                  <h3>QR Codes</h3>
                  <p>Check-in fácil en eventos con tu código QR personal</p>
                </div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="https://www.consabor.uk/events" class="cta-button">
                Ver Próximos Eventos
              </a>
            </div>

            <div class="divider"></div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Si tienes alguna pregunta, no dudes en contactarnos en <a href="mailto:info@consabor.uk" style="color: #ff1493; text-decoration: none; font-weight: 600;">info@consabor.uk</a>
            </p>

            <p style="font-size: 16px; font-weight: 600; color: #ff1493; text-align: center; margin-top: 30px;">
              ¡Nos vemos en la pista de baile! 💃🕺
            </p>
          </div>
          <div class="footer">
            <p class="footer-brand">UK SABOR</p>
            <p style="margin: 15px 0 5px 0; color: #999; font-size: 12px;">Tu comunidad de baile latino en el UK</p>
            <div class="divider" style="margin: 20px auto; max-width: 200px;"></div>
            <p><a href="https://www.consabor.uk">www.consabor.uk</a></p>
            <p><a href="mailto:info@consabor.uk">info@consabor.uk</a></p>
            <p style="margin-top: 20px; font-size: 11px; color: #999;">© ${new Date().getFullYear()} UK Sabor. All rights reserved.</p>
            <p style="font-size: 11px; color: #999; margin-top: 10px;">This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Hola ${options.userName},

¡Bienvenido a UK Sabor!

Gracias por unirte a nuestra comunidad de baile latino. Tu cuenta ha sido creada exitosamente.

QUÉ PUEDES HACER AHORA:
- 🎟️ Comprar tickets para eventos de salsa, bachata, y más
- 💃 Inscribirte en clases de baile con instructores profesionales
- 📚 Acceder a cursos online para mejorar tus habilidades
- 🎫 Usar códigos QR para check-in fácil en eventos

Visita nuestra web: https://www.consabor.uk/events

¿Preguntas? Escríbenos a info@consabor.uk

¡Nos vemos en la pista de baile! 💃🕺

UK Sabor - Tu comunidad de baile latino en el UK
© 2026 UK Sabor. All rights reserved.
  `.trim();

  return await sendEmail({
    to: options.to,
    subject: "🎉 ¡Bienvenido a UK Sabor! Welcome to the dance community",
    htmlContent,
    textContent,
  });
}
