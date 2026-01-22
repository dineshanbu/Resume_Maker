// backend/src/models/EmailTemplate.model.js
const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  emailType: {
    type: String,
    required: [true, 'Email type is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  htmlContent: {
    type: String,
    required: [true, 'HTML content is required']
  },
  textContent: {
    type: String,
    default: ''
  },
  variables: {
    type: [String],
    default: []
  },
  isEnabled: {
    type: Boolean,
    default: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
emailTemplateSchema.index({ emailType: 1, isEnabled: 1 });

// Method to replace variables in template
emailTemplateSchema.methods.replaceVariables = function(variables = {}) {
  let html = String(this.htmlContent || '');
  let text = String(this.textContent || '');
  let subject = String(this.subject || '');
  
  // Debug: Log initial state
  console.log(`🔍 replaceVariables called with ${Object.keys(variables).length} variables:`, Object.keys(variables));
  console.log(`🔍 HTML content length: ${html.length}, contains {{: ${html.includes('{{')}}`);
  console.log(`🔍 Sample HTML (first 200 chars): ${html.substring(0, 200)}`);
  
  // Find all variables in template
  const varPattern = /\{\{(\w+)\}\}/g;
  const htmlVars = [...html.matchAll(varPattern)].map(m => m[1]);
  const textVars = [...text.matchAll(varPattern)].map(m => m[1]);
  const subjectVars = [...subject.matchAll(varPattern)].map(m => m[1]);
  const allTemplateVars = [...new Set([...htmlVars, ...textVars, ...subjectVars])];
  console.log(`🔍 Variables found in template: ${allTemplateVars.join(', ')}`);
  
  // Replace variables in format {{variableName}}
  let totalReplacements = 0;
  Object.keys(variables).forEach(key => {
    // Escape special regex characters in key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
    const value = variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
    
    // Count matches before replacement
    const htmlBefore = html;
    const textBefore = text;
    const subjectBefore = subject;
    
    html = html.replace(regex, value);
    text = text.replace(regex, value);
    subject = subject.replace(regex, value);
    
    // Count actual replacements
    const htmlMatches = (htmlBefore.match(regex) || []).length;
    const textMatches = (textBefore.match(regex) || []).length;
    const subjectMatches = (subjectBefore.match(regex) || []).length;
    totalReplacements += htmlMatches + textMatches + subjectMatches;
    
    // Log replacement details
    if (htmlMatches > 0 || textMatches > 0 || subjectMatches > 0) {
      console.log(`  ✓ Replaced {{${key}}} → "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}" (HTML: ${htmlMatches}, Text: ${textMatches}, Subject: ${subjectMatches})`);
    } else {
      console.log(`  ⚠ Variable {{${key}}} not found in template (value: "${value}")`);
    }
  });
  
  console.log(`🔍 Total replacements made: ${totalReplacements}`);
  console.log(`🔍 Final HTML contains {{: ${html.includes('{{')}}`);
  
  // Log replacement for debugging
  if (Object.keys(variables).length > 0) {
    const replacedVars = Object.keys(variables).filter(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      return !html.includes(`{{${key}}}`) && !text.includes(`{{${key}}}`) && !subject.includes(`{{${key}}}`);
    });
    const unreplacedVars = Object.keys(variables).filter(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      return html.includes(`{{${key}}}`) || text.includes(`{{${key}}}`) || subject.includes(`{{${key}}}`);
    });
    
    if (unreplacedVars.length > 0) {
      console.warn(`⚠ Some variables were not found in template to replace: ${unreplacedVars.join(', ')}`);
    }
  }
  
  return { html, text, subject };
};

// Static method to get template by type
emailTemplateSchema.statics.getByType = async function(emailType, enabledOnly = true) {
  const query = { emailType: emailType.toLowerCase() };
  if (enabledOnly) {
    query.isEnabled = true;
  }
  return await this.findOne(query);
};

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

module.exports = EmailTemplate;
