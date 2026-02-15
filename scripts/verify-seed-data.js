require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-job-portal';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check themes
    const themesCount = await db.collection('themes').countDocuments();
    const themesActive = await db.collection('themes').countDocuments({ status: 'Active' });
    const themesInactive = await db.collection('themes').countDocuments({ status: 'Inactive' });

    console.log('=== THEMES ===');
    console.log(`Total: ${themesCount}`);
    console.log(`Active: ${themesActive}`);
    console.log(`Inactive: ${themesInactive}`);

    if (themesCount > 0) {
        const sampleTheme = await db.collection('themes').findOne({ name: 'Modern Minimal' });
        console.log(`\nSample Theme (Modern Minimal):`);
        console.log(`  - Name: ${sampleTheme?.name}`);
        console.log(`  - Primary Color: ${sampleTheme?.colors?.primary}`);
        console.log(`  - Status: ${sampleTheme?.status}`);
    }

    // Check section layouts
    const layoutsCount = await db.collection('sectionlayouts').countDocuments();
    const layoutsActive = await db.collection('sectionlayouts').countDocuments({ status: 'Active' });
    const layoutsInactive = await db.collection('sectionlayouts').countDocuments({ status: 'Inactive' });

    console.log('\n=== SECTION LAYOUTS ===');
    console.log(`Total: ${layoutsCount}`);
    console.log(`Active: ${layoutsActive}`);
    console.log(`Inactive: ${layoutsInactive}`);

    if (layoutsCount > 0) {
        const sampleLayout = await db.collection('sectionlayouts').findOne({ name: 'Centered' });
        console.log(`\nSample Layout (Centered):`);
        console.log(`  - Name: ${sampleLayout?.name}`);
        console.log(`  - Section Type: ${sampleLayout?.sectionType}`);
        console.log(`  - Status: ${sampleLayout?.status}`);
    }

    // Check indexes on sectionlayouts
    console.log('\n=== SECTION LAYOUTS INDEXES ===');
    const indexes = await db.collection('sectionlayouts').indexes();
    indexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    process.exit(0);
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
