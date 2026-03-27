import { sendEmail } from "./email";

/**
 * Send payout confirmation email to instructor
 */
export async function sendPayoutConfirmationEmail(params: {
  to: string;
  userName: string;
  amount: number;
  requestId: number;
  proofUrl: string;
}): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background: #000000;
            margin: 0;
            padding: 20px 0;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #000000;
            border-radius: 16px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #ff1493 0%, #ff8c00 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
          }
          .content {
            padding: 40px 30px;
            background: #000000;
          }
          .content h2 {
            color: #ff1493;
            margin: 0 0 20px 0;
            font-size: 24px;
          }
          .content p {
            margin: 15px 0;
            font-size: 16px;
            color: #e5e5e5;
          }
          .amount-box {
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            border-left: 4px solid #22c55e;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
          }
          .amount {
            font-size: 48px;
            font-weight: 800;
            color: #22c55e;
            margin: 10px 0;
          }
          .info-box {
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            border-left: 4px solid #ff1493;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #333;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            color: #b3b3b3;
            font-size: 14px;
          }
          .value {
            color: #ffffff;
            font-weight: 600;
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
          }
          .footer {
            background: #000000;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #1a1a1a;
            color: #666666;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>💸 Payout Completed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.userName},</h2>
            <p>Great news! Your withdrawal request has been processed and the money has been transferred to your bank account.</p>

            <div class="amount-box">
              <p style="color: #b3b3b3; margin: 0;">Amount Transferred</p>
              <div class="amount">£${params.amount.toFixed(2)}</div>
            </div>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Request ID</span>
                <span class="value">#${params.requestId}</span>
              </div>
              <div class="info-row">
                <span class="label">Status</span>
                <span class="value" style="color: #22c55e;">✅ Paid</span>
              </div>
              <div class="info-row">
                <span class="label">Expected Arrival</span>
                <span class="value">1-3 business days</span>
              </div>
            </div>

            <p style="color: #b3b3b3; font-size: 14px;">
              The transfer proof has been attached. Please allow 1-3 business days for the funds to appear in your bank account.
            </p>

            <div style="text-align: center;">
              <a href="https://www.consabor.uk/dashboard" class="cta-button">
                View Dashboard
              </a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #b3b3b3;">
              If you have any questions, contact us at <a href="mailto:info@consabor.uk" style="color: #ff1493; text-decoration: none;">info@consabor.uk</a>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} UK Sabor. All rights reserved.</p>
            <p style="margin: 10px 0 0 0;">This is an automated message.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Hi ${params.userName},

Great news! Your withdrawal request has been processed.

Amount Transferred: £${params.amount.toFixed(2)}
Request ID: #${params.requestId}
Status: ✅ Paid
Expected Arrival: 1-3 business days

The money has been transferred to your bank account. Please allow 1-3 business days for the funds to appear.

View your dashboard: https://www.consabor.uk/dashboard

Questions? Contact us at info@consabor.uk

© ${new Date().getFullYear()} UK Sabor. All rights reserved.
  `.trim();

  return await sendEmail({
    to: params.to,
    subject: "💸 Payout Completed - £" + params.amount.toFixed(2) + " | UK Sabor",
    htmlContent,
    textContent,
  });
}
