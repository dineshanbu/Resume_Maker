// Categories Controller - Handles Template Categories UI

const CategoriesController = {
    categories: [],

    async render(container) {
        container.innerHTML = this.getLoadingHTML();
        await this.loadCategories();
        container.innerHTML = this.getCategoriesHTML();
    },

    async loadCategories() {
        try {
            // Try to fetch from API
            const response = await apiService.get('/api/v1/admin/templates');
            let templates = [];
            
            if (response.success && response.data) {
                templates = response.data;
            } else if (Array.isArray(response)) {
                templates = response;
            }

            // Group templates by category and profession
            this.categories = this.groupTemplates(templates);
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    },

    groupTemplates(templates) {
        const grouped = {};

        templates.forEach(template => {
            const category = template.category || 'Uncategorized';
            const profession = template.profession || 'General';

            if (!grouped[category]) {
                grouped[category] = {
                    name: category,
                    professions: {},
                    totalCount: 0
                };
            }

            if (!grouped[category].professions[profession]) {
                grouped[category].professions[profession] = {
                    name: profession,
                    count: 0,
                    templates: []
                };
            }

            grouped[category].professions[profession].count++;
            grouped[category].professions[profession].templates.push(template);
            grouped[category].totalCount++;
        });

        return Object.values(grouped);
    },

    getLoadingHTML() {
        return `
            <div class="content-card">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p class="text-center text-muted">Loading categories...</p>
            </div>
        `;
    },

    getCategoriesHTML() {
        return `
            <div class="content-card" data-testid="categories-card">
                <div class="section-header">
                    <h2>Template Categories</h2>
                </div>

                ${this.categories.length > 0 ? this.getCategoriesGridHTML() : this.getEmptyStateHTML()}
            </div>
        `;
    },

    getCategoriesGridHTML() {
        return `
            <div class="row g-4" data-testid="categories-grid">
                ${this.categories.map(category => this.getCategoryCardHTML(category)).join('')}
            </div>
        `;
    },

    getCategoryCardHTML(category) {
        const professionsList = Object.values(category.professions);
        const icons = {
            'Modern': 'bi-lightning',
            'Classic': 'bi-book',
            'Creative': 'bi-palette',
            'Minimal': 'bi-circle',
            'Professional': 'bi-briefcase'
        };
        const icon = icons[category.name] || 'bi-folder';

        return `
            <div class="col-md-6 col-lg-4" data-testid="category-${category.name}">
                <div class="content-card" style="
                    margin-bottom: 0;
                    transition: all 0.3s;
                    cursor: pointer;
                    border: 2px solid transparent;
                " 
                onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='var(--primary-color)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='transparent'">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: var(--primary-gradient);
                            border-radius: 20px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 2.5rem;
                            margin-bottom: 1rem;
                            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
                        ">
                            <i class="bi ${icon}"></i>
                        </div>
                        <h3 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0;">${category.name}</h3>
                        <p style="color: var(--text-secondary); margin: 0;">
                            ${category.totalCount} template${category.totalCount !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
                        <h6 style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.75rem; text-transform: uppercase;">
                            Professions
                        </h6>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${professionsList.map(prof => `
                                <span class="badge" style="
                                    background: rgba(102, 126, 234, 0.1);
                                    color: var(--primary-color);
                                    padding: 0.5rem 0.75rem;
                                    font-weight: 500;
                                    font-size: 0.85rem;
                                ">
                                    ${prof.name} (${prof.count})
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getEmptyStateHTML() {
        return `
            <div class="text-center" style="padding: 4rem 2rem;" data-testid="empty-state">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📁</div>
                <h3>No Categories Found</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                    Categories will appear here once you create templates.
                </p>
                <a href="#create-template" class="btn-primary-gradient">
                    <i class="bi bi-plus-circle"></i>
                    Create Your First Template
                </a>
            </div>
        `;
    }
};
