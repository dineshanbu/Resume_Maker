// Admin Dashboard API Integration
class AdminDashboard {
    constructor() {
        this.apiService = apiService;
        this.authService = authService;
        this.templates = [];
        this.stats = null;
        this.isLoading = false;
    }

    // Initialize dashboard
    async init() {
        console.log('🚀 Initializing Admin Dashboard...');
        
        // Verify admin access
        if (!this.authService.requireAdmin()) {
            return;
        }

        // Load dashboard data
        await this.loadDashboardData();
    }

    // Load all dashboard data
    async loadDashboardData() {
        try {
            this.showLoading();
            
            // Fetch templates data from API
            const response = await this.apiService.get('/api/v1/admin/templates');
            
            if (response.success && response.data) {
                // Map API stats to internal format
                const apiStats = response.data.stats;
                this.stats = {
                    totalTemplates: apiStats.total || 0,
                    activeTemplates: apiStats.active || 0,
                    inactiveTemplates: apiStats.inactive || 0,
                    freeTemplates: apiStats.free || 0,
                    basicTemplates: apiStats.basic || 0,
                    premiumTemplates: apiStats.premium || 0
                };
                
                this.templates = response.data.templates || [];
                
                // Update UI with data
                this.updateStatsCards();
                this.updateTemplatesList();
                this.updateTemplateStatistics();
                
                this.hideLoading();
                console.log('✅ Dashboard data loaded successfully', {
                    stats: this.stats,
                    templateCount: this.templates.length
                });
            } else {
                throw new Error(response.message || 'Failed to load dashboard data');
            }
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            this.showError(error.message);
        }
    }

    // Calculate stats from templates if not provided by API
    calculateStats(templates) {
        if (!templates || templates.length === 0) {
            return {
                totalTemplates: 0,
                activeTemplates: 0,
                inactiveTemplates: 0,
                freeTemplates: 0,
                basicTemplates: 0,
                premiumTemplates: 0
            };
        }

        return {
            totalTemplates: templates.length,
            activeTemplates: templates.filter(t => t.status === 'active').length,
            inactiveTemplates: templates.filter(t => t.status === 'inactive').length,
            freeTemplates: templates.filter(t => t.subscriptionTier === 'free').length,
            basicTemplates: templates.filter(t => t.subscriptionTier === 'basic').length,
            premiumTemplates: templates.filter(t => t.subscriptionTier === 'premium').length
        };
    }

