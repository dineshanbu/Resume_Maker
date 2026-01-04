# Admin Template Management - Complete Guide

## 🎯 Overview

Admin இந்த system-ஐ use பண்ணி resume templates create பண்ணலாம், manage பண்ணலாம், மற்றும் users-க்கு publish பண்ணலாம்.

---

## 🚀 Quick Start

### Option 1: Use Ready-Made Templates (Easiest)

```bash
# 1. Import ready templates
cd backend
node src/scripts/importReadyTemplates.js

# This will create 2 professional templates automatically
```

### Option 2: Create Template Manually

1. Login as admin
2. Go to `/admin/templates`
3. Click "Create New Template"
4. Follow the 5-step wizard

---

## 📋 Template Creation Flow

### **Step 1: Basic Information**

Fill in template details:

```
✓ Template Name: URL-friendly name (e.g., "modern-tech-resume")
✓ Display Name: Human-readable name (e.g., "Modern Tech Resume")
✓ Description: Brief description
✓ Profession: Target profession (Software Engineer, Designer, etc.)
✓ Style Category: Modern, Classic, Creative, Minimal, Professional
✓ Subscription Tier: free, basic, or premium
✓ Tags: Searchable keywords
```

**Example:**
```javascript
{
  name: "professional-blue-tech",
  displayName: "Professional Blue - Tech",
  description: "Clean and professional template for tech professionals",
  profession: "Software Engineer",
  styleCategory: "Modern",
  subscriptionTier: "free",
  tags: ["professional", "modern", "tech", "blue"]
}
```

---

### **Step 2: Design & Colors**

Choose color scheme:

- **Primary Color**: Main brand color
- **Secondary Color**: Supporting color
- **Accent Color**: Highlights and CTAs
- **Text Color**: Body text
- **Background Color**: Page background

**Pre-built Color Schemes:**
- Blue Professional: `#1e40af, #3b82f6, #60a5fa`
- Green Fresh: `#10b981, #34d399, #059669`
- Purple Creative: `#8b5cf6, #a78bfa, #7c3aed`

---

### **Step 3: Configure Sections**

Enable/disable resume sections:

```
✓ Personal Information (Required)
□ Professional Summary
□ Work Experience
□ Education
□ Skills
□ Projects
□ Certifications
□ Languages
□ Achievements
□ Interests
□ References
```

---

### **Step 4: HTML/CSS Code**

#### **HTML Template Syntax:**

Use Handlebars-like syntax for dynamic content:

**Simple Variables:**
```html
<h1>{{personalInfo.fullName}}</h1>
<p>{{personalInfo.email}}</p>
```

**Conditionals:**
```html
{{#if summary}}
<section>
  <h2>Professional Summary</h2>
  <p>{{summary}}</p>
</section>
{{/if}}
```

**Loops:**
```html
{{#each experience}}
<div class="job">
  <h3>{{jobTitle}}</h3>
  <p>{{company}}</p>
  <p>{{formatDate startDate}} - {{#if isCurrentJob}}Present{{else}}{{formatDate endDate}}{{/if}}</p>
</div>
{{/each}}
```

**Available Placeholders:**

```javascript
// Personal Info
{{personalInfo.fullName}}
{{personalInfo.email}}
{{personalInfo.phone}}
{{personalInfo.city}}
{{personalInfo.state}}
{{personalInfo.address}}
{{personalInfo.linkedin}}
{{personalInfo.github}}
{{personalInfo.portfolio}}
{{personalInfo.profileImage}}

// Summary
{{summary}}

// Experience (Loop)
{{#each experience}}
  {{jobTitle}}
  {{company}}
  {{location}}
  {{startDate}}
  {{endDate}}
  {{isCurrentJob}}
  {{description}}
  {{#each achievements}}
    {{this}}
  {{/each}}
{{/each}}

// Education (Loop)
{{#each education}}
  {{degree}}
  {{institution}}
  {{startDate}}
  {{endDate}}
  {{isCurrentlyStudying}}
  {{cgpa}}
  {{percentage}}
{{/each}}

// Skills
{{#each skills.technical}}
  {{this}}
{{/each}}
{{#each skills.soft}}
  {{this}}
{{/each}}

// Projects (Loop)
{{#each projects}}
  {{title}}
  {{description}}
  {{link}}
  {{#each technologies}}
    {{this}}
  {{/each}}
{{/each}}

// Certifications (Loop)
{{#each certifications}}
  {{name}}
  {{issuer}}
  {{issueDate}}
  {{credentialId}}
{{/each}}
```

