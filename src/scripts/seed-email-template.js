// backend/src/scripts/seed-email-template.js
// Run this script to create the initial "new_template" email template in the database
// Usage: node src/scripts/seed-email-template.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const EmailTemplate = require('../models/EmailTemplate.model');
const connectDB = require('../config/database');

const seedEmailTemplate = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if template already exists
    const existingTemplate = await EmailTemplate.findOne({ emailType: 'new_template' });
    
    if (existingTemplate) {
      console.log('✓ Email template "new_template" already exists');
      console.log('  Updating with latest version...');
      
      existingTemplate.subject = 'New Resume Template Available!';
      existingTemplate.htmlContent = `
        <!DOCTYPE html>
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
        </html>
      `;
      existingTemplate.textContent = `
New Resume Template Available!

Hello {{userName}},

We're excited to announce a new resume template has been added to our collection!

Template: {{templateName}}
Category: {{category}}

Create professional resumes with this new template and stand out to employers!

Try this template: {{ctaLink}}

Best regards,
The Resume Portal Team
      `;
      existingTemplate.variables = ['templateName', 'category', 'ctaLink', 'userName'];
      existingTemplate.isEnabled = true;
      existingTemplate.description = 'Email sent to all active users when a new resume template is created';
      
      await existingTemplate.save();
      console.log('✓ Email template updated successfully');
    } else {
      // Create new template
      const template = await EmailTemplate.create({
        emailType: 'new_template',
        subject: 'New Resume Template Available!',
        htmlContent: `
          <!DOCTYPE html>
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
          </html>
        `,
        textContent: `
New Resume Template Available!

Hello {{userName}},

We're excited to announce a new resume template has been added to our collection!

Template: {{templateName}}
Category: {{category}}

Create professional resumes with this new template and stand out to employers!

Try this template: {{ctaLink}}

Best regards,
The Resume Portal Team
        `,
        variables: ['templateName', 'category', 'ctaLink', 'userName'],
        isEnabled: true,
        description: 'Email sent to all active users when a new resume template is created'
      });
      
      console.log('✓ Email template "new_template" created successfully');
    }

    console.log('\n✅ Email template seeding completed!');
    console.log('\nThe email template is now ready to use.');
    console.log('When an admin creates a new template, emails will be sent automatically to all active users.');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding email template:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedEmailTemplate();
}

module.exports = seedEmailTemplate;
