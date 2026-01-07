// Admin Panel Router and Layout Controller

class AdminPanel {
    constructor() {
        this.currentRoute = 'dashboard';
        this.sidebarCollapsed = false;
        this.init();
    }

    init() {
        // Check admin authentication using centralized guard
        if (!routeGuard.requireAdmin()) {
            return; // Guard will handle redirect
        }

        // Load admin user info
        this.loadAdminInfo();

        // Initialize sidebar
        this.initSidebar();

        // Initialize routing
        this.initRouting();

        // Load initial route
        this.loadRoute(window.location.hash.slice(1) || 'dashboard');
    }

    loadAdminInfo() {
        const user = authManager.getCurrentUser();
        if (user) {
            document.getElementById('adminName').textContent = user.name || 'Admin User';
            const firstLetter = (user.name || 'Admin').charAt(0).toUpperCase();
            document.getElementById('adminAvatar').textContent = firstLetter;
        }
    }

    initSidebar() {
        const sidebar = document.getElementById('adminSidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mainWrapper = document.getElementById('mainWrapper');

        // Desktop toggle
        sidebarToggle.addEventListener('click', () => {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            sidebar.classList.toggle('collapsed');
            
            // Save state
            localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
        });

        // Mobile toggle
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });

        // Close sidebar when clicking outside on mobile
        mainWrapper.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('mobile-open');
            }
        });

        // Restore sidebar state
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
            this.sidebarCollapsed = true;
        }
    }

    initRouting() {
        // Handle navigation clicks
        document.querySelectorAll('.nav-item[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.loadRoute(route);
                window.location.hash = route;

                // Close mobile sidebar
                if (window.innerWidth <= 992) {
                    document.getElementById('adminSidebar').classList.remove('mobile-open');
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            const route = window.location.hash.slice(1) || 'dashboard';
            this.loadRoute(route);
        });
    }

    async loadRoute(route) {
        this.currentRoute = route;

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-route="${route}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        const titles = {
            'dashboard': 'Overview & Stats',
            'templates': 'All Templates',
            'create-template': 'Create New Template',
            'categories': 'Template Categories',
            'pending-review': 'Pending Review',
            'template-analytics': 'Template Analytics',
            'users': 'All Users',
            'job-seekers': 'Job Seekers',
            'employers': 'Employers',
            'admins': 'Admins',
            'subscription-plans': 'Subscription Plans',
            'edit-plans': 'Edit Plans',
            'transactions': 'Transactions',
            'revenue-analytics': 'Revenue Analytics',
            'jobs': 'All Jobs',
            'reported-jobs': 'Reported Jobs',
            'featured-jobs': 'Featured Jobs',
            'job-analytics': 'Job Analytics',
            'email-templates': 'Email Templates',
            'landing-page': 'Landing Page',
            'faqs': 'FAQs & Help',
            'user-statistics': 'User Statistics',
            'revenue-reports': 'Revenue Reports',
            'template-usage': 'Template Usage',
            'job-statistics': 'Job Statistics',
            'system-settings': 'System Settings',
            'email-config': 'Email Configuration',
            'payment-gateway': 'Payment Gateway'
        };
        pageTitle.textContent = titles[route] || 'Admin Panel';

        // Load content based on route
        const content = document.getElementById('adminContent');
        
        try {
            switch (route) {
                case 'dashboard':
                    await this.loadDashboard(content);
                    break;
                case 'templates':
                    await this.loadTemplates(content);
                    break;
                case 'create-template':
                    // Redirect to existing template creator
                    window.location.href = '/admin/admin_create_resume.html';
                    break;
                case 'categories':
                    await this.loadCategories(content);
                    break;
                default:
                    this.loadComingSoon(content, titles[route] || route);
            }
        } catch (error) {
            console.error('Error loading route:', error);
            this.loadError(content, error.message);
        }
    }

    async loadDashboard(container) {
        // Load dashboard content
        if (typeof DashboardController !== 'undefined') {
            await DashboardController.render(container);
        } else {
            container.innerHTML = `
                <div class="content-card">
                    <h2>Dashboard Overview</h2>
                    <p>Loading dashboard data...</p>
                </div>
            `;
        }
    }

    async loadTemplates(container) {
        // Load templates list
        if (typeof TemplatesController !== 'undefined') {
            await TemplatesController.render(container);
        } else {
            container.innerHTML = `
                <div class="content-card">
                    <h2>All Templates</h2>
                    <p>Loading templates...</p>
                </div>
            `;
        }
    }

    async loadCategories(container) {
        // Load categories
        if (typeof CategoriesController !== 'undefined') {
            await CategoriesController.render(container);
        } else {
            container.innerHTML = `
                <div class="content-card">
                    <h2>Template Categories</h2>
                    <p>Loading categories...</p>
                </div>
            `;
        }
    }

    loadComingSoon(container, feature) {
        container.innerHTML = `
            <div class="content-card text-center" style="padding: 4rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🚧</div>
                <h2 style="margin-bottom: 1rem;">${feature}</h2>
                <p style="color: var(--text-secondary); font-size: 1.1rem;">
                    This feature is coming soon! Stay tuned for updates.
                </p>
            </div>
        `;
    }

    loadError(container, message) {
        container.innerHTML = `
            <div class="content-card text-center" style="padding: 4rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
                <h2 style="margin-bottom: 1rem;">Error Loading Content</h2>
                <p style="color: var(--text-secondary);">${message}</p>
            </div>
        `;
    }
}

// Logout handler with Swal confirmation
async function handleLogout(event) {
    event.preventDefault();
    await authManager.logout();
}

// Initialize admin panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
