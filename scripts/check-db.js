const mongoose = require('mongoose');
const path = require('path');

const MONGO_URI = 'mongodb://localhost:27017/resume_db';

async function checkMasters() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const masters = await mongoose.connection.db.collection('sectionmasters').find({}).toArray();
        console.log('--- Section Masters ---');
        console.log(JSON.stringify(masters, null, 2));

        const layouts = await mongoose.connection.db.collection('sectionlayouts').find({}).toArray();
        console.log('--- Section Layouts ---');
        console.log(`Count: ${layouts.length}`);
        if (layouts.length > 0) {
            console.log('Sample Layout Keys:', Object.keys(layouts[0]));
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkMasters();
