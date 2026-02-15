/**
 * Admin Layouts Seed Script
 * 
 * Reconstructs the deleted admin-layouts collection using definitions 
 * from the frontend and standard HTML skeletons.
 */

const mongoose = require('mongoose');
const path = require('path');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/resume_db';

// Admin Layout Schema (Match backend model)
const adminLayoutSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    code: { type: String, required: true, unique: true },
    htmlContent: { type: String, required: true },
    cssContent: { type: String, default: '' },
    type: { type: String, default: 'one-column' },
    columnWidths: {
        left: { type: Number, default: 100 },
        right: { type: Number, default: 0 }
    },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const AdminLayout = mongoose.models.AdminLayout || mongoose.model('AdminLayout', adminLayoutSchema);

const LAYOUTDATA = [
    {
        code: 'single-column',
        name: 'Single Column',
        type: 'one-column',
        description: 'Classic single column layout',
        columnWidths: { left: 100, right: 0 },
        htmlContent: `<div class="single-column-layout">
  <div class="main-content">
    {{sections.right}}
  </div>
</div>`
    },
    {
        code: 'two-column-left',
        name: 'Two Column - Left Sidebar',
        type: 'two-column',
        description: 'Sidebar on left (35%), main content on right (65%)',
        columnWidths: { left: 35, right: 65 },
        htmlContent: `<div class="two-column-layout" style="display: grid; grid-template-columns: 35% 65%; gap: 20px;">
  <div class="sidebar-left">
    {{sections.left}}
  </div>
  <div class="content-right">
    {{sections.right}}
  </div>
</div>`
    },
    {
        code: 'two-column-right',
        name: 'Two Column - Right Sidebar',
        type: 'two-column',
        description: 'Main content on left (65%), sidebar on right (35%)',
        columnWidths: { left: 65, right: 35 },
        htmlContent: `<div class="two-column-layout" style="display: grid; grid-template-columns: 65% 35%; gap: 20px;">
  <div class="content-left">
    {{sections.left}}
  </div>
  <div class="sidebar-right">
    {{sections.right}}
  </div>
</div>`
    },
    {
        code: 'two-column-equal',
        name: 'Two Column - Equal',
        type: 'two-column',
        description: 'Equal width columns (50% - 50%)',
        columnWidths: { left: 50, right: 50 },
        htmlContent: `<div class="two-column-layout" style="display: grid; grid-template-columns: 50% 50%; gap: 20px;">
  <div class="column-left">
    {{sections.left}}
  </div>
  <div class="column-right">
    {{sections.right}}
  </div>
</div>`
    },
    {
        code: 'header-two-column',
        name: 'Header + Two Column',
        type: 'header-body',
        description: 'Full-width header, two column body below',
        columnWidths: { left: 35, right: 65 },
        htmlContent: `<div class="header-body-layout">
  <div class="header-full" style="margin-bottom: 20px;">
    {{sections.header}}
  </div>
  <div class="body-columns" style="display: grid; grid-template-columns: 35% 65%; gap: 20px;">
    <div class="column-left">
      {{sections.left}}
    </div>
    <div class="column-right">
      {{sections.right}}
    </div>
  </div>
</div>`
    },
    {
        code: 'header-single-column',
        name: 'Header + Single Column',
        type: 'header-body',
        description: 'Full-width header, single column body',
        columnWidths: { left: 100, right: 0 },
        htmlContent: `<div class="header-body-layout">
  <div class="header-full" style="margin-bottom: 20px;">
    {{sections.header}}
  </div>
  <div class="body-main">
    {{sections.left}}
  </div>
</div>`
    },
    {
        code: 'professional-timeline',
        name: 'Professional Timeline',
        type: 'two-column',
        description: 'Unique timeline view for experience',
        columnWidths: { left: 40, right: 60 },
        htmlContent: `<div class="timeline-layout" style="display: grid; grid-template-columns: 40% 60%; gap: 24px;">
  <div class="left-side">
    {{sections.left}}
  </div>
  <div class="right-side">
    {{sections.right}}
  </div>
</div>`
    },
    {
        code: 'creative-grid',
        name: 'Modern Grid',
        type: 'header-body',
        description: 'Grid-based layout for creative portfolios',
        columnWidths: { left: 30, right: 70 },
        htmlContent: `<div class="grid-layout">
  <div class="header-area" style="margin-bottom: 30px;">
    {{sections.header}}
  </div>
  <div class="grid-body" style="display: grid; grid-template-columns: 30% 70%; gap: 20px;">
    <div class="grid-left">
      {{sections.left}}
    </div>
    <div class="grid-right">
      {{sections.right}}
    </div>
  </div>
</div>`
    },
    {
        code: 'executive-brief',
        name: 'Executive Brief',
        type: 'one-column',
        description: 'High-density executive layout',
        columnWidths: { left: 100, right: 0 },
        htmlContent: `<div class="executive-layout">
  <div class="exec-header">
    {{sections.header}}
  </div>
  <div class="exec-body">
    {{sections.right}}
  </div>
</div>`
    }
];

async function seed() {
    try {
        console.log('🌱 Starting Admin Layout seed...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing to avoid duplicates if any partially exist
        await AdminLayout.deleteMany({});
        console.log('🗑  Cleared old admin layouts');

        const result = await AdminLayout.insertMany(LAYOUTDATA);
        console.log(`✅ Successfully seeded ${result.length} Admin Layouts`);

        process.exit(0);
    } catch (err) {
        console.error('💥 Seed failed:', err.message);
        process.exit(1);
    }
}

seed();