#### **CSS Template:**

Write standard CSS:

```css
.resume-wrapper {
  font-family: 'Arial', sans-serif;
  max-width: 850px;
  margin: 0 auto;
  padding: 40px;
  background: #ffffff;
}

.name {
  font-size: 42px;
  font-weight: 700;
  color: #1e40af;
}

/* Use CSS variables for theme colors */
.header {
  background: var(--primary-color, #1e40af);
}
```

---

### **Step 5: Preview & Publish**

1. **Preview with Sample Data**: See how template looks
2. **Test Responsiveness**: Check mobile view
3. **Save as Draft**: Save without publishing
4. **Publish**: Make available to users

---

## 🎨 Template Design Best Practices

### **1. Layout Guidelines:**

```
✓ Single Column: Simpler, better for ATS
✓ Two Column: Modern, visually appealing
✓ Max Width: 850px (A4 size)
✓ Padding: 40-60px
✓ Spacing: Consistent margins between sections
```

### **2. Typography:**

```
✓ Font Size: 
  - Name: 36-48px
  - Section Headings: 18-24px
  - Body Text: 13-15px
  
✓ Font Families:
  - Professional: Arial, Helvetica, Inter
  - Classic: Times New Roman, Georgia
  - Modern: Poppins, Montserrat, Roboto
  
✓ Line Height: 1.5-1.8 for readability
```

### **3. Colors:**

```
✓ Use 2-3 main colors maximum
✓ Ensure good contrast (text vs background)
✓ Avoid pure black (#000000), use #333333
✓ Use color for accents, not large areas
```

### **4. Sections Order:**

```
Recommended Order:
1. Personal Information (Header)
2. Professional Summary
3. Skills (Optional: Move to sidebar)
4. Work Experience
5. Education
6. Projects/Certifications
7. Additional Info
```

---

## 🔧 Template Management

### **View All Templates:**

**Endpoint:** `GET /api/v1/admin/templates`

```javascript
const response = await api.admin.getTemplates({
  status: 'active',
  profession: 'Software Engineer',
  tier: 'premium',
  search: 'modern',
  page: 1,
  limit: 20
});
```

**Response:**
```json
{
  "templates": [...],
  "stats": {
    "total": 10,
    "active": 8,
    "inactive": 2,
    "free": 5,
    "basic": 3,
    "premium": 2
  },
  "pagination": {...}
}
```

---

### **Create Template:**

**Endpoint:** `POST /api/v1/admin/templates`

```javascript
const template = await api.admin.createTemplate({
  name: "modern-tech-resume",
  displayName: "Modern Tech Resume",
  description: "Clean and modern...",
  profession: "Software Engineer",
  styleCategory: "Modern",
  subscriptionTier: "free",
  colorScheme: {
    primary: "#1e40af",
    secondary: "#3b82f6",
    accent: "#60a5fa",
    text: "#1f2937",
    background: "#ffffff"
  },
  htmlTemplate: "<div>...</div>",
  cssTemplate: ".resume { ... }",
  availableSections: {
    personalInfo: true,
    summary: true,
    experience: true,
    education: true,
    skills: true
  },
  tags: ["modern", "tech", "professional"]
});
```

---

### **Update Template:**

**Endpoint:** `PUT /api/v1/admin/templates/:id`

```javascript
await api.admin.updateTemplate(templateId, {
  displayName: "Updated Name",
  description: "New description...",
  isActive: true
});
```

---

### **Toggle Status (Activate/Deactivate):**

**Endpoint:** `PATCH /api/v1/admin/templates/:id/toggle-status`

```javascript
// Activate or deactivate template
await api.admin.toggleTemplateStatus(templateId);
```

---

### **Duplicate Template:**

**Endpoint:** `POST /api/v1/admin/templates/:id/duplicate`

```javascript
const duplicated = await api.admin.duplicateTemplate(templateId);
// Creates a copy with "(Copy)" suffix
```

---

### **Delete Template:**

**Endpoint:** `DELETE /api/v1/admin/templates/:id`

```javascript
await api.admin.deleteTemplate(templateId);
```

---

### **Get Analytics:**

**Endpoint:** `GET /api/v1/admin/templates/:id/analytics`

```javascript
const analytics = await api.admin.getTemplateAnalytics(templateId);

// Returns:
{
  "template": {...},
  "resumeCount": 150,
  "recentUsage": [...],
  "averageRating": 4.5,
  "totalRatings": 42
}
```

---

## 📊 Template Analytics

View template performance:

