const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const { authenticateToken, authorize } = require('../middleware/auth.simple');

// Path to store email configuration
const CONFIG_FILE = path.join(__dirname, '../config/email.config.json');

// Get email configuration
router.get('/email-config', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        let config = {
            smtpHost: process.env.SMTP_HOST || '',
            smtpPort: process.env.SMTP_PORT || '587',
            smtpSecure: process.env.SMTP_SECURE === 'true',
            smtpUser: process.env.SMTP_USER || '',
            smtpPassword: '', // Never send password to frontend
            emailFrom: process.env.EMAIL_FROM || '',
            enabled: true
        };

        // Try to load from config file if exists
        try {
            const fileData = await fs.readFile(CONFIG_FILE, 'utf-8');
            const savedConfig = JSON.parse(fileData);
            config = { ...config, ...savedConfig, smtpPassword: '' }; // Don't expose password
        } catch (err) {
            // File doesn't exist or is invalid, use env variables
        }

        // Check if email service is configured
        const emailService = require('../services/email.service');
        const status = emailService.isConfigured() ? 'connected' : 'not-configured';

        res.json({
            success: true,
            config,
            status
        });
    } catch (error) {
        console.error('Error loading email config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load email configuration'
        });
    }
});

// Save email configuration
router.post('/email-config', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword, emailFrom, enabled } = req.body;

        // Validate required fields
        if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !emailFrom) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Create config object
        const config = {
            smtpHost,
            smtpPort,
            smtpSecure,
            smtpUser,
            smtpPassword,
            emailFrom,
            enabled,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.email
        };

        // Ensure config directory exists
        const configDir = path.dirname(CONFIG_FILE);
        try {
            await fs.access(configDir);
        } catch {
            await fs.mkdir(configDir, { recursive: true });
        }

        // Save to JSON file
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

        // Also update .env file for persistence
        await updateEnvFile(config);

        res.json({
            success: true,
            message: 'Email configuration saved successfully. Please restart the backend server for changes to take effect.'
        });
    } catch (error) {
        console.error('Error saving email config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save email configuration'
        });
    }
});

// Test email connection
router.post('/email-config/test', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword } = req.body;

        // Create test transporter
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPassword
            },
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
        });

        // Verify connection
        await transporter.verify();

        res.json({
            success: true,
            message: 'SMTP connection successful!'
        });
    } catch (error) {
        console.error('SMTP connection test failed:', error);
        res.status(400).json({
            success: false,
            message: `Connection failed: ${error.message}`
        });
    }
});

// Send test email
router.post('/email-config/send-test', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword, emailFrom, testEmail } = req.body;

        if (!testEmail) {
            return res.status(400).json({
                success: false,
                message: 'Test email address is required'
            });
        }

        // Create test transporter
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPassword
            },
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
        });

        // Send test email
        const info = await transporter.sendMail({
            from: emailFrom,
            to: testEmail,
            subject: 'SkyRakSys HRM - Test Email',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
                        .content { background: #f8fafc; padding: 30px; margin-top: 20px; border-radius: 10px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ Test Email Successful!</h1>
                        </div>
                        <div class="content">
                            <p>Congratulations! Your email configuration is working correctly.</p>
                            <p><strong>Configuration Details:</strong></p>
                            <ul>
                                <li>SMTP Host: ${smtpHost}</li>
                                <li>SMTP Port: ${smtpPort}</li>
                                <li>From Address: ${emailFrom}</li>
                                <li>Test Time: ${new Date().toLocaleString()}</li>
                            </ul>
                            <p>You can now send welcome emails, password resets, and other notifications from your HRM system.</p>
                        </div>
                        <div class="footer">
                            <p>SkyRakSys HRM System - Email Test</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('Test email sent:', info.messageId);

        res.json({
            success: true,
            message: `Test email sent successfully to ${testEmail}`,
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Failed to send test email:', error);
        res.status(400).json({
            success: false,
            message: `Failed to send test email: ${error.message}`
        });
    }
});

// Helper function to update .env file
async function updateEnvFile(config) {
    try {
        const envPath = path.join(__dirname, '../.env');
        let envContent = '';

        // Try to read existing .env
        try {
            envContent = await fs.readFile(envPath, 'utf-8');
        } catch {
            envContent = '';
        }

        // Parse existing env
        const envLines = envContent.split('\n');
        const envVars = {};
        envLines.forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                envVars[match[1].trim()] = match[2].trim();
            }
        });

        // Update email config
        envVars.SMTP_HOST = config.smtpHost;
        envVars.SMTP_PORT = config.smtpPort;
        envVars.SMTP_SECURE = config.smtpSecure.toString();
        envVars.SMTP_USER = config.smtpUser;
        envVars.SMTP_PASSWORD = config.smtpPassword;
        envVars.EMAIL_FROM = config.emailFrom;

        // Rebuild .env content
        const newEnvContent = Object.entries(envVars)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Write back to .env
        await fs.writeFile(envPath, newEnvContent, 'utf-8');

        console.log('✅ .env file updated successfully');
    } catch (error) {
        console.error('⚠️ Failed to update .env file:', error.message);
        // Don't throw error, as config is already saved to JSON file
    }
}

module.exports = router;
