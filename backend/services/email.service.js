const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'noreply@skyraksys.com';
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn('⚠️  Email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service connection failed:', error.message);
        } else {
          console.log('✅ Email service ready');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      throw new Error('Email service not configured. Please set SMTP credentials in .env file.');
    }

    try {
      const mailOptions = {
        from: this.from,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(user, tempPassword) {
    const subject = 'Welcome to SkyRakSys HRM System';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .credentials-box {
            background: white;
            border: 2px solid #6366f1;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .credential-row:last-child {
            border-bottom: none;
          }
          .credential-label {
            font-weight: 600;
            color: #64748b;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background: #f1f5f9;
            padding: 5px 10px;
            border-radius: 4px;
            color: #1e293b;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">🎉 Welcome to SkyRakSys HRM!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          
          <p>Your user account has been successfully created. You can now access the SkyRakSys Human Resources Management System.</p>
          
          <div class="credentials-box">
            <h3 style="margin-top: 0; color: #6366f1;">📝 Your Login Credentials</h3>
            <div class="credential-row">
              <span class="credential-label">Email:</span>
              <span class="credential-value">${user.email}</span>
            </div>
            <div class="credential-row">
              <span class="credential-label">Temporary Password:</span>
              <span class="credential-value">${tempPassword}</span>
            </div>
            <div class="credential-row">
              <span class="credential-label">Role:</span>
              <span class="credential-value">${user.role.toUpperCase()}</span>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Important:</strong> For security reasons, you will be required to change your password after your first login.
          </div>

          <center>
            <a href="${process.env.FRONTEND_URL || 'http://95.216.14.232'}" class="button">
              Login Now →
            </a>
          </center>

          <h3>🚀 Getting Started</h3>
          <ol>
            <li>Click the "Login Now" button above or visit the application URL</li>
            <li>Enter your email and temporary password</li>
            <li>You'll be prompted to create a new secure password</li>
            <li>Start exploring the system!</li>
          </ol>

          <h3>📞 Need Help?</h3>
          <p>If you have any questions or need assistance, please contact your HR administrator or IT support team.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from SkyRakSys HRM System</p>
          <p>© ${new Date().getFullYear()} SkyRakSys. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, tempPassword) {
    const subject = 'Password Reset - SkyRakSys HRM';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .credentials-box {
            background: white;
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .credential-row:last-child {
            border-bottom: none;
          }
          .credential-label {
            font-weight: 600;
            color: #64748b;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background: #fef2f2;
            padding: 5px 10px;
            border-radius: 4px;
            color: #991b1b;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">🔐 Password Reset</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          
          <p>Your password has been reset by an administrator. Use the temporary password below to log in.</p>
          
          <div class="credentials-box">
            <h3 style="margin-top: 0; color: #ef4444;">🔑 Your New Temporary Password</h3>
            <div class="credential-row">
              <span class="credential-label">Email:</span>
              <span class="credential-value">${user.email}</span>
            </div>
            <div class="credential-row">
              <span class="credential-label">Temporary Password:</span>
              <span class="credential-value">${tempPassword}</span>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong> You must change this temporary password immediately after logging in. This is for your account security.
          </div>

          <center>
            <a href="${process.env.FRONTEND_URL || 'http://95.216.14.232'}" class="button">
              Login Now →
            </a>
          </center>

          <h3>🔒 Security Tips</h3>
          <ul>
            <li>Never share your password with anyone</li>
            <li>Use a strong, unique password</li>
            <li>Enable two-factor authentication if available</li>
            <li>Report any suspicious activity immediately</li>
          </ul>

          <p><strong>Did you not request this password reset?</strong><br>
          Please contact your administrator immediately as your account security may be compromised.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from SkyRakSys HRM System</p>
          <p>© ${new Date().getFullYear()} SkyRakSys. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendAccountStatusChangeEmail(user, isActive) {
    const subject = `Account ${isActive ? 'Activated' : 'Deactivated'} - SkyRakSys HRM`;
    const color = isActive ? '#10b981' : '#64748b';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: ${color};
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .footer {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">${isActive ? '✅' : '🔒'} Account ${isActive ? 'Activated' : 'Deactivated'}</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          
          <p>Your SkyRakSys HRM account has been <strong>${isActive ? 'activated' : 'deactivated'}</strong> by an administrator.</p>
          
          ${isActive ? 
            '<p>You can now log in and access the system with your existing credentials.</p>' :
            '<p>You will not be able to log in until your account is reactivated. Please contact your administrator if you believe this is an error.</p>'
          }
        </div>
        <div class="footer">
          <p>This is an automated message from SkyRakSys HRM System</p>
          <p>© ${new Date().getFullYear()} SkyRakSys. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Utility function to strip HTML tags for plain text version
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Check if email service is configured
  isConfigured() {
    return this.transporter !== null;
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