```javascript
// Get overall statistics
const stats = await api.admin.getTemplateStatistics();

Response:
{
  "byProfession": [
    { "_id": "Software Engineer", "count": 5, "active": 4 },
    { "_id": "Designer", "count": 3, "active": 3 }
  ],
  "byTier": [
    { "_id": "free", "count": 5 },
    { "_id": "basic", "count": 3 },
    { "_id": "premium", "count": 2 }
  ],
  "mostUsed": [
    { "displayName": "Modern Tech", "usageCount": 1500 },
    ...
  ],
  "topRated": [
    { "displayName": "Classic Pro", "rating": { "average": 4.8 } },
    ...
  ]
}
```

---

## 🎯 User Experience Flow

### **How Users See Templates:**

1. **Browse Templates** → `/templates`
   - Filter by profession
   - Filter by style
   - View only templates they can access (based on subscription)

2. **Preview Template** → `/templates/:id/preview`
   - See thumbnail
   - View sample resume
   - Read description

3. **Use Template** → Click "Use Template"
   - Loads template into resume builder
   - Pre-fills sections
   - User adds their data

4. **Create Resume** → Fill form
   - Dynamic form based on template sections
   - Live preview while typing
   - Save & download PDF

---

## 💡 Template Ideas by Profession

### **Software Engineer:**
- Emphasis on technical skills
- Projects section prominent
- GitHub/Portfolio links
- Modern, tech-focused design

### **Designer:**
- Portfolio showcase
- Visual/creative layout
- Bold colors
- Project images (optional)

### **Marketing:**
- Campaign achievements
- Metrics-focused
- Professional but creative
- Social media links

### **Finance:**
- Traditional, formal design
- Certifications prominent
- Conservative colors
- Numbers and metrics

### **Student/Fresher:**
- Education first
- Projects/coursework
- Skills section
- Clean, simple layout

---

## 🔒 Access Control

### **Template Tiers:**

**Free Tier:**
- Access to `subscriptionTier: 'free'` templates
- Limited downloads
- Basic features

**Basic Tier:**
- Access to free + `subscriptionTier: 'basic'` templates
- More downloads
- Additional features

**Premium Tier:**
- Access to ALL templates
- Unlimited downloads
- All features unlocked

**Check in Code:**
```javascript
// Backend checks user subscription
const userTier = user.currentPlan.toLowerCase(); // 'free', 'basic', 'premium'

const tierHierarchy = {
  free: ['free'],
  basic: ['free', 'basic'],
  premium: ['free', 'basic', 'premium']
};

const canAccess = tierHierarchy[userTier].includes(template.subscriptionTier);
```

---

## 🛠️ Troubleshooting

### **Template Not Showing:**
- Check `isActive` status
- Verify subscription tier
- Check profession filter

### **Preview Not Working:**
- Validate HTML syntax
- Check CSS errors
- Ensure placeholders are correct

### **Users Can't Access:**
- Verify subscription tier setting
- Check template status (active/inactive)
- Ensure user's subscription is active

---

## 📝 Quick Reference

### **Admin API Endpoints:**

```
GET    /api/v1/admin/templates
POST   /api/v1/admin/templates
GET    /api/v1/admin/templates/:id
PUT    /api/v1/admin/templates/:id
DELETE /api/v1/admin/templates/:id
PATCH  /api/v1/admin/templates/:id/toggle-status
POST   /api/v1/admin/templates/:id/duplicate
GET    /api/v1/admin/templates/:id/analytics
GET    /api/v1/admin/templates/statistics
PATCH  /api/v1/admin/templates/bulk-update
```

### **User API Endpoints:**

```
GET    /api/v1/templates
GET    /api/v1/templates/profession/:profession
GET    /api/v1/templates/:id
GET    /api/v1/templates/:id/preview
POST   /api/v1/templates/:id/use
POST   /api/v1/templates/:id/rate
```

---

## ✨ Tips for Creating Great Templates

1. **Keep it Simple**: Don't overcomplicate the design
2. **Test with Real Data**: Use actual resume content to test
3. **Think ATS-Friendly**: Avoid complex layouts for better parsing
4. **Responsive**: Ensure it looks good when printed
5. **Consistent Spacing**: Maintain uniform margins and padding
6. **Readable Fonts**: Use common, professional fonts
7. **Contrast**: Ensure text is easily readable
8. **Section Headers**: Make them clear and prominent
9. **Bullet Points**: Use for achievements and responsibilities
10. **White Space**: Don't cram too much information

---

**Happy Template Creating! 🎨**