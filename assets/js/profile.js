// ========================================
// Profile Page Script
// ========================================

// Handle Profile Image Upload
const profileImageInput = document.getElementById('profileImageInput');
if (profileImageInput) {
    profileImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('profileImage').src = event.target.result;
                showToast('Profile image updated!');
            };
            reader.readAsDataURL(file);
        }
    });
}

// Save Profile
function saveProfile() {
    // Get form data
    const profileForm = document.getElementById('profileForm');
    const formData = new FormData(profileForm);
    
    // Simulate API call
    showToast('Saving profile...');
    
    setTimeout(() => {
        showToast('Profile updated successfully!');
    }, 1000);
}

// Change Password
function changePassword() {
    const passwordForm = document.getElementById('passwordForm');
    const inputs = passwordForm.querySelectorAll('input[type="password"]');
    
    // Basic validation
    let hasError = false;
    inputs.forEach(input => {
        if (!input.value) {
            hasError = true;
        }
    });
    
    if (hasError) {
        showToast('Please fill in all password fields', 'error');
        return;
    }
    
    // Check if new passwords match
    const newPass = inputs[1].value;
    const confirmPass = inputs[2].value;
    
    if (newPass !== confirmPass) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    // Simulate API call
    showToast('Updating password...');
    
    setTimeout(() => {
        showToast('Password updated successfully!');
        passwordForm.reset();
    }, 1000);
}

// Delete Account
function deleteAccount() {
    const confirmed = confirm(
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
    );
    
    if (confirmed) {
        const doubleConfirm = confirm(
            'This is your last chance. Are you absolutely sure you want to delete your account?'
        );
        
        if (doubleConfirm) {
            showToast('Deleting account...');
            
            setTimeout(() => {
                showToast('Account deleted successfully');
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            }, 1500);
        }
    }
}

// Initialize Profile Page
document.addEventListener('DOMContentLoaded', () => {
    // Add any profile-specific initialization here
});