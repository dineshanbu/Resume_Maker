// SweetAlert2 Utility Functions
// Centralized alert management using SweetAlert2

const AlertUtil = {
    // Success message
    showSuccess(message, title = 'Success!') {
        return Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            confirmButtonColor: '#0d6efd',
            confirmButtonText: 'OK',
            timer: 3000,
            timerProgressBar: true
        });
    },

    // Error message
    showError(message, title = 'Error!') {
        return Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'OK'
        });
    },

    // Warning message
    showWarning(message, title = 'Warning!') {
        return Swal.fire({
            icon: 'warning',
            title: title,
            text: message,
            confirmButtonColor: '#ffc107',
            confirmButtonText: 'OK'
        });
    },

    // Info message
    showInfo(message, title = 'Info') {
        return Swal.fire({
            icon: 'info',
            title: title,
            text: message,
            confirmButtonColor: '#0dcaf0',
            confirmButtonText: 'OK'
        });
    },

    // Confirmation dialog
    async showConfirm(message, title = 'Are you sure?', confirmText = 'Yes', cancelText = 'No') {
        const result = await Swal.fire({
            icon: 'question',
            title: title,
            text: message,
            showCancelButton: true,
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#6c757d',
            confirmButtonText: confirmText,
            cancelButtonText: cancelText
        });
        return result.isConfirmed;
    },

    // Loading indicator
    showLoading(message = 'Please wait...') {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    },

    // Close loading
    closeLoading() {
        Swal.close();
    },

    // Toast notification (small, non-intrusive)
    showToast(message, icon = 'success', position = 'top-end') {
        const Toast = Swal.mixin({
            toast: true,
            position: position,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        return Toast.fire({
            icon: icon,
            title: message
        });
    },

    // Unauthorized access warning
    showUnauthorized() {
        return Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have permission to access this page.',
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'OK'
        });
    },

    // Session expired
    showSessionExpired() {
        return Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Your session has expired. Please login again.',
            confirmButtonColor: '#0d6efd',
            confirmButtonText: 'Login',
            allowOutsideClick: false
        });
    },

    // Custom HTML content
    showCustom(config) {
        return Swal.fire(config);
    }
};

// Make it globally available
window.AlertUtil = AlertUtil;
