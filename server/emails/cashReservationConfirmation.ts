/**
 * Email template for cash reservation confirmations
 * Sent when user reserves a spot and chooses to pay at door
 */

interface CashReservationEmailData {
  to: string;
  userName: string;
  itemType: "event" | "class";
  itemTitle: string;
  itemDate: Date | string;
  venue?: string;
  price: string | number;
  qrCode: string; // Base64 data URL
  confirmationCode: string;
  paymentInstructions?: string;
}

export function generateCashReservationEmail(data: CashReservationEmailData): string {
  const formattedDate = new Date(data.itemDate).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemTypeLabel = data.itemType === "event" ? "Event" : "Class";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservation Confirmed - UK Sabor</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FA3698 0%, #FD4D43 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ✅ Spot Reserved!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Your reservation is confirmed
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0; font-size: 16px; color: #374151;">
                Hi ${data.userName},
              </p>
              <p style="margin: 15px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Great news! Your spot has been reserved for:
              </p>
            </td>
          </tr>

          <!-- Event/Class Info -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${itemTypeLabel}
                    </p>
                    <h2 style="margin: 8px 0 15px 0; font-size: 24px; color: #111827; font-weight: bold;">
                      ${data.itemTitle}
                    </h2>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                      📅 ${formattedDate}
                    </p>
                    ${data.venue ? `
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
                      📍 ${data.venue}
                    </p>
                    ` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR Code -->
          <tr>
            <td style="padding: 0 30px 20px 30px;" align="center">
              <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #374151;">
                Your Check-In QR Code
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 4px solid #FA3698; border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <img src="${data.qrCode}" alt="QR Code" width="200" height="200" style="display: block;" />
                  </td>
                </tr>
              </table>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #9ca3af;">
                Show this QR code at the door for quick check-in
              </p>
            </td>
          </tr>

          <!-- Payment Warning -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400e;">
                      ⚠️ IMPORTANT: Payment Required at Door
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #78350f; line-height: 1.6;">
                      ${data.paymentInstructions || `Please bring £${data.price} in cash. Payment must be made at the door before entry.`}
                    </p>
                    <div style="margin: 15px 0 0 0; text-align: center; background-color: #fde68a; border-radius: 6px; padding: 12px;">
                      <p style="margin: 0; font-size: 28px; font-weight: bold; color: #78350f;">
                        £${data.price}
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 12px; color: #92400e;">
                        CASH ONLY
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Confirmation Code -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #f9fafb; border-radius: 8px; padding: 15px;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">
                      Confirmation Code
                    </p>
                    <p style="margin: 8px 0 0 0; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #111827;">
                      ${data.confirmationCode}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tips -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #dbeafe; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e40af;">
                      💡 Pro Tips:
                    </p>
                    <ul style="margin: 10px 0 0 20px; padding: 0; font-size: 13px; color: #1e3a8a; line-height: 1.8;">
                      <li>Download this email or save the QR code to your phone</li>
                      <li>Arrive 10-15 minutes early to check in</li>
                      <li>Bring exact change if possible</li>
                      <li>Have your QR code ready to scan</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Questions? Reply to this email or visit our website.
              </p>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} UK Sabor. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text version for email clients that don't support HTML
 */
export function generateCashReservationEmailPlainText(data: CashReservationEmailData): string {
  const formattedDate = new Date(data.itemDate).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemTypeLabel = data.itemType === "event" ? "Event" : "Class";

  return `
✅ SPOT RESERVED - UK Sabor

Hi ${data.userName},

Great news! Your spot has been reserved for:

${itemTypeLabel.toUpperCase()}: ${data.itemTitle}
📅 ${formattedDate}
${data.venue ? `📍 ${data.venue}` : ""}

⚠️ IMPORTANT: PAYMENT REQUIRED AT DOOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.paymentInstructions || `Please bring £${data.price} in cash.`}

AMOUNT TO PAY: £${data.price} (CASH ONLY)

CONFIRMATION CODE: ${data.confirmationCode}

💡 PRO TIPS:
• Save this email or take a screenshot of your confirmation code
• Arrive 10-15 minutes early to check in
• Bring exact change if possible
• Have your QR code ready to scan

Questions? Reply to this email or visit our website.

© ${new Date().getFullYear()} UK Sabor
  `.trim();
}
