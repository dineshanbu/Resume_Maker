// Dashboard Controller - Handles Admin Dashboard UI and Stats

const DashboardController = {
    stats: null,
    recentTemplates: [],

    async render(container) {
        // FAIL-SAFE: Check if apiService exists
        if (typeof window.apiService === 'undefined') {
            console.error('❌ apiService is not defined - cannot load dashboard');
            container.innerHTML = this.getErrorHTML('API Service not available. Please refresh the page.');
            if (window.AlertUtil) {
                AlertUtil.showError('System error: API service unavailable. Please refresh the page.');
            }
            return;
        }

        container.innerHTML = this.getLoadingHTML();
        await this.loadDashboardData();
        container.innerHTML = this.getDashboardHTML();
    },

    async loadDashboardData() {
        try {
            // Load stats and recent templates
            const [statsResponse, templatesResponse] = await Promise.all([
                apiService.get('/api/v1/admin/stats').catch(() => null),
                apiService.get('/api/v1/admin/templates?limit=5').catch(() => null)
            ]);

            // Process stats
            if (statsResponse && statsResponse.data) {
                this.stats = statsResponse.data;
            } else {
                // Mock data if API not available
                this.stats = {
                    totalTemplates: 24,
                    activeTemplates: 18,
                    totalUsers: 1284,
                    premiumUsers: 187,
                    totalRevenue: 12540,
                    recentSignups: 47
                };
            }

            // Process templates
            if (templatesResponse && templatesResponse.data) {
                this.recentTemplates = templatesResponse.data.slice(0, 5);
            } else if (Array.isArray(templatesResponse)) {
                this.recentTemplates = templatesResponse.slice(0, 5);
            } else {
                this.recentTemplates = [];
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            
            // Show error alert if AlertUtil is available
            if (window.AlertUtil) {
                AlertUtil.showError('Failed to load dashboard data: ' + error.message);
            }
            
            // Use mock data on error
            this.stats = {
                totalTemplates: 24,
                activeTemplates: 18,
                totalUsers: 1284,
                premiumUsers: 187,
                totalRevenue: 12540,
                recentSignups: 47
            };
            this.recentTemplates = [];
        }
    },

    getLoadingHTML() {
        return `
            <div class="content-card">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p class="text-center text-muted">Loading dashboard...</p>
            </div>
        `;
    },

    getDashboardHTML() {
        return `
            <!-- Stats Cards -->
            <div class="row g-4 mb-4" data-testid="stats-grid">
                ${this.getStatCard('Total Templates', this.stats.totalTemplates, 'bi-file-earmark-text', 'primary')}
                ${this.getStatCard('Active Templates', this.stats.activeTemplates, 'bi-check-circle', 'success')}
                ${this.getStatCard('Total Users', this.stats.totalUsers, 'bi-people', 'info')}
                ${this.getStatCard('Premium Users', this.stats.premiumUsers, 'bi-star', 'warning')}
                ${this.getStatCard('Total Revenue', '$' + this.stats.totalRevenue, 'bi-currency-dollar', 'danger')}
                ${this.getStatCard('Recent Signups', this.stats.recentSignups, 'bi-person-plus', 'secondary')}
            </div>

            <!-- Quick Actions -->
            <div class="content-card mb-4" data-testid="quick-actions">
                <div class="section-header">
                    <h2>Quick Actions</h2>
                </div>
                <div class="row g-3">
                    <div class="col-md-4">
                        <a href="#create-template" class="btn-primary-gradient w-100" style="padding: 1.25rem;" data-testid="quick-create-template">
                            <i class="bi bi-plus-circle-fill" style="font-size: 1.5rem;"></i>
                            <span style="display: block; margin-top: 0.5rem; font-size: 1rem;">Create New Template</span>
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="#templates" class="btn btn-outline-primary w-100" style="padding: 1.25rem; border-width: 2px;" data-testid="quick-manage-templates">
                            <i class="bi bi-folder-fill" style="font-size: 1.5rem;"></i>
                            <span style="display: block; margin-top: 0.5rem; font-size: 1rem;">Manage Templates</span>
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="#users" class="btn btn-outline-secondary w-100" style="padding: 1.25rem; border-width: 2px;" data-testid="quick-view-users">
                            <i class="bi bi-people-fill" style="font-size: 1.5rem;"></i>
                            <span style="display: block; margin-top: 0.5rem; font-size: 1rem;">View Users</span>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Recent Templates -->
            <div class="content-card" data-testid="recent-templates">
                <div class="section-header">
                    <h2>Recent Templates</h2>
                    <a href="#templates" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
                ${this.recentTemplates.length > 0 ? this.getRecentTemplatesHTML() : this.getNoTemplatesHTML()}
            </div>
        `;
    },

    getStatCard(label, value, icon, color) {
        const gradients = {
            primary: 'var(--primary-gradient)',
            success: 'var(--success-gradient)',
            info: 'var(--info-gradient)',
            warning: 'var(--warning-gradient)',
            danger: 'var(--danger-gradient)',
            secondary: 'var(--secondary-gradient)'
        };

        return `
            <div class="col-md-6 col-lg-4">
                <div class="content-card" style="margin-bottom: 0; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <div style="
                            width: 70px;
                            height: 70px;
                            background: ${gradients[color]};
                            border-radius: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 2rem;
                            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
                        ">
                            <i class="bi ${icon}"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 2rem; font-weight: 700; margin: 0; color: var(--text-primary);">${value}</h3>
                            <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.95rem;">${label}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getRecentTemplatesHTML() {
        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Template Name</th>
                            <th>Category</th>
                            <th>Tier</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.recentTemplates.map(t => `
                            <tr>
                                <td>
                                    <div style="font-weight: 600;">${t.displayName || t.name}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${t.name}</div>
                                </td>
                                <td>${t.category || 'N/A'}</td>
                                <td>
                                    <span class="badge bg-${t.subscriptionTier === 'free' ? 'info' : t.subscriptionTier === 'basic' ? 'primary' : 'warning'}">
                                        ${t.subscriptionTier || 'N/A'}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge bg-${t.isActive ? 'success' : 'secondary'}">
                                        ${t.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    getNoTemplatesHTML() {
        return `
            <div class="text-center" style="padding: 2rem;">
                <p style="color: var(--text-secondary);">No templates available yet.</p>
                <a href="#create-template" class="btn-primary-gradient mt-2">
                    <i class="bi bi-plus-circle"></i> Create Your First Template
                </a>
            </div>
        `;
    },

    getErrorHTML(message) {
        return `
            <div class="content-card text-center" style="padding: 4rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
                <h2 style="margin-bottom: 1rem; color: var(--text-primary);">Error Loading Dashboard</h2>
                <p style="color: var(--text-secondary); font-size: 1rem;">${message}</p>
                <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                    <i class="bi bi-arrow-clockwise me-2"></i>Refresh Page
                </button>
            </div>
        `;
    }
};
