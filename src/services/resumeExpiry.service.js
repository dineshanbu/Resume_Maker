// backend/src/services/resumeExpiry.service.js
const Resume = require('../models/Resume.model');
const User = require('../models/User.model');
const { sendEmailFromTemplate } = require('./email.service');
const { createNotification } = require('./notification.service');

/**
 * Check for resumes with URLs expiring soon and send notifications
 * @param {number} daysBeforeExpiry - Number of days before expiry to send reminder (default: 1)
 */
const checkAndNotifyExpiringResumes = async (daysBeforeExpiry = 1) => {
  try {
    const now = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysBeforeExpiry);

    // Find resumes with URLs expiring within the threshold
    const expiringResumes = await Resume.find({
      publicUrlToken: { $ne: null },
      urlExpiresAt: {
        $gte: now,
        $lte: expiryThreshold
      }
    })
      .populate('userId', 'fullName email currentPlan')
      .populate('templateId', 'name');

    console.log(`Found ${expiringResumes.length} resumes with URLs expiring in ${daysBeforeExpiry} day(s)`);

    for (const resume of expiringResumes) {
      if (!resume.userId || !resume.userId.email) {
        console.warn(`Skipping resume ${resume._id} - no user email found`);
        continue;
      }

      const user = resume.userId;
      const expiryDate = new Date(resume.urlExpiresAt);
      const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      // Send email notification
      try {
        await sendResumeExpiryEmail(user, resume, daysRemaining);
      } catch (error) {
        console.error(`Error sending expiry email for resume ${resume._id}:`, error.message);
      }

      // Send in-app notification
      try {
        await createNotification(user._id, {
          type: 'RESUME_EXPIRY',
          title: 'Resume link expiring',
          message: `Your resume "${resume.title}" link will expire in ${daysRemaining} day(s). Upgrade to Premium to keep your resume link active.`,
          link: `/user/my-resumes`,
          icon: 'bi-clock-history',
          iconColor: '#f59e0b',
          metadata: {
            resumeId: resume._id.toString(),
            resumeTitle: resume.title,
            expiresAt: expiryDate.toISOString(),
            daysRemaining
          }
        });
      } catch (error) {
        console.error(`Error creating expiry notification for resume ${resume._id}:`, error.message);
      }
    }

    return {
      checked: expiringResumes.length,
      notified: expiringResumes.length
    };
  } catch (error) {
    console.error('Error checking expiring resumes:', error);
    throw error;
  }
};

/**
 * Check for expired resume URLs and send expiry notifications
 */
const checkAndNotifyExpiredResumes = async () => {
  try {
    const now = new Date();

    // Find resumes with expired URLs
    const expiredResumes = await Resume.find({
      publicUrlToken: { $ne: null },
      urlExpiresAt: {
        $lte: now
      }
    })
      .populate('userId', 'fullName email currentPlan')
      .populate('templateId', 'name');

    console.log(`Found ${expiredResumes.length} resumes with expired URLs`);

    for (const resume of expiredResumes) {
      if (!resume.userId || !resume.userId.email) {
        console.warn(`Skipping resume ${resume._id} - no user email found`);
        continue;
      }

      const user = resume.userId;

      // Send email notification
      try {
        await sendResumeExpiredEmail(user, resume);
      } catch (error) {
        console.error(`Error sending expired email for resume ${resume._id}:`, error.message);
      }

      // Send in-app notification
      try {
        await createNotification(user._id, {
          type: 'RESUME_EXPIRED',
          title: 'Resume link expired',
          message: `Your resume "${resume.title}" link has expired. Upgrade to Premium to keep your resume link active.`,
          link: `/user/my-resumes`,
          icon: 'bi-x-circle',
          iconColor: '#ef4444',
          metadata: {
            resumeId: resume._id.toString(),
            resumeTitle: resume.title,
            expiredAt: resume.urlExpiresAt.toISOString()
          }
        });
      } catch (error) {
        console.error(`Error creating expired notification for resume ${resume._id}:`, error.message);
      }
    }

    return {
      checked: expiredResumes.length,
      notified: expiredResumes.length
    };
  } catch (error) {
    console.error('Error checking expired resumes:', error);
    throw error;
  }
};

/**
 * Send email notification for expiring resume URL
 */
const sendResumeExpiryEmail = async (user, resume, daysRemaining) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const upgradeLink = `${frontendUrl}/user/pricing`;
  const resumeLink = `${frontendUrl}/user/my-resumes`;

  const expiryDate = new Date(resume.urlExpiresAt);
  const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Try to use email template from master database
  const result = await sendEmailFromTemplate('resume_url_expiring', user.email, {
    userName: user.fullName || 'User',
    resumeName: resume.title,
    expiryDate: formattedExpiryDate,
    daysRemaining: daysRemaining,
    upgradeLink: upgradeLink,
    resumeLink: resumeLink
  }, false);

  if (result) {
    console.log(`✓ Expiry email sent using master template for resume ${resume._id}`);
    return result;
  }

  // Fallback email if template not found
  const subject = 'Your resume link is about to expire';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Resume Link Expiring Soon</h2>
      <p>Hello ${user.fullName},</p>
      <p>Your resume "<strong>${resume.title}</strong>" public link will expire in <strong>${daysRemaining} day(s)</strong>.</p>
      <p><strong>Expiry Date:</strong> ${formattedExpiryDate}</p>
      <p>Upgrade to Premium to keep your resume link active for longer periods.</p>
      <div style="margin: 30px 0;">
        <a href="${upgradeLink}" style="display: inline-block; padding: 12px 30px; background: #1d88ed; color: white; text-decoration: none; border-radius: 6px;">
          Upgrade to Premium
        </a>
      </div>
      <p><a href="${resumeLink}">View My Resumes</a></p>
    </div>
  `;

  const { sendEmail } = require('./email.service');
  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send email notification for expired resume URL
 */
const sendResumeExpiredEmail = async (user, resume) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const upgradeLink = `${frontendUrl}/user/pricing`;
  const resumeLink = `${frontendUrl}/user/my-resumes`;

  const expiryDate = new Date(resume.urlExpiresAt);
  const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Try to use email template from master database
  const result = await sendEmailFromTemplate('resume_url_expired', user.email, {
    userName: user.fullName || 'User',
    resumeName: resume.title,
    expiryDate: formattedExpiryDate,
    upgradeLink: upgradeLink,
    resumeLink: resumeLink
  }, false);

  if (result) {
    console.log(`✓ Expired email sent using master template for resume ${resume._id}`);
    return result;
  }

  // Fallback email if template not found
  const subject = 'Your resume link has expired';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Resume Link Expired</h2>
      <p>Hello ${user.fullName},</p>
      <p>Your resume "<strong>${resume.title}</strong>" public link has expired.</p>
      <p><strong>Expired On:</strong> ${formattedExpiryDate}</p>
      <p>Upgrade to Premium to keep your resume link active for longer periods.</p>
      <div style="margin: 30px 0;">
        <a href="${upgradeLink}" style="display: inline-block; padding: 12px 30px; background: #1d88ed; color: white; text-decoration: none; border-radius: 6px;">
          Upgrade to Premium
        </a>
      </div>
      <p><a href="${resumeLink}">View My Resumes</a></p>
    </div>
  `;

  const { sendEmail } = require('./email.service');
  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

module.exports = {
  checkAndNotifyExpiringResumes,
  checkAndNotifyExpiredResumes,
  sendResumeExpiryEmail,
  sendResumeExpiredEmail
};
