// ========================================
// Global Script - Common Functions
// ========================================

// Sidebar Toggle
const toggleSidebar = document.getElementById('toggleSidebar');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');

if (toggleSidebar) {
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });
}

if (closeSidebar) {
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    });
}

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'dashboard.html';
    }
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add toast styles dynamically
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast-notification {
        position: fixed;
        top: 20px;
        right: -300px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        transition: right 0.3s ease;
        min-width: 250px;
    }
    .toast-notification.show {
        right: 20px;
    }
    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .toast-success i {
        color: #10B981;
        font-size: 1.25rem;
    }
    .toast-error i {
        color: #EF4444;
        font-size: 1.25rem;
    }
    .toast-content span {
        font-weight: 500;
        color: #0F172A;
    }
`;
document.head.appendChild(toastStyles);

// Format Date
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Local Storage Helper
const storage = {
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    },
    remove: (key) => {
        localStorage.removeItem(key);
    }
};

// Mock Data
const mockResumes = [
    {
        id: 1,
        name: 'Senior Frontend Developer Resume',
        template: 'Modern Professional',
        lastUpdated: '2025-01-10',
        status: 'completed',
        category: 'modern'
    },
    {
        id: 2,
        name: 'Full Stack Engineer CV',
        template: 'ATS-Friendly',
        lastUpdated: '2025-01-08',
        status: 'draft',
        category: 'ats'
    },
    {
        id: 3,
        name: 'Product Manager Resume',
        template: 'Creative Design',
        lastUpdated: '2025-01-05',
        status: 'completed',
        category: 'creative'
    },
    {
        id: 4,
        name: 'Software Architect Resume',
        template: 'Professional',
        lastUpdated: '2025-01-03',
        status: 'completed',
        category: 'professional'
    },
    {
        id: 5,
        name: 'UI/UX Designer Portfolio',
        template: 'Creative',
        lastUpdated: '2024-12-28',
        status: 'draft',
        category: 'creative'
    }
];

const mockTemplates = [
    {
        id: 1,
        name: 'Modern Professional',
        category: 'modern',
        description: 'Clean and modern design perfect for tech professionals'
    },
    {
        id: 2,
        name: 'Classic Business',
        category: 'professional',
        description: 'Traditional layout ideal for corporate positions'
    },
    {
        id: 3,
        name: 'Creative Designer',
        category: 'creative',
        description: 'Bold and colorful design for creative roles'
    },
    {
        id: 4,
        name: 'ATS Optimized',
        category: 'ats',
        description: 'Optimized for Applicant Tracking Systems'
    },
    {
        id: 5,
        name: 'Minimalist',
        category: 'modern',
        description: 'Simple and elegant minimalist design'
    },
    {
        id: 6,
        name: 'Executive',
        category: 'professional',
        description: 'Premium design for senior leadership roles'
    }
];

// Initialize mock data in localStorage if not exists
if (!storage.get('resumes')) {
    storage.set('resumes', mockResumes);
}

if (!storage.get('templates')) {
    storage.set('templates', mockTemplates);
}