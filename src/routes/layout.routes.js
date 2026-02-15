// backend/src/routes/layout.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const {
    getAdminLayouts,
    getAdminLayoutById,
    createAdminLayout,
    updateAdminLayout,
    deleteAdminLayout,
    getSectionMasters,       // NEW
    getSectionMasterById,    // NEW
    createSectionMaster,     // NEW
    updateSectionMaster,     // NEW
    updateSectionMasterOrder, // NEW
    deleteSectionMaster,     // NEW
    getSectionLayouts,
    getSectionLayoutsByType, // Kept for logic
    getSectionLayoutsByMasterId, // NEW
    getSectionLayoutById,
    createSectionLayout,
    updateSectionLayout,
    deleteSectionLayout,
    getThemes,
    getThemeById,
    createTheme,
    updateTheme,
    deleteTheme
} = require('../controllers/admin/layout.controller');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// --- Admin Layouts ---
router.get('/config/layouts', getAdminLayouts);
router.get('/config/layouts/:id', getAdminLayoutById);
router.post('/config/layouts', upload.single('previewImage'), createAdminLayout);
router.put('/config/layouts/:id', upload.single('previewImage'), updateAdminLayout);
router.delete('/config/layouts/:id', deleteAdminLayout);

// --- Section Masters (NEW) ---
router.get('/config/section-masters', getSectionMasters);
router.get('/config/section-masters/:id', getSectionMasterById);
router.post('/config/section-masters', createSectionMaster);
router.put('/config/section-masters/order', updateSectionMasterOrder); // NEW: Order update
router.put('/config/section-masters/:id', updateSectionMaster);
router.delete('/config/section-masters/:id', deleteSectionMaster);

// --- Section Layouts ---
router.get('/config/section-layouts', getSectionLayouts);
router.get('/config/section-layouts/type/:type', getSectionLayoutsByType); // Can accept ID or Code
router.get('/config/section-layouts/master/:masterId', getSectionLayoutsByMasterId);
router.get('/config/section-layouts/:id', getSectionLayoutById);
router.post('/config/section-layouts', upload.single('previewImage'), createSectionLayout);
router.put('/config/section-layouts/:id', upload.single('previewImage'), updateSectionLayout);
router.delete('/config/section-layouts/:id', deleteSectionLayout);

// --- Themes ---
router.get('/config/themes', getThemes);
router.get('/config/themes/:id', getThemeById);
router.post('/config/themes', upload.single('previewImage'), createTheme);
router.put('/config/themes/:id', upload.single('previewImage'), updateTheme);
router.delete('/config/themes/:id', deleteTheme);

module.exports = router;
