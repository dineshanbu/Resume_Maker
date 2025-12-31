# Resume Builder - Premium AI-Powered Resume Builder

A complete, premium, authenticated Resume Builder Web Application built with **pure HTML5, CSS3, Bootstrap 5, and Vanilla JavaScript**.

## 🌟 Features

### Core Features
- ✅ **Dashboard** - Overview with stats and recent resumes
- ✅ **My Resumes** - Manage all your resumes with search and filters
- ✅ **Create Resume** - Multi-section advanced form builder with live preview
- ✅ **Upload Resume** - Upload PDF and convert to editable format
- ✅ **AI Resume Builder** - AI-powered resume generation
- ✅ **Templates** - Collection of professionally designed templates
- ✅ **Profile & Settings** - User profile management

### Resume Creation Sections
1. Personal Information
2. Professional Summary (with AI improvement)
3. Work Experience (multiple entries)
4. Projects (multiple entries)
5. Education (multiple entries)
6. Skills (with proficiency levels)
7. Certifications
8. Languages
9. Achievements/Awards
10. Additional Details

### Design Features
- 🎨 Modern SaaS UI design
- 📱 Fully responsive (Mobile, Tablet, Desktop)
- ✨ Smooth animations and transitions
- 🎯 Clean and professional interface
- 🔄 Live resume preview
- 🎭 Multiple template options

## 🎨 Design System

### Colors
- **Primary Color**: `#1D88ED` (Blue)
- **Accent Color**: `#06B6D4` & `#22D3EE` (Cyan shades)
- **Background**: `#F8FAFC` (Light gray)
- **Text Color**: `#0F172A` (Dark blue-gray)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 300, 400, 500, 600, 700

## 📁 Project Structure

```
/resume-builder/
├── dashboard.html              # Main dashboard page
├── my-resumes.html            # Resume management page
├── create-resume.html         # Resume creation form
├── upload-resume.html         # PDF upload page
├── ai-builder.html            # AI resume builder
├── templates.html             # Template gallery
├── profile.html               # User profile page
├── assets/
│   ├── css/
│   │   └── styles.css         # Main stylesheet
│   └── js/
│       ├── script.js          # Common functions
│       ├── dashboard.js       # Dashboard logic
│       ├── my-resumes.js      # Resume management logic
│       ├── create-resume.js   # Form builder logic
│       ├── upload-resume.js   # Upload functionality
│       ├── ai-builder.js      # AI builder logic
│       ├── templates.js       # Template gallery logic
│       └── profile.js         # Profile management
└── README.md
```

## 🚀 Getting Started

### Access the Application

Simply open any HTML file in your browser:

```
http://localhost:3000/resume-builder/dashboard.html
```

### Pages Overview

1. **Dashboard** (`dashboard.html`)
   - View statistics (Total Resumes, Drafts, Completed, Downloads)
   - See recent resumes
   - Quick actions

2. **My Resumes** (`my-resumes.html`)
   - Grid view of all resumes
   - Search and filter functionality
   - Edit, Duplicate, Delete, Download actions
   - Resume status badges

3. **Create Resume** (`create-resume.html`)
   - Multi-step form with progress indicator
   - Live preview on the right side
   - Add multiple experiences, projects, education
   - AI-powered summary improvement
   - Save as draft or download

4. **Upload Resume** (`upload-resume.html`)
   - Drag & drop PDF upload
   - Progress bar animation
   - Extracted content preview
   - Convert to editable format

5. **AI Resume Builder** (`ai-builder.html`)
   - Tell AI about yourself
   - Generate complete resume content
   - AI tools: Improve Summary, Rewrite Experience, Suggest Skills, Optimize for ATS
   - Accept and edit generated content

6. **Templates** (`templates.html`)
   - Template gallery with categories
   - Filter by: Modern, Professional, Creative, ATS-Friendly
   - Preview templates
   - Apply template to resume

7. **Profile** (`profile.html`)
   - Update personal information
   - Change password
   - Account settings
   - Subscription status

## 🎯 Key Features

### Interactive Elements
- ✅ Collapsible sidebar
- ✅ Sticky navigation
- ✅ Animated stat counters
- ✅ Skeleton loading states
- ✅ Toast notifications
- ✅ Modal dialogs
- ✅ Form validation
- ✅ Live preview updates
- ✅ Drag & drop file upload
- ✅ Progress indicators

### Data Management
- Uses **localStorage** for data persistence
- Mock data for demonstration
- CRUD operations for resumes
- Search and filter functionality

### Animations
- ✅ Page transitions
- ✅ Hover effects
- ✅ Button ripples
- ✅ Card lifts
- ✅ Progress animations
- ✅ Loading animations
- ✅ Success animations

## 🛠️ Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **Bootstrap 5.3.2** - Responsive framework
- **Vanilla JavaScript** - No frameworks, pure JS
- **Font Awesome 6.5.1** - Icons
- **Google Fonts (Inter)** - Typography

## 📱 Responsive Design

The application is fully responsive and works perfectly on:
- 📱 Mobile devices (320px and up)
- 📱 Tablets (768px and up)
- 💻 Desktops (1024px and up)
- 🖥️ Large screens (1920px and up)

## 🎨 UI/UX Features

### Modern SaaS Design
- Clean and minimal interface
- Card-based layouts
- Gradient accents
- Professional color scheme
- Consistent spacing and typography

### Micro-Interactions
- Hover states on all interactive elements
- Smooth transitions (0.3s cubic-bezier)
- Button animations
- Form field focus effects
- Loading states

### Accessibility
- Semantic HTML elements
- Proper form labels
- Keyboard navigation support
- Focus states
- Color contrast compliance

## 🔧 Customization

### Changing Colors
Edit the CSS variables in `assets/css/styles.css`:

```css
:root {
    --primary-color: #1D88ED;
    --accent-cyan: #06B6D4;
    --accent-cyan-light: #22D3EE;
    --background: #F8FAFC;
    --text-color: #0F172A;
}
```

### Adding New Templates
Add template data in `assets/js/script.js`:

```javascript
const mockTemplates = [
    {
        id: 7,
        name: 'Your Template Name',
        category: 'modern',
        description: 'Your template description'
    }
];
```

## 📝 Mock Data

The application uses mock data stored in localStorage:
- **Resumes**: 5 sample resumes
- **Templates**: 6 sample templates

Data is automatically initialized on first load.

## 🎯 Future Enhancements

Potential features for backend integration:
- User authentication
- Real PDF generation
- Actual AI integration
- Cloud storage
- Resume sharing
- Export to multiple formats
- Template marketplace
- Collaboration features

## 📄 License

This is a UI-only implementation for demonstration purposes.

## 👨‍💻 Author

Built with ❤️ as a premium Resume Builder UI

---

**Note**: This is a frontend-only implementation with no backend, APIs, or database. All data is stored in browser localStorage and resets when cleared. For production use, integrate with a proper backend system.
