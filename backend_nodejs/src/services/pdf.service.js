// backend/src/services/pdf.service.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Resume PDF
 * @param {Object} resume - Resume data
 * @param {String} templateId - Template identifier
 * @returns {Promise<String>} - Path to generated PDF
 */
const generateResumePDF = async (resume, templateId = 'template1') => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Output file path
      const fileName = `resume_${resume._id}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../../uploads/pdfs', fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Generate PDF based on template
      switch (templateId) {
        case 'template1':
          generateTemplate1(doc, resume);
          break;
        case 'template2':
          generateTemplate2(doc, resume);
          break;
        default:
          generateTemplate1(doc, resume);
      }

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Template 1 - Professional Resume Layout
 */
const generateTemplate1 = (doc, resume) => {
  const { personalInfo, summary, experience, education, skills } = resume;

  // Header - Personal Info
  doc.fontSize(24).font('Helvetica-Bold').text(personalInfo.fullName, { align: 'center' });
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica')
    .text(`${personalInfo.email} | ${personalInfo.phone}`, { align: 'center' });
  
  if (personalInfo.address) {
    doc.text(personalInfo.address, { align: 'center' });
  }

  if (personalInfo.linkedin || personalInfo.portfolio) {
    const links = [];
    if (personalInfo.linkedin) links.push(personalInfo.linkedin);
    if (personalInfo.portfolio) links.push(personalInfo.portfolio);
    doc.text(links.join(' | '), { align: 'center' });
  }

  doc.moveDown(1);

  // Professional Summary
  if (summary) {
    addSection(doc, 'PROFESSIONAL SUMMARY');
    doc.fontSize(10).font('Helvetica').text(summary, { align: 'justify' });
    doc.moveDown(1);
  }

  // Work Experience
  if (experience && experience.length > 0) {
    addSection(doc, 'WORK EXPERIENCE');
    experience.forEach((exp, index) => {
      doc.fontSize(12).font('Helvetica-Bold').text(exp.jobTitle);
      doc.fontSize(10).font('Helvetica-Oblique')
        .text(`${exp.company} | ${formatDate(exp.startDate)} - ${exp.isCurrentJob ? 'Present' : formatDate(exp.endDate)}`);
      
      if (exp.description) {
        doc.fontSize(10).font('Helvetica').text(exp.description, { align: 'justify' });
      }

      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach(achievement => {
          doc.fontSize(10).font('Helvetica').text(`• ${achievement}`, { indent: 20 });
        });
      }

      if (index < experience.length - 1) doc.moveDown(0.5);
    });
    doc.moveDown(1);
  }

  // Education
  if (education && education.length > 0) {
    addSection(doc, 'EDUCATION');
    education.forEach((edu, index) => {
      doc.fontSize(12).font('Helvetica-Bold').text(edu.degree);
      doc.fontSize(10).font('Helvetica-Oblique')
        .text(`${edu.institution} | ${formatDate(edu.startDate)} - ${edu.isCurrentlyStudying ? 'Present' : formatDate(edu.endDate)}`);
      
      if (edu.cgpa || edu.percentage) {
        const grade = edu.cgpa ? `CGPA: ${edu.cgpa}` : `Percentage: ${edu.percentage}%`;
        doc.fontSize(10).font('Helvetica').text(grade);
      }

      if (index < education.length - 1) doc.moveDown(0.5);
    });
    doc.moveDown(1);
  }

  // Skills
  if (skills) {
    addSection(doc, 'SKILLS');
    
    if (skills.technical && skills.technical.length > 0) {
      doc.fontSize(10).font('Helvetica-Bold').text('Technical Skills: ');
      doc.font('Helvetica').text(skills.technical.join(', '));
      doc.moveDown(0.3);
    }

    if (skills.soft && skills.soft.length > 0) {
      doc.fontSize(10).font('Helvetica-Bold').text('Soft Skills: ');
      doc.font('Helvetica').text(skills.soft.join(', '));
    }
  }
};

/**
 * Template 2 - Modern Resume Layout
 */
const generateTemplate2 = (doc, resume) => {
  // Similar structure with different styling
  // Implementation would be similar to template1 but with different fonts, colors, spacing
  generateTemplate1(doc, resume); // Placeholder
};

/**
 * Helper function to add section header
 */
const addSection = (doc, title) => {
  doc.fontSize(14).font('Helvetica-Bold').text(title);
  doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
  doc.moveDown(0.5);
};

/**
 * Helper function to format date
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const month = d.toLocaleString('default', { month: 'short' });
  const year = d.getFullYear();
  return `${month} ${year}`;
};

module.exports = {
  generateResumePDF
};