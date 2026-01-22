// backend/src/services/email.service.js
const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
const createTransporter = () => {
  // Use Gmail SMTP if credentials are provided, otherwise use env vars
  const emailUser = process.env.EMAIL_USER || 'donh51561@gmail.com';
  const emailPass = process.env.EMAIL_PASSWORD || 'Passwort1217!';
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = process.env.EMAIL_PORT || 587;

  // Gmail requires App Password if 2FA is enabled
  // If using regular password, ensure "Less secure app access" is enabled (deprecated by Google)
  // Recommended: Use App Password (16 characters, no spaces)
  
  return nodemailer.createTransport({
    host: emailHost,
    port: parseInt(emailPort),
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: false
    }
  });
};

/**
 * Send email
 * @param {Object} options - Email options (to, subject, html, text)
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `Resume Portal <${process.env.EMAIL_USER || 'donh51561@gmail.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('✗ Error sending email:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('\n⚠ GMAIL AUTHENTICATION ERROR:');
      console.error('Gmail requires an App Password (not your regular password).');
      console.error('\nSteps to fix:');
      console.error('1. Go to: https://myaccount.google.com/security');
      console.error('2. Enable 2-Step Verification (if not already enabled)');
      console.error('3. Go to: https://myaccount.google.com/apppasswords');
      console.error('4. Generate an App Password for "Mail"');
      console.error('5. Use the 16-character App Password (no spaces) in EMAIL_PASSWORD');
      console.error('\nOr set environment variables:');
      console.error('EMAIL_USER=donh51561@gmail.com');
      console.error('EMAIL_PASSWORD=<your-16-char-app-password>');
      console.error('\n');
    }
    
    throw error;
  }
};

/**
 * Send welcome email (using template system)
 */
const sendWelcomeEmail = async (user) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const loginLink = `${frontendUrl}/login`;
  
  // Try to use template system first (from master database)
  const result = await sendEmailFromTemplate('welcome_email', user.email, {
    userName: user.fullName || 'User',
    fullName: user.fullName || 'User',
    loginLink: loginLink
  }, false);

  if (result) {
    console.log('✓ Welcome email sent using master template. Message ID:', result.messageId);
    return result;
  }

  // Template not found or disabled - log warning and use fallback
  console.warn('⚠ Welcome email template "welcome_email" not found in master database or disabled. Using fallback hardcoded email.');
  console.warn('   → Create template via Admin UI: /admin/email-templates or API: POST /api/v1/admin/masters/email-templates');

  // Fallback to hardcoded email if template not found
  const subject = 'Welcome to Resume Nova AI - Your Career Journey Starts Here! 🚀';
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Resume Nova AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 76, 129, 0.1);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #1d88ed 0%, #0f4c81 100%); padding: 50px 40px; text-align: center;">
              <div style="margin-bottom: 20px;">
                <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                  <span style="font-size: 40px; color: white;">✨</span>
                </div>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                Welcome, ${user.fullName}!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.95); margin: 15px 0 0; font-size: 18px; font-weight: 400;">
                Your journey to career success begins now
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <p style="color: #0f172a; font-size: 18px; margin: 0 0 25px; font-weight: 500;">
                Thank you for joining <strong style="color: #1d88ed;">Resume Nova AI</strong>! 🎉
              </p>
              
              <p style="color: #64748b; font-size: 16px; margin: 0 0 30px; line-height: 1.7;">
                We're thrilled to have you on board. You've just unlocked access to powerful tools that will help you create professional resumes, discover amazing job opportunities, and take your career to the next level.
              </p>

              <!-- Features Grid -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 35px 0;">
                <tr>
                  <td style="padding: 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border-left: 4px solid #1d88ed; margin-bottom: 15px;">
                    <div style="display: flex; align-items: start; gap: 15px;">
                      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #1d88ed 0%, #0f4c81 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <span style="font-size: 24px; color: white;">📄</span>
                      </div>
                      <div>
                        <h3 style="color: #0f172a; margin: 0 0 8px; font-size: 18px; font-weight: 600;">Create Professional Resumes</h3>
                        <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6;">Design stunning resumes with our AI-powered builder and professional templates.</p>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border-left: 4px solid #10b981; margin-bottom: 15px;">
                    <div style="display: flex; align-items: start; gap: 15px;">
                      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <span style="font-size: 24px; color: white;">💼</span>
                      </div>
                      <div>
                        <h3 style="color: #0f172a; margin: 0 0 8px; font-size: 18px; font-weight: 600;">Discover Job Opportunities</h3>
                        <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6;">Browse thousands of job listings and find your perfect career match.</p>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 15px;">
                    <div style="display: flex; align-items: start; gap: 15px;">
                      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <span style="font-size: 24px; color: white;">📊</span>
                      </div>
                      <div>
                        <h3 style="color: #0f172a; margin: 0 0 8px; font-size: 18px; font-weight: 600;">Track Applications</h3>
                        <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6;">Monitor your job applications and stay organized throughout your job search.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/user/resume" 
                       style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #1d88ed 0%, #0f4c81 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(29, 136, 237, 0.3); transition: all 0.3s ease;">
                      🚀 Create Your First Resume
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Secondary CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/user/dashboard" 
                       style="display: inline-block; padding: 12px 30px; background: transparent; color: #1d88ed; text-decoration: none; border: 2px solid #1d88ed; border-radius: 12px; font-weight: 500; font-size: 14px;">
                      Explore Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Help Section -->
              <div style="margin-top: 40px; padding: 25px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <p style="color: #0f172a; font-size: 16px; margin: 0 0 12px; font-weight: 600;">
                  💡 Need Help Getting Started?
                </p>
                <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.6;">
                  Our support team is here to help! If you have any questions or need assistance, feel free to reach out to us anytime. We're committed to your success.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 15px; line-height: 1.6;">
                <strong style="color: #0f172a;">Resume Nova AI</strong><br>
                Your trusted partner in building a successful career
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0; line-height: 1.5;">
                This email was sent to you because you created an account with Resume Nova AI.<br>
                If you have any questions, please contact our support team.
              </p>
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                  © ${new Date().getFullYear()} Resume Nova AI. All rights reserved.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Welcome to Resume Nova AI - Your Career Journey Starts Here!

