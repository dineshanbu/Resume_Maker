require('dotenv').config();
const mongoose = require('mongoose');
const Theme = require('./src/models/Theme.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-job-portal';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB\n');

    // Check all themes and their status
    const allThemes = await Theme.find({}).select('name status isDefault');

    console.log('=== ALL THEMES IN DATABASE ===');
    console.log(`Total Themes: ${allThemes.length}\n`);

    allThemes.forEach((theme, idx) => {
        console.log(`${idx + 1}. ${theme.name}`);
        console.log(`   Status: ${theme.status}`);
        console.log(`   Default: ${theme.isDefault || false}`);
        console.log('');
    });

    const activeCount = await Theme.countDocuments({ status: 'Active' });
    const inactiveCount = await Theme.countDocuments({ status: 'Inactive' });
    const noStatusCount = await Theme.countDocuments({ status: { $exists: false } });

    console.log('=== SUMMARY ===');
    console.log(`Active: ${activeCount}`);
    console.log(`Inactive: ${inactiveCount}`);
    console.log(`No Status Field: ${noStatusCount}`);

    process.exit(0);
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
