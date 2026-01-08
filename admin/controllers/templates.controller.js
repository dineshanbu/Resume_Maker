// Templates Controller - Handles Template Management UI and API calls

const TemplatesController = {
    templates: [],
    loading: false,

    async render(container) {
        console.log('✅ TemplatesController.render() called');
        
        // STEP 1: Render static UI immediately (without waiting for API)
        this.templates = []; // Start with empty state
        container.innerHTML = this.getTemplatesHTML();
        this.attachEventHandlers();
        console.log('✅ Templates UI rendered with empty state');
        
        // STEP 2: Load real API data in background (non-blocking)
        if (typeof window.apiService !== 'undefined') {
            this.loadTemplates().then(() => {
                // Update UI with real data if successful
                container.innerHTML = this.getTemplatesHTML();
                this.attachEventHandlers();
                console.log('✅ Templates updated with API data');
            }).catch(error => {
                console.log('⚠️ API load failed, keeping empty state:', error.message);
                // Keep showing empty state, don't break UI with error modals
            });
        } else {
            console.log('⚠️ apiService not available, showing empty state only');
        }
    },

    async loadTemplates() {
        this.loading = true;
        try {
            const response = await apiService.get('/api/v1/admin/templates');
            
            // Handle response structure: { success: true, data: { templates: [...] } }
            if (response.success && response.data) {
                if (response.data.templates) {
                    this.templates = response.data.templates;
                } else if (Array.isArray(response.data)) {
                    this.templates = response.data;
                } else {
                    console.warn('Unexpected API response format:', response);
                    this.templates = [];
                }
            } else if (Array.isArray(response)) {
                this.templates = response;
            } else {
                console.warn('Unexpected API response format:', response);
                this.templates = [];
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            // Don't show error alert - fail silently and keep empty state
            // This prevents modal popups blocking the UI during debugging
            this.templates = [];
        } finally {
            this.loading = false;
        }
    },

    getLoadingHTML() {
        return `
            <div class="content-card">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p class="text-center text-muted">Loading templates...</p>
            </div>
        `;
    },

    getTemplatesHTML() {
        return `
            <div class="content-card" data-testid="templates-card">
                <div class="section-header">
                    <h2>All Templates</h2>
                    <a href="#create-template" class="btn-primary-gradient" data-testid="create-template-btn">
                        <i class="bi bi-plus-circle"></i>
                        Create New Template
                    </a>
                </div>

                <div class="mb-4" style="display: flex; gap: 1rem; align-items: center;">
                    <input 
                        type="text" 
                        id="searchTemplates" 
                        class="form-control" 
                        placeholder="Search templates..."
                        style="max-width: 400px;"
                        data-testid="search-templates"
                    >
                    <select id="filterTier" class="form-select" style="max-width: 200px;" data-testid="filter-tier">
                        <option value="">All Tiers</option>
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                    </select>
                    <select id="filterStatus" class="form-select" style="max-width: 200px;" data-testid="filter-status">
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>

                ${this.templates.length > 0 ? this.getTemplatesTableHTML() : this.getEmptyStateHTML()}
            </div>
        `;
    },

    getTemplatesTableHTML() {
        return `
            <div class="table-responsive" data-testid="templates-table">
                <table class="table table-hover">
                    <thead style="background: var(--bg-hover);">
                        <tr>
                            <th style="border-radius: 8px 0 0 0;">Template Name</th>
                            <th>Category</th>
                            <th>Profession</th>
                            <th>Subscription Tier</th>
                            <th>Status</th>
                            <th style="border-radius: 0 8px 0 0; text-align: center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.templates.map(template => this.getTemplateRowHTML(template)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    getTemplateRowHTML(template) {
        const statusBadge = template.isActive 
            ? '<span class="badge bg-success">Active</span>' 
            : '<span class="badge bg-secondary">Inactive</span>';
        
        const tierBadge = {
            'free': '<span class="badge bg-info">Free</span>',
            'basic': '<span class="badge bg-primary">Basic</span>',
            'premium': '<span class="badge bg-warning text-dark">Premium</span>'
        }[template.subscriptionTier] || '<span class="badge bg-secondary">Unknown</span>';

        return `
            <tr data-template-id="${template._id || template.id}" data-testid="template-row-${template.name}">
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="
                            width: 50px;
                            height: 50px;
                            background: var(--primary-gradient);
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: 700;
                            font-size: 1.25rem;
                        ">
                            ${(template.displayName || template.name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">
                                ${template.displayName || template.name}
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">
                                ${template.name}
                            </div>
                        </div>
                    </div>
                </td>
                <td>${template.category || 'N/A'}</td>
                <td>${template.profession || 'N/A'}</td>
                <td>${tierBadge}</td>
                <td>${statusBadge}</td>
                <td style="text-align: center;">
                    <div class="btn-group" role="group">
                        <button 
                            class="btn btn-sm btn-outline-primary" 
                            onclick="TemplatesController.viewTemplate('${template._id || template.id}')"
                            data-testid="view-template-btn"
                            title="View Details"
                        >
                            <i class="bi bi-eye"></i>
                        </button>
                        <button 
                            class="btn btn-sm btn-outline-info" 
                            onclick="TemplatesController.viewAnalytics('${template._id || template.id}')"
                            data-testid="analytics-template-btn"
                            title="View Analytics"
                        >
                            <i class="bi bi-graph-up"></i>
                        </button>
                        <button 
                            class="btn btn-sm btn-outline-success" 
                            onclick="TemplatesController.editTemplate('${template._id || template.id}')"
                            data-testid="edit-template-btn"
                            title="Edit Template"
                        >
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button 
                            class="btn btn-sm btn-outline-secondary" 
                            onclick="TemplatesController.duplicateTemplate('${template._id || template.id}')"
                            data-testid="duplicate-template-btn"
                            title="Duplicate Template"
                        >
                            <i class="bi bi-files"></i>
                        </button>
                        <button 
                            class="btn btn-sm btn-outline-danger" 
                            onclick="TemplatesController.deleteTemplate('${template._id || template.id}')"
                            data-testid="delete-template-btn"
                            title="Delete Template"
                        >
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    getEmptyStateHTML() {
        return `
            <div class="text-center" style="padding: 4rem 2rem;" data-testid="empty-state">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📄</div>
                <h3>No Templates Found</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                    Get started by creating your first resume template.
                </p>
                <a href="#create-template" class="btn-primary-gradient">
                    <i class="bi bi-plus-circle"></i>
                    Create Your First Template
                </a>
            </div>
        `;
    },

    attachEventHandlers() {
        // Search functionality
        const searchInput = document.getElementById('searchTemplates');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterTemplates());
        }

        // Filter dropdowns
        const filterTier = document.getElementById('filterTier');
        const filterStatus = document.getElementById('filterStatus');
        if (filterTier) {
            filterTier.addEventListener('change', () => this.filterTemplates());
        }
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterTemplates());
        }
    },

    filterTemplates() {
        const searchTerm = document.getElementById('searchTemplates')?.value.toLowerCase() || '';
        const tierFilter = document.getElementById('filterTier')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';

        const rows = document.querySelectorAll('[data-template-id]');
        rows.forEach(row => {
            const templateId = row.getAttribute('data-template-id');
            const template = this.templates.find(t => (t._id || t.id) === templateId);
            
            if (!template) {
                row.style.display = 'none';
                return;
            }

            const matchesSearch = !searchTerm || 
                (template.displayName || '').toLowerCase().includes(searchTerm) ||
                (template.name || '').toLowerCase().includes(searchTerm) ||
                (template.profession || '').toLowerCase().includes(searchTerm);

            const matchesTier = !tierFilter || template.subscriptionTier === tierFilter;
            const matchesStatus = !statusFilter || template.isActive.toString() === statusFilter;

            row.style.display = (matchesSearch && matchesTier && matchesStatus) ? '' : 'none';
        });
    },

    async viewTemplate(templateId) {
        const template = this.templates.find(t => (t._id || t.id) === templateId);
        if (!template) return;

        // Use AlertUtil (should always be available)
        if (window.AlertUtil) {
            AlertUtil.showInfo(
                `Category: ${template.category}\nProfession: ${template.profession}\nTier: ${template.subscriptionTier}\nStatus: ${template.isActive ? 'Active' : 'Inactive'}`,
                template.displayName || template.name
            );
        }
    },

    async toggleStatus(templateId, newStatus) {
        // Use AlertUtil for confirmation
        let confirmed = false;
        if (window.AlertUtil) {
            confirmed = await AlertUtil.showConfirm(
                `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this template?`,
                'Confirm Action',
                'Yes',
                'No'
            );
        }

        if (!confirmed) return;

        try {
            const response = await apiService.put(`/api/v1/admin/templates/${templateId}`, {
                isActive: newStatus
            });

            if (response.success || response.data) {
                // Show success with AlertUtil
                if (window.AlertUtil) {
                    await AlertUtil.showSuccess('Template status updated successfully!');
                }
                
                // Reload the view
                const container = document.getElementById('adminContent');
                await this.render(container);
            } else {
                throw new Error(response.message || 'Failed to update template');
            }
        } catch (error) {
            console.error('Error updating template:', error);
            
            // Show error with AlertUtil
            if (window.AlertUtil) {
                await AlertUtil.showError('Failed to update template status: ' + error.message);
            }
        }
    },

    getErrorHTML(message) {
        return `
            <div class="content-card text-center" style="padding: 4rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
                <h2 style="margin-bottom: 1rem; color: var(--text-primary);">Error Loading Templates</h2>
                <p style="color: var(--text-secondary); font-size: 1rem;">${message}</p>
                <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                    <i class="bi bi-arrow-clockwise me-2"></i>Refresh Page
                </button>
            </div>
        `;
    },

    // ==================== NEW METHODS ====================

    async editTemplate(templateId) {
        const template = this.templates.find(t => (t._id || t.id) === templateId);
        if (!template) {
            if (window.AlertUtil) {
                await AlertUtil.showError('Template not found');
            }
            return;
        }

        // Navigate to edit page with template ID
        window.location.href = `/admin/admin_create_resume.html?edit=${templateId}`;
    },

    async viewAnalytics(templateId) {
        try {
            // Fetch analytics data
            const response = await apiService.get(`/api/v1/admin/templates/${templateId}/analytics`);
            
            if (response.success && response.data) {
                const analytics = response.data;
                const template = analytics.template;
                
                // Display analytics in a modal
                if (window.AlertUtil) {
                    const analyticsHTML = `
                        <div style="text-align: left;">
                            <h4 style="margin-bottom: 1rem; color: #667eea;">${template.name}</h4>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                    <div style="font-size: 0.875rem; color: #6c757d;">Total Usage</div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #495057;">${template.usageCount || 0}</div>
                                </div>
                                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                    <div style="font-size: 0.875rem; color: #6c757d;">Resume Count</div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #495057;">${analytics.resumeCount || 0}</div>
                                </div>
                                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                    <div style="font-size: 0.875rem; color: #6c757d;">Avg Rating</div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #495057;">${analytics.averageRating || 0} ⭐</div>
                                </div>
                                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                    <div style="font-size: 0.875rem; color: #6c757d;">Total Ratings</div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #495057;">${analytics.totalRatings || 0}</div>
                                </div>
                            </div>
                            
                            <div style="margin-top: 1rem;">
                                <strong>Status:</strong> 
                                <span style="color: ${template.isActive ? '#28a745' : '#6c757d'};">
                                    ${template.isActive ? '✓ Active' : '○ Inactive'}
                                </span>
                            </div>
                            
                            ${analytics.recentUsage && analytics.recentUsage.length > 0 ? `
                                <div style="margin-top: 1.5rem;">
                                    <strong>Recent Usage:</strong>
                                    <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                                        ${analytics.recentUsage.slice(0, 5).map(usage => `
                                            <li style="margin-bottom: 0.25rem;">${usage}</li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `;
                    
                    await AlertUtil.showInfo(analyticsHTML, 'Template Analytics');
                }
            } else {
                throw new Error('Failed to fetch analytics data');
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            if (window.AlertUtil) {
                await AlertUtil.showError('Failed to load analytics: ' + error.message);
            }
        }
    },

    async duplicateTemplate(templateId) {
        const template = this.templates.find(t => (t._id || t.id) === templateId);
        if (!template) {
            if (window.AlertUtil) {
                await AlertUtil.showError('Template not found');
            }
            return;
        }

        // Confirm duplication
        let confirmed = false;
        if (window.AlertUtil) {
            confirmed = await AlertUtil.showConfirm(
                `Create a copy of "${template.displayName || template.name}"?`,
                'Duplicate Template',
                'Yes, Duplicate',
                'Cancel'
            );
        }

        if (!confirmed) return;

        try {
            // Call duplicate API
            const response = await apiService.post(`/api/v1/admin/templates/${templateId}/duplicate`);

            if (response.success || response.data) {
                if (window.AlertUtil) {
                    await AlertUtil.showSuccess('Template duplicated successfully!');
                }
                
                // Reload templates
                const container = document.getElementById('adminContent');
                await this.render(container);
            } else {
                throw new Error(response.message || 'Failed to duplicate template');
            }
        } catch (error) {
            console.error('Error duplicating template:', error);
            if (window.AlertUtil) {
                await AlertUtil.showError('Failed to duplicate template: ' + error.message);
            }
        }
    },

    async deleteTemplate(templateId) {
        const template = this.templates.find(t => (t._id || t.id) === templateId);
        if (!template) {
            if (window.AlertUtil) {
                await AlertUtil.showError('Template not found');
            }
            return;
        }

        // Confirm deletion
        let confirmed = false;
        if (window.AlertUtil) {
            confirmed = await AlertUtil.showConfirm(
                `Are you sure you want to delete "${template.displayName || template.name}"? This action cannot be undone.`,
                'Delete Template',
                'Yes, Delete',
                'Cancel'
            );
        }

        if (!confirmed) return;

        try {
            // Call delete API
            const response = await apiService.delete(`/api/v1/admin/templates/${templateId}`);

            if (response.success || response.statusCode === 200) {
                if (window.AlertUtil) {
                    await AlertUtil.showSuccess('Template deleted successfully!');
                }
                
                // Reload templates
                const container = document.getElementById('adminContent');
                await this.render(container);
            } else {
                throw new Error(response.message || 'Failed to delete template');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            if (window.AlertUtil) {
                await AlertUtil.showError('Failed to delete template: ' + error.message);
            }
        }
    }
};