Hello ${user.fullName}!

Thank you for joining Resume Nova AI! We're thrilled to have you on board.

You've just unlocked access to powerful tools that will help you:
• Create professional resumes with our AI-powered builder
• Discover amazing job opportunities
• Track your applications and stay organized

Get Started:
${process.env.FRONTEND_URL || 'http://localhost:4200'}/user/resume

Explore Dashboard:
${process.env.FRONTEND_URL || 'http://localhost:4200'}/user/dashboard

Need Help?
Our support team is here to help! If you have any questions or need assistance, feel free to reach out to us anytime.

Best regards,
The Resume Nova AI Team

---
© ${new Date().getFullYear()} Resume Nova AI. All rights reserved.
  `;

  const fallbackResult = await sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
  console.log('✓ Welcome email sent successfully. Message ID:', fallbackResult.messageId);
  return fallbackResult;
};

/**
 * Send job application confirmation email
 */
const sendApplicationConfirmation = async (user, job) => {
  const subject = `Application Submitted: ${job.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Application Submitted Successfully!</h2>
      <p>Dear ${user.fullName},</p>
      <p>Your application for <strong>${job.title}</strong> at <strong>${job.company.name}</strong> has been submitted successfully.</p>
      <p><strong>Job Details:</strong></p>
      <ul>
        <li>Position: ${job.title}</li>
        <li>Company: ${job.company.name}</li>
        <li>Location: ${job.location.city}, ${job.location.state}</li>
        <li>Job Type: ${job.jobType}</li>
      </ul>
      <p>You will be notified once the employer reviews your application.</p>
      <a href="${process.env.FRONTEND_URL}/applications" 
         style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
        View My Applications
      </a>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Good luck with your application!
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send application status update email
 */
const sendApplicationStatusUpdate = async (user, job, status) => {
  const subject = `Application Update: ${job.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Application Status Update</h2>
      <p>Dear ${user.fullName},</p>
      <p>Your application status for <strong>${job.title}</strong> at <strong>${job.company.name}</strong> has been updated.</p>
      <p><strong>New Status:</strong> <span style="color: #007bff; font-weight: bold;">${status}</span></p>
      <a href="${process.env.FRONTEND_URL}/applications" 
         style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        View Application Details
      </a>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Keep up the great work!
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send interview scheduled email
 */
const sendInterviewScheduledEmail = async (user, job, interviewDetails) => {
  const subject = `Interview Scheduled: ${job.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">Interview Scheduled!</h2>
      <p>Dear ${user.fullName},</p>
      <p>Congratulations! An interview has been scheduled for the position of <strong>${job.title}</strong> at <strong>${job.company.name}</strong>.</p>
      <p><strong>Interview Details:</strong></p>
      <ul>
        <li>Date & Time: ${new Date(interviewDetails.scheduledDate).toLocaleString()}</li>
        <li>Mode: ${interviewDetails.mode}</li>
        ${interviewDetails.location ? `<li>Location: ${interviewDetails.location}</li>` : ''}
        ${interviewDetails.meetingLink ? `<li>Meeting Link: <a href="${interviewDetails.meetingLink}">${interviewDetails.meetingLink}</a></li>` : ''}
      </ul>
      ${interviewDetails.notes ? `<p><strong>Additional Notes:</strong> ${interviewDetails.notes}</p>` : ''}
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Good luck with your interview! Please be on time and prepare well.
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const subject = 'Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Dear ${user.fullName},</p>
      <p>We received a request to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" 
         style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p style="margin-top: 20px;">This link will expire in 1 hour.</p>
      <p style="color: #666; font-size: 12px;">
        If you didn't request this, please ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send new job alert to user
 */
const sendJobAlertEmail = async (user, jobs) => {
  const subject = 'New Job Opportunities Matching Your Preferences';
  const jobListHtml = jobs.map(job => `
    <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
      <h3 style="margin: 0 0 10px 0;">${job.title}</h3>
      <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company.name}</p>
      <p style="margin: 5px 0;"><strong>Location:</strong> ${job.location.city}, ${job.location.state}</p>
      <p style="margin: 5px 0;"><strong>Salary:</strong> ₹${job.salary.min} - ₹${job.salary.max} ${job.salary.period}</p>
      <a href="${process.env.FRONTEND_URL}/jobs/${job._id}" 
         style="display: inline-block; padding: 8px 16px; background-color: #007bff; color: white; text-decoration: none; border-radius: 3px; margin-top: 10px;">
        View Job
      </a>
    </div>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Job Opportunities for You!</h2>
      <p>Dear ${user.fullName},</p>
      <p>We found ${jobs.length} new job(s) matching your preferences:</p>
      ${jobListHtml}
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        You're receiving this email because you've enabled job alerts in your preferences.
        <a href="${process.env.FRONTEND_URL}/settings">Update preferences</a>
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send OTP verification email (using template system)
 */
const sendOTPEmail = async (user, otpCode, expiryMinutes = 1) => {
  console.log('📧 Preparing OTP email...');
  console.log('  To:', user.email);
  console.log('  OTP Code:', otpCode);
  console.log('  Expiry:', expiryMinutes, 'minutes');
  
  // Try to use template system first (from master database)
  let result = null;
  try {
    result = await sendEmailFromTemplate('otp_verification', user.email, {
      userName: user.fullName || 'User',
      fullName: user.fullName || 'User',
      otpCode: otpCode,
      expiryMinutes: expiryMinutes.toString()
    }, false);

    if (result) {
      console.log('✓ OTP email sent using master template. Message ID:', result.messageId);
      return result;
    }
  } catch (templateError) {
    console.warn('⚠ Error using template system, will try fallback:', templateError.message);
  }

  // Template not found or disabled - log warning and use fallback
  console.warn('⚠ OTP email template "otp_verification" not found in master database or disabled. Using fallback hardcoded email.');
  console.warn('   → Create template via Admin UI: /admin/email-templates or API: POST /api/v1/admin/masters/email-templates');

  // Fallback to hardcoded email if template not found
  const subject = 'Verify your email address';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
        <p style="color: #666; font-size: 16px;">Hello ${user.fullName},</p>
        <p style="color: #666; font-size: 16px;">Thank you for signing up! Please verify your email address by entering the OTP code below:</p>
        
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <div style="font-size: 36px; font-weight: bold; color: #1d88ed; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${otpCode}
          </div>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          <strong>This OTP will expire in ${expiryMinutes} minutes.</strong>
        </p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #856404; font-size: 14px; margin: 0;">
            <strong>Security Notice:</strong> Never share this OTP code with anyone. Our team will never ask for your OTP.
          </p>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    </div>
  `;

  const text = `
    Verify Your Email Address
    
    Hello ${user.fullName},
    
    Thank you for signing up! Please verify your email address by entering the OTP code below:
    
    OTP Code: ${otpCode}
    
    This OTP will expire in ${expiryMinutes} minutes.
    
    Security Notice: Never share this OTP code with anyone. Our team will never ask for your OTP.
    
    If you didn't create an account, please ignore this email.
  `;

  console.log('📤 Calling sendEmail function (fallback)...');
  try {
    const fallbackResult = await sendEmail({
      to: user.email,
      subject,
      html,
      text
    });
    console.log('✓ OTP email sent successfully (fallback). Message ID:', fallbackResult.messageId);
    return fallbackResult;
  } catch (fallbackError) {
    console.error('✗ CRITICAL: Fallback OTP email also failed!');
    console.error('Error details:', fallbackError);
    console.error('This means emails are not being sent. Check SMTP configuration.');
    // Re-throw the error so the calling code knows the email failed
    throw new Error(`Failed to send OTP email: ${fallbackError.message}`);
  }
};

/**
 * Create default email template if it doesn't exist
 */
const createDefaultEmailTemplate = async (emailType) => {
  if (emailType !== 'new_template') {
    return null; // Only auto-create for new_template
  }

  try {
    const EmailTemplate = require('../models/EmailTemplate.model');
    
    // Check if template already exists
    const existing = await EmailTemplate.findOne({ emailType: 'new_template' });
    if (existing) {
      return existing;
    }

    // Create default template
    const defaultTemplate = await EmailTemplate.create({
      emailType: 'new_template',
      subject: 'New Resume Template Available!',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Resume Template Available</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">New Resume Template Available!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello {{userName}},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      We're excited to announce a new resume template has been added to our collection!
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="color: #667eea; margin-top: 0;">{{templateName}}</h2>
      <p style="color: #666; margin-bottom: 10px;"><strong>Category:</strong> {{category}}</p>
      <p style="color: #666; margin: 0;">Create professional resumes with this new template and stand out to employers!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ctaLink}}" 
         style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Try This Template Now
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Best regards,<br>
      <strong>The Resume Portal Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
    <p style="font-size: 12px; color: #999;">
      You're receiving this email because you're an active user of our platform.
    </p>
  </div>
</body>
</html>`,
      textContent: `New Resume Template Available!

Hello {{userName}},

We're excited to announce a new resume template has been added to our collection!

Template: {{templateName}}
Category: {{category}}

Create professional resumes with this new template and stand out to employers!

Try this template: {{ctaLink}}

Best regards,
The Resume Portal Team`,
      variables: ['templateName', 'category', 'ctaLink', 'userName'],
      isEnabled: true,
      description: 'Email sent to all active users when a new resume template is created (auto-created)'
    });

    console.log('✓ Auto-created default email template "new_template"');
    return defaultTemplate;
  } catch (error) {
    console.error('✗ Error auto-creating email template:', error.message);
    return null;
  }
};

/**
 * Send email using template from database
 * @param {String} emailType - Type of email template (e.g., 'new_template')
 * @param {String} to - Recipient email
 * @param {Object} variables - Variables to replace in template (e.g., {templateName: '...', category: '...'})
 * @param {Boolean} throwOnError - Whether to throw error if template not found (default: false)
 */
/**
 * Send email using template from master database
 * @param {String} emailType - Template type (e.g., 'otp_verification', 'welcome_email')
 * @param {String} to - Recipient email
 * @param {Object} variables - Variables to replace in template (e.g., {templateName: '...', category: '...'})
 * @param {Boolean} throwOnError - Whether to throw error if template not found (default: false)
 * @returns {Object|null} Email result or null if template not found/disabled
 */
const sendEmailFromTemplate = async (emailType, to, variables = {}, throwOnError = false) => {
  try {
    const EmailTemplate = require('../models/EmailTemplate.model');
    
    // Get email template from master database (must be enabled)
    let template = await EmailTemplate.getByType(emailType.toLowerCase(), true);
    
    // Auto-create default template if it doesn't exist (only for new_template)
    if (!template && emailType === 'new_template') {
      console.log(`📝 Auto-creating default template for "${emailType}"...`);
      template = await createDefaultEmailTemplate(emailType);
    }
    
    if (!template) {
      const errorMsg = `Email template "${emailType}" not found in master database or is disabled.`;
      if (throwOnError) {
        throw new Error(errorMsg);
      }
      // Log warning but don't throw - allow process to continue with fallback
      console.warn(`⚠ ${errorMsg}`);
      console.warn(`   → Create via Admin UI: /admin/email-templates`);
      console.warn(`   → Or via API: POST /api/v1/admin/masters/email-templates`);
      return null;
    }

    // Validate template has required fields
    if (!template.subject || !template.htmlContent) {
      console.error(`✗ Email template "${emailType}" is missing required fields (subject or htmlContent)`);
      if (throwOnError) {
        throw new Error(`Email template "${emailType}" is incomplete`);
      }
      return null;
    }

    // Replace variables in template (including subject)
    console.log(`🔄 Replacing variables in template "${emailType}":`, {
      variablesProvided: Object.keys(variables),
      templateVariables: template.variables || [],
      subjectBefore: template.subject?.substring(0, 50)
    });
    
    const replacementResult = template.replaceVariables(variables);
    const html = replacementResult.html || '';
    const text = replacementResult.text || '';
    const processedSubject = replacementResult.subject || template.subject;
    
    // Use processed subject (with variables replaced) or fallback to original
    const emailSubject = processedSubject || template.subject;
    
    // Verify variables were replaced - check final content
    if (Object.keys(variables).length > 0) {
      const hasUnreplacedVars = html.includes('{{') || emailSubject.includes('{{');
      if (hasUnreplacedVars) {
        console.error(`✗ ERROR: Template "${emailType}" has unreplaced variables after replacement!`);
        console.error(`   Provided variables: ${Object.keys(variables).join(', ')}`);
        console.error(`   Template expects: ${(template.variables || []).join(', ')}`);
        const firstUnreplaced = html.indexOf('{{');
        if (firstUnreplaced >= 0) {
          console.error(`   Sample of unreplaced HTML:`, html.substring(firstUnreplaced, firstUnreplaced + 100));
        }
        // Extract unreplaced variables
        const unreplacedPattern = /\{\{(\w+)\}\}/g;
        const unreplacedVars = [...new Set([...html.matchAll(unreplacedPattern), ...emailSubject.matchAll(unreplacedPattern)].map(m => m[1]))];
        console.error(`   Unreplaced variables found: ${unreplacedVars.join(', ')}`);
      } else {
        console.log(`✓ All variables successfully replaced in template "${emailType}"`);
        // Log a sample of the final HTML to verify
        const sampleHtml = html.substring(0, 300).replace(/\s+/g, ' ');
        console.log(`   Sample final HTML: ${sampleHtml}...`);
      }
    }
    
    // Log what we're about to send
    console.log(`📧 Email content ready - Subject: "${emailSubject.substring(0, 50)}", HTML length: ${html.length}`);
    
    // Send email
    const result = await sendEmail({
      to,
      subject: emailSubject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Fallback to plain text from HTML if textContent missing
    });
    
    console.log(`✓ Email sent using master template "${emailType}" to ${to} (Message ID: ${result.messageId})`);
    return result;
  } catch (error) {
    if (throwOnError) {
      console.error(`✗ Error sending email from template "${emailType}":`, error.message);
      throw error;
    }
    // Log warning but don't throw - allow process to continue with fallback
    console.warn(`⚠ Error sending email from template "${emailType}": ${error.message}`);
    return null;
  }
};

/**
 * Send new template notification email to a user
 */
const sendNewTemplateEmail = async (user, template) => {
  try {
    const categoryName = template.categoryId?.name || template.category || 'General';
    const templateName = template.displayName || template.name;
    const templateId = template._id || template.id;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const ctaLink = `${frontendUrl}/user/resume?templateId=${templateId}`;

    const variables = {
      templateName,
      category: categoryName,
      ctaLink,
      userName: user.fullName || 'User'
    };

    // Don't throw on error - allow process to continue
    return await sendEmailFromTemplate('new_template', user.email, variables, false);
  } catch (error) {
    // This should rarely happen now since sendEmailFromTemplate doesn't throw by default
    console.warn('Error sending new template email:', error.message);
    return null;
  }
};

/**
 * Send new template notification emails to multiple users (async, non-blocking)
 */
const sendNewTemplateEmailsToUsers = async (users, template) => {
  // Run asynchronously without blocking
  setImmediate(async () => {
    try {
      let successCount = 0;
      let skippedCount = 0;

      for (const user of users) {
        const result = await sendNewTemplateEmail(user, template);
        if (result) {
          successCount++;
        } else {
          skippedCount++;
        }
      }

      if (successCount > 0) {
        console.log(`📧 New template emails sent: ${successCount} success${skippedCount > 0 ? `, ${skippedCount} skipped (template not configured)` : ''}`);
      } else if (skippedCount > 0) {
        console.log(`⚠ New template emails skipped: Email template "new_template" not found. Please create it in the database. See CREATE_EMAIL_TEMPLATE.md`);
      }
    } catch (error) {
      console.error('Error in bulk email sending:', error);
    }
  });
};

/**
 * Send resume creation confirmation email (using template system)
 */
const sendResumeCreationEmail = async (user, resume) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const resumeLink = `${frontendUrl}/user/resume?resumeId=${resume._id}`;
  const resumeTitle = resume.title || 'Untitled Resume';
  const templateName = resume.templateId?.name || 'Selected Template';
  
  // Try to use template system first (from master database)
  const result = await sendEmailFromTemplate('resume_created', user.email, {
    userName: user.fullName || 'User',
    fullName: user.fullName || 'User',
    resumeTitle: resumeTitle,
    templateName: templateName,
    resumeLink: resumeLink,
    resumeId: resume._id.toString()
  }, false);

  if (result) {
    console.log('✓ Resume creation email sent using master template. Message ID:', result.messageId);
    return result;
  }

  // Template not found or disabled - log warning and use fallback
  console.warn('⚠ Resume creation email template "resume_created" not found in master database or disabled. Using fallback hardcoded email.');
  console.warn('   → Create template via Admin UI: /admin/email-templates or API: POST /api/v1/admin/masters/email-templates');

  // Fallback to hardcoded email if template not found (variables already defined above)
  const subject = 'Resume Created Successfully!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1d88ed 0%, #0f4c81 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Resume Created!</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #64748b; font-size: 16px;">Hello ${user.fullName},</p>
        <p style="color: #64748b; font-size: 16px;">Your resume "<strong>${resumeTitle}</strong>" has been created successfully!</p>
        <p style="color: #64748b; font-size: 16px;">You can now edit, download, or share your resume.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resumeLink}" 
             style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #1d88ed 0%, #0f4c81 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            View Resume
          </a>
        </div>
        <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">
          Keep building your professional profile!
        </p>
      </div>
    </div>
  `;

  const fallbackResult = await sendEmail({
    to: user.email,
    subject,
    html
  });
  console.log('✓ Resume creation email sent successfully. Message ID:', fallbackResult.messageId);
  return fallbackResult;
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendApplicationConfirmation,
  sendApplicationStatusUpdate,
  sendInterviewScheduledEmail,
  sendPasswordResetEmail,
  sendJobAlertEmail,
  sendOTPEmail,
  sendEmailFromTemplate,
  sendNewTemplateEmail,
  sendNewTemplateEmailsToUsers,
  sendResumeCreationEmail
};