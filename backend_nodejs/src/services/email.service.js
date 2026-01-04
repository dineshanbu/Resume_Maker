// backend/src/services/email.service.js
const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
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
      from: process.env.EMAIL_FROM || 'Resume Portal <noreply@resumeportal.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Resume & Job Portal!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome ${user.fullName}!</h2>
      <p>Thank you for registering with Resume & Job Portal.</p>
      <p>You can now:</p>
      <ul>
        <li>Create professional resumes</li>
        <li>Apply for jobs</li>
        <li>Track your applications</li>
      </ul>
      <p>Get started by creating your first resume!</p>
      <a href="${process.env.FRONTEND_URL}/resumes/create" 
         style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Create Resume
      </a>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        If you have any questions, feel free to contact us.
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

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendApplicationConfirmation,
  sendApplicationStatusUpdate,
  sendInterviewScheduledEmail,
  sendPasswordResetEmail,
  sendJobAlertEmail
};