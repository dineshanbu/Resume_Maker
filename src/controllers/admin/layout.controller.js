// backend/src/controllers/admin/layout.controller.js
const AdminLayout = require('../../models/AdminLayout.model');
const SectionMaster = require('../../models/SectionMaster.model');
const SectionLayout = require('../../models/SectionLayout.model');
const Theme = require('../../models/Theme.model');
const fs = require('fs');
const path = require('path');

// --- Helper Functions ---
const deleteFile = (filePath) => {
    if (filePath && fs.existsSync(path.join(__dirname, '../../../', filePath))) {
        fs.unlinkSync(path.join(__dirname, '../../../', filePath));
    }
};

// --- Admin Layouts ---

exports.getAdminLayouts = async (req, res) => {
    try {
        const layouts = await AdminLayout.find().sort({ createdAt: -1 });
        res.json(layouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAdminLayoutById = async (req, res) => {
    try {
        const layout = await AdminLayout.findById(req.params.id);
        if (!layout) return res.status(404).json({ message: 'Layout not found' });
        res.json(layout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAdminLayout = async (req, res) => {
    try {
        const layout = new AdminLayout(req.body);
        if (req.file) layout.previewImage = req.file.path;
        await layout.save();
        res.status(201).json(layout);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateAdminLayout = async (req, res) => {
    try {
        const layout = await AdminLayout.findById(req.params.id);
        if (!layout) return res.status(404).json({ message: 'Layout not found' });

        Object.assign(layout, req.body);
        if (req.file) {
            deleteFile(layout.previewImage);
            layout.previewImage = req.file.path;
        }

        await layout.save();
        res.json(layout);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteAdminLayout = async (req, res) => {
    try {
        const layout = await AdminLayout.findByIdAndDelete(req.params.id);
        if (!layout) return res.status(404).json({ message: 'Layout not found' });
        deleteFile(layout.previewImage);
        res.json({ message: 'Layout deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Section Masters (NEW) ---

exports.getSectionMasters = async (req, res) => {
    try {
        const masters = await SectionMaster.find().sort({ order: 1 });
        res.json(masters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSectionMasterById = async (req, res) => {
    try {
        const master = await SectionMaster.findById(req.params.id);
        if (!master) return res.status(404).json({ message: 'Master not found' });
        res.json(master);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createSectionMaster = async (req, res) => {
    try {
        // Assign default order if not provided
        if (req.body.order === undefined) {
            const count = await SectionMaster.countDocuments();
            req.body.order = count + 1;
        }

        const master = new SectionMaster(req.body);
        await master.save();
        res.status(201).json(master);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSectionMaster = async (req, res) => {
    try {
        const master = await SectionMaster.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!master) return res.status(404).json({ message: 'Master not found' });
        res.json(master);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSectionMasterOrder = async (req, res) => {
    try {
        const { sections } = req.body; // Expects array of { _id, order }

        if (!sections || !Array.isArray(sections)) {
            return res.status(400).json({ message: 'Invalid data format. Expected array of sections.' });
        }

        const bulkOps = sections.map(section => ({
            updateOne: {
                filter: { _id: section._id },
                update: { $set: { order: section.order } }
            }
        }));

        if (bulkOps.length > 0) {
            await SectionMaster.bulkWrite(bulkOps);
        }

        res.json({ message: 'Section order updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSectionMaster = async (req, res) => {
    try {
        // Check if used by any layout
        const used = await SectionLayout.exists({ sectionMaster: req.params.id });
        if (used) return res.status(400).json({ message: 'Cannot delete master that has layouts' });

        const master = await SectionMaster.findByIdAndDelete(req.params.id);
        if (!master) return res.status(404).json({ message: 'Master not found' });
        res.json({ message: 'Master deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Section Layouts ---

exports.getSectionLayouts = async (req, res) => {
    try {
        const layouts = await SectionLayout.find()
            .populate('sectionMaster')
            .sort({ 'sectionMaster.code': 1, name: 1 });
        res.json(layouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Deprecated or redirect to use with Master ID, but kept for legacy calls if any
exports.getSectionLayoutsByType = async (req, res) => {
    try {
        // If type is an ID (Mongo ObjectId), find by Master ID
        // If type is string (e.g. 'Header'), find by Master Code
        const type = req.params.type;
        let master;

        if (mongoose.Types.ObjectId.isValid(type)) {
            master = await SectionMaster.findById(type);
        } else {
            master = await SectionMaster.findOne({ code: type.toUpperCase() });
        }

        if (!master) return res.status(404).json({ message: 'Section Master not found' });

        const layouts = await SectionLayout.find({ sectionMaster: master._id }).sort({ name: 1 });
        res.json(layouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSectionLayoutsByMasterId = async (req, res) => {
    try {
        const layouts = await SectionLayout.find({ sectionMaster: req.params.masterId }).sort({ name: 1 });
        res.json(layouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getSectionLayoutById = async (req, res) => {
    try {
        const layout = await SectionLayout.findById(req.params.id).populate('sectionMaster');
        if (!layout) return res.status(404).json({ message: 'Layout not found' });
        res.json(layout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createSectionLayout = async (req, res) => {
    try {
        const layout = new SectionLayout(req.body);
        if (req.file) layout.previewImage = req.file.path;
        await layout.save();
        res.status(201).json(layout);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSectionLayout = async (req, res) => {
    try {
        const layout = await SectionLayout.findById(req.params.id);
        if (!layout) return res.status(404).json({ message: 'Layout not found' });

        Object.assign(layout, req.body);
        if (req.file) {
            deleteFile(layout.previewImage);
            layout.previewImage = req.file.path;
        }

        await layout.save();
        res.json(layout);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteSectionLayout = async (req, res) => {
    try {
        const layout = await SectionLayout.findByIdAndDelete(req.params.id);
        if (!layout) return res.status(404).json({ message: 'Layout not found' });
        deleteFile(layout.previewImage);
        res.json({ message: 'Layout deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Themes ---

exports.getThemes = async (req, res) => {
    try {
        const themes = await Theme.find().sort({ createdAt: -1 });
        res.json(themes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getThemeById = async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) return res.status(404).json({ message: 'Theme not found' });
        res.json(theme);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createTheme = async (req, res) => {
    try {
        const theme = new Theme(req.body);
        if (req.file) theme.previewImage = req.file.path;
        await theme.save();
        res.status(201).json(theme);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateTheme = async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) return res.status(404).json({ message: 'Theme not found' });

        Object.assign(theme, req.body);
        if (req.file) {
            deleteFile(theme.previewImage);
            theme.previewImage = req.file.path;
        }

        await theme.save();
        res.json(theme);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteTheme = async (req, res) => {
    try {
        const theme = await Theme.findByIdAndDelete(req.params.id);
        if (!theme) return res.status(404).json({ message: 'Theme not found' });
        deleteFile(theme.previewImage);
        res.json({ message: 'Theme deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
