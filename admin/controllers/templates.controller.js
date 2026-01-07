// Templates Controller - Handles Template Management UI and API calls

const TemplatesController = {
    templates: [],
    loading: false,

    async render(container) {
        // FAIL-SAFE: Check if apiService exists
        if (typeof window.apiService === 'undefined') {
            console.error('❌ apiService is not defined - cannot load templates');
            container.innerHTML = this.getErrorHTML('API Service not available. Please refresh the page.');
            if (window.AlertUtil) {
                AlertUtil.showError('System error: API service unavailable. Please refresh the page.');
            }
            return;
        }

        container.innerHTML = this.getLoadingHTML();
        await this.loadTemplates();
        container.innerHTML = this.getTemplatesHTML();
        this.attachEventHandlers();
    },

    async loadTemplates() {
        this.loading = true;
        try {
            const response = await apiService.get('/api/v1/admin/templates');
            if (response.success && response.data) {
                this.templates = response.data;
            } else if (Array.isArray(response)) {
                this.templates = response;
            } else {
                console.warn('Unexpected API response format:', response);
                this.templates = [];
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            
            // Show error alert if AlertUtil is available
            if (window.AlertUtil) {
                AlertUtil.showError('Failed to load templates: ' + error.message);
            }
            
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
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button 
                            class="btn btn-sm btn-outline-primary" 
                            onclick="TemplatesController.viewTemplate('${template._id || template.id}')"
                            data-testid="view-template-btn"
                        >
                            <i class="bi bi-eye"></i>
                        </button>
                        <button 
                            class="btn btn-sm btn-outline-${template.isActive ? 'warning' : 'success'}" 
                            onclick="TemplatesController.toggleStatus('${template._id || template.id}', ${!template.isActive})"
                            data-testid="toggle-status-btn"
                        >
                            <i class="bi bi-${template.isActive ? 'pause' : 'play'}-circle"></i>
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

        // Use AlertUtil if available, otherwise fallback to alert
        if (window.AlertUtil) {
            AlertUtil.showInfo(
                `Category: ${template.category}\nProfession: ${template.profession}\nTier: ${template.subscriptionTier}\nStatus: ${template.isActive ? 'Active' : 'Inactive'}`,
                template.displayName || template.name
            );
        } else {
            alert(`Template: ${template.displayName || template.name}\n\nCategory: ${template.category}\nProfession: ${template.profession}\nTier: ${template.subscriptionTier}\nStatus: ${template.isActive ? 'Active' : 'Inactive'}`);
        }
    },

    async toggleStatus(templateId, newStatus) {
        // Use AlertUtil for confirmation if available
        let confirmed = false;
        if (window.AlertUtil) {
            confirmed = await AlertUtil.showConfirm(
                `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this template?`,
                'Confirm Action',
                'Yes',
                'No'
            );
        } else {
            confirmed = confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this template?`);
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
                } else {
                    alert('Template status updated successfully!');
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
            } else {
                alert('Failed to update template status: ' + error.message);
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
    }
};
