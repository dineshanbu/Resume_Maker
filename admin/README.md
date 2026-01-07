# Admin Panel Restructure - Documentation

## Overview
This document describes the new MVC-style admin panel architecture with sidebar-based navigation.

## New File Structure

```
/app/admin/
├── admin-layout.html          # Main admin panel entry point (sidebar + navbar + dynamic content)
├── admin.css                  # All admin styling (sidebar, navbar, content)
├── admin.js                   # Main router and layout controller
├── admin-dashboard.html       # Legacy redirect file
├── admin_create_resume.html   # Template builder (preserved)
└── controllers/
    ├── dashboard.controller.js    # Dashboard stats and overview
    ├── templates.controller.js    # Template management (list, toggle status, etc.)
    └── categories.controller.js   # Template categories view
```

## Key Features

### 1. MVC-Style Architecture
- **Layout**: `admin-layout.html` contains sidebar and navbar (loaded once)
- **Views**: Content loaded dynamically into `#adminContent` 
- **Controllers**: Handle API calls and DOM updates

### 2. Sidebar Navigation
- **Fixed left sidebar** with grouped menus:
  - Admin Dashboard
  - Template Management (All Templates, Create New, Categories, Pending Review, Analytics)
  - User Management
  - Subscription Management
  - Job Management
  - Content Management
  - Analytics & Reports
  - Settings

- **Features**:
  - Collapsible/expandable
  - Active menu highlighting
  - State persistence (localStorage)
  - Mobile responsive
  - Smooth animations

### 3. Top Navbar
- Page title (dynamic based on route)
- Notification icon with badge
- Admin profile dropdown
  - Profile
  - Settings
  - Logout

### 4. Dynamic Content Loading
- No full page reloads
- Hash-based routing (`#dashboard`, `#templates`, etc.)
- Browser history support (back/forward buttons work)
- Animated content transitions

### 5. Template Management (Priority Implementation)

#### All Templates (`#templates`)
- Table view with filters
- Search by name, profession
- Filter by tier (free/basic/premium)
- Filter by status (active/inactive)
- Actions: View, Toggle Status
- Real-time filtering

#### Create New Template (`#create-template`)
- Redirects to existing `admin_create_resume.html`
- Maintains layout consistency

#### Categories (`#categories`)
- Card grid view
- Groups templates by category and profession
- Shows counts per category/profession
- Visual icons for each category

### 6. Dashboard (`#dashboard`)
- Stats cards:
  - Total Templates
  - Active Templates
  - Total Users
  - Premium Users
  - Total Revenue
  - Recent Signups
- Quick actions (Create Template, Manage Templates, View Users)
- Recent templates table

## API Integration

### Expected Endpoints:
- `GET /api/v1/admin/templates` - Fetch all templates
- `POST /api/v1/admin/templates` - Create new template
- `PUT /api/v1/admin/templates/:id` - Update template
- `DELETE /api/v1/admin/templates/:id` - Delete template
- `GET /api/v1/admin/stats` - Dashboard statistics

### API Response Format:
```javascript
{
  "success": true,
  "data": [/* array of templates */]
}
```

### Fallback:
If API endpoint doesn't exist, controllers use mock data to display UI.

## Design System

### Colors:
- **Primary**: `#667eea → #764ba2` (purple gradient)
- **Success**: `#11998e → #38ef7d`
- **Warning**: `#f093fb → #f5576c`
- **Info**: `#4facfe → #00f2fe`
- **Danger**: `#fa709a → #fee140`

### Typography:
- **Font Family**: Rubik (Google Fonts)
- **Heading Weights**: 600-700
- **Body Weights**: 400-500

### Spacing:
- **Sidebar Width**: 280px (collapsed: 80px)
- **Navbar Height**: 70px
- **Content Padding**: 2rem

### Animations:
- **Transition Speed**: 0.3s
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Hover effects**: Transform translateY(-4px)

## Usage Guide

### Accessing Admin Panel
1. Login as admin (role: 'admin')
2. Navigate to `/admin/admin-layout.html`
3. Old `/admin/admin-dashboard.html` automatically redirects

### Adding New Routes
1. Add menu item in `admin-layout.html`:
```html
<a href="#new-route" class="nav-item" data-route="new-route">
    <i class="bi bi-icon"></i>
    <span>New Feature</span>
</a>
```

2. Add route handler in `admin.js`:
```javascript
case 'new-route':
    await this.loadNewRoute(content);
    break;
```

3. Add page title in titles object:
```javascript
const titles = {
    // ...existing
    'new-route': 'New Feature Name'
};
```

### Creating New Controller
1. Create `/admin/controllers/new-feature.controller.js`:
```javascript
const NewFeatureController = {
    async render(container) {
        container.innerHTML = this.getHTML();
    },
    
    getHTML() {
        return `<div class="content-card">Content here</div>`;
    }
};
```

2. Include in `admin-layout.html`:
```html
<script src="/admin/controllers/new-feature.controller.js"></script>
```

## Security

### Authentication
- Requires `role === 'admin'`
- Handled by `authService.requireAdmin()`
- Redirects non-admin users to login/dashboard

### Session Management
- JWT tokens stored in localStorage
- Auto-logout on token expiry
- Session cleared on logout

## Responsive Design

### Breakpoints:
- **Desktop**: > 992px (sidebar visible)
- **Tablet**: 768px - 992px (collapsible sidebar)
- **Mobile**: < 768px (sidebar slides in from left)

### Mobile Features:
- Hamburger menu toggle
- Touch-friendly buttons
- Simplified profile dropdown

## Testing

### Test IDs (data-testid):
- `admin-sidebar` - Sidebar container
- `sidebar-toggle` - Collapse/expand button
- `admin-navbar` - Top navbar
- `page-title` - Dynamic page title
- `admin-content` - Content area
- `templates-table` - Templates table
- `search-templates` - Search input
- `filter-tier` - Tier filter dropdown
- `filter-status` - Status filter dropdown

## Migration Notes

### Changes from Old System:
- ✅ Single entry point (`admin-layout.html`)
- ✅ No repeated sidebar/navbar HTML
- ✅ Dynamic content loading
- ✅ Persistent sidebar state
- ✅ Professional sidebar design
- ✅ Grouped menu structure
- ✅ Template Management UI implemented

### Preserved:
- ✅ Existing template creator (`admin_create_resume.html`)
- ✅ Design system (colors, fonts)
- ✅ Authentication flow
- ✅ API service layer

### Coming Soon:
- User Management UI
- Subscription Management UI
- Job Management UI
- Analytics & Reports UI
- Settings UI

## Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported

## Performance
- Lazy loading of content
- Efficient DOM updates
- CSS animations (GPU accelerated)
- Minimal JavaScript dependencies

## Troubleshooting

### Sidebar not showing:
- Check if `authService.requireAdmin()` passes
- Verify role === 'admin' in localStorage

### Content not loading:
- Check browser console for errors
- Verify API endpoints are accessible
- Check if controllers are loaded

### Styles not applying:
- Clear browser cache
- Check if `/admin/admin.css` is loaded
- Verify CSS variables in `:root`

## Future Enhancements
- [ ] Real-time notifications
- [ ] Drag & drop template ordering
- [ ] Bulk template operations
- [ ] Advanced analytics charts
- [ ] Template preview modal
- [ ] Export/import templates
- [ ] Multi-language support
