import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";
import { validateEmail } from "../utils/validation";

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@cashelan.com";
const fromName = process.env.SENDGRID_FROM_NAME || "Cash Elan Bank";

if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

/**
 * Send OTP via Email using SendGrid
 */
export const sendOTPEmail = async (
  email: string,
  otp: string,
  userName: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate email
    if (!validateEmail(email)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    // Check if SendGrid is configured
    if (!sendGridApiKey) {
      console.warn("SendGrid not configured, skipping email send");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    // HTML email template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #F6B800 0%, #FFA000 100%);
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              color: #fff;
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #fff;
              padding: 40px 30px;
              border: 1px solid #e5e5e5;
              border-top: none;
            }
            .otp-box {
              background: #FFF8E1;
              border: 2px solid #F6B800;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #222;
              margin: 10px 0;
            }
            .warning {
              background: #FFF3E0;
              border-left: 4px solid #FF6B6B;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning-icon {
              color: #FF6B6B;
              font-weight: bold;
            }
            .footer {
              background: #f5f5f5;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #888;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #F6B800;
              color: #fff;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏦 Cash Elan Bank</h1>
          </div>

          <div class="content">
            <h2>Hello ${userName},</h2>

            <p>You requested a verification code for your Cash Elan account. Please use the code below to complete your verification:</p>

            <div class="otp-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #666; font-size: 12px;">Valid for 5 minutes</p>
            </div>

            <p>Enter this code in the Cash Elan app to proceed with your transaction.</p>

            <div class="warning">
              <p style="margin: 0;">
                <span class="warning-icon">⚠️</span>
                <strong>Security Notice:</strong> Never share this code with anyone, including Cash Elan staff.
                We will never ask for your verification code via phone, email, or text message.
              </p>
            </div>

            <p>If you didn't request this code, please ignore this email or contact our support team immediately if you suspect unauthorized access to your account.</p>

            <p style="margin-top: 30px;">
              <strong>Need help?</strong><br>
              Contact us at <a href="mailto:support@cashelan.com">support@cashelan.com</a>
            </p>
          </div>

          <div class="footer">
            <p>This is an automated message from Cash Elan Bank. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Cash Elan Bank. All rights reserved.</p>
            <p style="margin-top: 10px;">
              <a href="#" style="color: #888; margin: 0 10px;">Privacy Policy</a> |
              <a href="#" style="color: #888; margin: 0 10px;">Terms of Service</a> |
              <a href="#" style="color: #888; margin: 0 10px;">Contact Us</a>
            </p>
          </div>
        </body>
      </html>
    `;

    // Plain text fallback
    const text = `
Cash Elan Bank - Verification Code

Hello ${userName},

Your verification code is: ${otp}

This code is valid for 5 minutes. Please enter it in the Cash Elan app to complete your verification.

⚠️ Security Notice: Never share this code with anyone, including Cash Elan staff.

If you didn't request this code, please ignore this email or contact support@cashelan.com

Best regards,
Cash Elan Bank Team
    `.trim();

    // Send email
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: `Cash Elan - Your Verification Code is ${otp}`,
      text,
      html,
    };

    await sgMail.send(msg);

    console.log(`OTP email sent successfully to ${email}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error sending OTP email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
};

/**
 * Send transaction notification email
 */
export const sendTransactionEmail = async (
  email: string,
  userName: string,
  transactionDetails: {
    type: string;
    amount: number;
    description: string;
    reference: string;
    timestamp: Date;
    balance: number;
  },
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!sendGridApiKey) {
      return { success: false, error: "Email service not configured" };
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F6B800; padding: 20px; text-align: center; color: #fff; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; }
            .transaction-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e5e5; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #222; }
            .amount { font-size: 24px; font-weight: bold; color: #F6B800; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Cash Elan Bank</h1>
            <p>Transaction Notification</p>
          </div>

          <div class="content">
            <h2>Hello ${userName},</h2>

            <p>A transaction has been processed on your Cash Elan account.</p>

            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">Transaction Type:</span>
                <span class="detail-value">${transactionDetails.type}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="amount">PHP ${transactionDetails.amount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${transactionDetails.description}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reference:</span>
                <span class="detail-value">${transactionDetails.reference}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${transactionDetails.timestamp.toLocaleString()}</span>
              </div>
              <div class="detail-row" style="border: none;">
                <span class="detail-label">Current Balance:</span>
                <span class="detail-value" style="font-weight: bold;">PHP ${transactionDetails.balance.toLocaleString()}</span>
              </div>
            </div>

            <p>If you did not authorize this transaction, please contact our support team immediately.</p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Cash Elan Bank. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const msg = {
      to: email,
      from: { email: fromEmail, name: fromName },
      subject: `Cash Elan - Transaction Alert: PHP ${transactionDetails.amount.toLocaleString()}`,
      html,
    };

    await sgMail.send(msg);

    return { success: true };
  } catch (error: any) {
    console.error("Error sending transaction email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Log email activity
 */
export const logEmailActivity = async (
  userId: string,
  email: string,
  emailType: string,
  status: string,
  error?: string,
): Promise<void> => {
  try {
    await admin.firestore().collection("email_logs").add({
      userId,
      email,
      emailType,
      status,
      error: error || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging email activity:", error);
  }
};