    // Update stats cards with animated counters
    updateStatsCards() {
        if (!this.stats) return;

        const statsMapping = [
            { id: 'stat-total-templates', value: this.stats.totalTemplates, label: 'Total Templates' },
            { id: 'stat-active-templates', value: this.stats.activeTemplates, label: 'Active Templates' },
            { id: 'stat-inactive-templates', value: this.stats.inactiveTemplates, label: 'Inactive Templates' },
            { id: 'stat-free-templates', value: this.stats.freeTemplates, label: 'Free Templates' },
            { id: 'stat-basic-templates', value: this.stats.basicTemplates, label: 'Basic Templates' },
            { id: 'stat-premium-templates', value: this.stats.premiumTemplates, label: 'Premium Templates' }
        ];

        // Create stat cards HTML
        const statsGrid = document.querySelector('[data-testid="stats-grid"]');
        if (!statsGrid) return;

        statsGrid.innerHTML = '';

        statsMapping.forEach((stat, index) => {
            const iconClasses = ['primary', 'success', 'warning', 'info', 'secondary', 'danger'];
            const icons = ['bi-layout-text-sidebar-reverse', 'bi-check-circle-fill', 'bi-x-circle-fill', 'bi-gift-fill', 'bi-star-half', 'bi-star-fill'];
            
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.setAttribute('data-testid', stat.id);
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            card.innerHTML = `
                <div class="stat-icon ${iconClasses[index % iconClasses.length]}">
                    <i class="bi ${icons[index % icons.length]}"></i>
                </div>
                <div class="stat-details">
                    <h3 data-count="${stat.value}">0</h3>
                    <p>${stat.label}</p>
                </div>
            `;
            
            statsGrid.appendChild(card);

            // Animate card entrance
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                
                // Animate counter
                this.animateCounter(card.querySelector('h3'), stat.value);
            }, index * 100);
        });
    }

    // Animate number counter
    animateCounter(element, target) {
        const duration = 1000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // Update templates list
    updateTemplatesList() {
        const templateList = document.querySelector('[data-testid="template-list"]');
        if (!templateList) return;

        if (!this.templates || this.templates.length === 0) {
            templateList.innerHTML = `
                <div class="text-center py-5" style="opacity: 0; animation: fadeIn 0.5s forwards;">
                    <i class="bi bi-inbox" style="font-size: 4rem; opacity: 0.2; color: #6c757d;"></i>
                    <h5 class="mt-3 mb-2" style="color: #6c757d;">No Templates Yet</h5>
                    <p class="text-muted mb-3">Create your first resume template to get started!</p>
                    <a href="/admin/create_template.html" class="btn btn-primary">
                        <i class="bi bi-plus-circle me-2"></i>Create New Template
                    </a>
                </div>
                <style>
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
            `;
            return;
        }

        // Show recent 5 templates
        const recentTemplates = this.templates.slice(0, 5);
        
        templateList.innerHTML = recentTemplates.map((template, index) => {
            const tierClass = this.getTierBadgeClass(template.subscriptionTier);
            const statusClass = template.status === 'active' ? 'status-active' : 'status-inactive';
            const createdDate = this.formatDate(template.createdAt);
            
            return `
                <div class="template-item" data-testid="template-item-${index + 1}" style="opacity: 0; transform: translateX(-20px);">
                    <div class="template-info">
                        <div class="template-icon">
                            <i class="bi bi-file-earmark-text"></i>
                        </div>
                        <div class="template-details">
                            <h5>${this.escapeHtml(template.displayName || template.name || 'Untitled Template')}</h5>
                            <p>${template.styleCategory || 'General'} • Created ${createdDate}${template.usageCount ? ` • ${template.usageCount} uses` : ''}</p>
                        </div>
                        <span class="template-badge ${tierClass}">${this.capitalizeFirst(template.subscriptionTier || 'free')}</span>
                        <span class="status-badge ${statusClass}">${this.capitalizeFirst(template.status || 'active')}</span>
                    </div>
                    <div class="template-actions">
                        <button class="btn-icon btn-preview" title="View Details" onclick="adminDashboard.viewTemplate('${template.id || template._id}')" data-testid="view-template-${index + 1}">
                            <i class="bi bi-eye-fill"></i>
                        </button>
                        <button class="btn-icon btn-edit" title="Edit Template" onclick="adminDashboard.editTemplate('${template.id || template._id}')" data-testid="edit-template-${index + 1}">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Animate template items
        const items = templateList.querySelectorAll('.template-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.transition = 'all 0.4s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 100);
        });
    }

    // Update template statistics section
    updateTemplateStatistics() {
        const statsSection = document.querySelector('[data-testid="template-statistics"]');
        if (!statsSection || !this.stats) return;

        const tierStats = [
            { label: 'Free Tier', value: this.stats.freeTemplates, total: this.stats.totalTemplates, color: '#0dcaf0' },
            { label: 'Basic Tier', value: this.stats.basicTemplates, total: this.stats.totalTemplates, color: '#198754' },
            { label: 'Premium Tier', value: this.stats.premiumTemplates, total: this.stats.totalTemplates, color: '#ffc107' }
        ];

        const statusStats = [
            { label: 'Active', value: this.stats.activeTemplates, total: this.stats.totalTemplates, color: '#198754' },
            { label: 'Inactive', value: this.stats.inactiveTemplates, total: this.stats.totalTemplates, color: '#dc3545' }
        ];

        statsSection.innerHTML = `
            <h5 class="mb-3">Templates by Tier</h5>
            <div class="mb-4">
                ${tierStats.map(stat => {
                    const percentage = stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0;
                    return `
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="small">${stat.label}</span>
                                <span class="small fw-bold">${stat.value} (${percentage}%)</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar" role="progressbar" style="width: ${percentage}%; background-color: ${stat.color};" 
                                     aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <h5 class="mb-3">Templates by Status</h5>
            <div>
                ${statusStats.map(stat => {
                    const percentage = stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0;
                    return `
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="small">${stat.label}</span>
                                <span class="small fw-bold">${stat.value} (${percentage}%)</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar" role="progressbar" style="width: ${percentage}%; background-color: ${stat.color};" 
                                     aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // View template details
    viewTemplate(templateId) {
        console.log('Viewing template:', templateId);
        alert(`Template Details (ID: ${templateId})\n\nThis feature will be implemented in the next phase.`);
    }

    // Edit template
    editTemplate(templateId) {
        console.log('Editing template:', templateId);
        window.location.href = `/admin/create_template.html?id=${templateId}`;
    }

    // Show loading state
    showLoading() {
        this.isLoading = true;
        const statsGrid = document.querySelector('[data-testid="stats-grid"]');
        const templateList = document.querySelector('[data-testid="template-list"]');

        if (statsGrid) {
            statsGrid.innerHTML = this.getSkeletonStats();
        }

        if (templateList) {
            templateList.innerHTML = this.getSkeletonTemplates();
        }
    }

    // Hide loading state
    hideLoading() {
        this.isLoading = false;
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    // Show error state
    showError(message) {
        this.isLoading = false;
        const statsGrid = document.querySelector('[data-testid="stats-grid"]');
        
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger d-flex align-items-center" role="alert" id="error-container">
                        <i class="bi bi-exclamation-triangle-fill me-3" style="font-size: 1.5rem;"></i>
                        <div class="flex-grow-1">
                            <strong>Error Loading Dashboard</strong>
                            <p class="mb-2 mt-1">${this.escapeHtml(message)}</p>
                            <button class="btn btn-sm btn-danger" onclick="adminDashboard.loadDashboardData()">
                                <i class="bi bi-arrow-clockwise me-1"></i> Retry
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Skeleton loading for stats
    getSkeletonStats() {
        return Array(6).fill(0).map(() => `
            <div class="stat-card">
                <div class="stat-icon primary">
                    <div class="skeleton-box" style="width: 30px; height: 30px; border-radius: 6px;"></div>
                </div>
                <div class="stat-details">
                    <div class="skeleton-box mb-2" style="width: 60px; height: 32px;"></div>
                    <div class="skeleton-box" style="width: 120px; height: 16px;"></div>
                </div>
            </div>
        `).join('');
    }

    // Skeleton loading for templates
    getSkeletonTemplates() {
        return Array(3).fill(0).map(() => `
            <div class="template-item">
                <div class="template-info">
                    <div class="template-icon">
                        <div class="skeleton-box" style="width: 30px; height: 30px;"></div>
                    </div>
                    <div class="template-details">
                        <div class="skeleton-box mb-2" style="width: 150px; height: 20px;"></div>
                        <div class="skeleton-box" style="width: 200px; height: 14px;"></div>
                    </div>
                    <div class="skeleton-box" style="width: 70px; height: 24px; border-radius: 20px;"></div>
                    <div class="skeleton-box" style="width: 60px; height: 24px; border-radius: 20px;"></div>
                </div>
                <div class="template-actions">
                    <div class="skeleton-box" style="width: 36px; height: 36px; border-radius: 6px;"></div>
                    <div class="skeleton-box" style="width: 36px; height: 36px; border-radius: 6px;"></div>
                </div>
            </div>
        `).join('');
    }

    // Utility: Get tier badge class
    getTierBadgeClass(tier) {
        const tierMap = {
            'free': 'badge-basic',
            'basic': 'badge-modern',
            'premium': 'badge-premium'
        };
        return tierMap[tier?.toLowerCase()] || 'badge-basic';
    }

    // Utility: Format date
    formatDate(dateString) {
        if (!dateString) return 'Recently';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return date.toLocaleDateString();
    }

    // Utility: Capitalize first letter
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Utility: Escape HTML to prevent XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text?.replace(/[&<>"']/g, m => map[m]) || '';
    }
}

// Create singleton instance
const adminDashboard = new AdminDashboard();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard.init();
});
