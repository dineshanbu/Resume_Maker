require('dotenv').config();
const mongoose = require('mongoose');
const Theme = require('./src/models/Theme.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-job-portal';

// Simulate the getSubscriptionFilter function
const getSubscriptionFilter = (user) => {
    const isPremium = user && user.subscriptionType === 'PREMIUM' && user.subscriptionStatus === 'ACTIVE';

    const statusQuery = {
        $or: [
            { status: 'Active' },
            { status: { $exists: false } },
            { isActive: true }
        ]
    };

    const allowedTiers = isPremium ? ['FREE', 'PREMIUM', 'BOTH'] : ['FREE', 'BOTH'];
    const accessQuery = {
        $or: [
            { accessType: { $in: allowedTiers } },
            { accessType: { $exists: false } }
        ]
    };

    return {
        $and: [statusQuery, accessQuery]
    };
};

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB\n');

    // Test 1: Original filter (no status override)
    console.log('=== TEST 1: Original Filter (No Override) ===');
    const filter1 = getSubscriptionFilter({ subscriptionType: 'FREE' });
    console.log('Filter:', JSON.stringify(filter1, null, 2));
    const themes1 = await Theme.find(filter1).select('name status accessType');
    console.log(`Found ${themes1.length} themes:`);
    themes1.forEach(t => console.log(`  - ${t.name} (status: ${t.status}, access: ${t.accessType})`));
    console.log('');

    // Test 2: With Active status override (CURRENT IMPLEMENTATION)
    console.log('=== TEST 2: With Active Override (Current) ===');
    const filter2 = getSubscriptionFilter({ subscriptionType: 'FREE' });
    filter2.$and = [
        { status: 'Active' },
        filter2.$and[1] // Keep accessType filter
    ];
    console.log('Filter:', JSON.stringify(filter2, null, 2));
    const themes2 = await Theme.find(filter2).select('name status accessType');
    console.log(`Found ${themes2.length} themes:`);
    themes2.forEach(t => console.log(`  - ${t.name} (status: ${t.status}, access: ${t.accessType})`));
    console.log('');

    // Test 3: Correct override approach
    console.log('=== TEST 3: Correct Override (Proposed Fix) ===');
    const filter3 = {
        status: 'Active',
        $or: [
            { accessType: { $in: ['FREE', 'BOTH'] } },
            { accessType: { $exists: false } }
        ]
    };
    console.log('Filter:', JSON.stringify(filter3, null, 2));
    const themes3 = await Theme.find(filter3).select('name status accessType');
    console.log(`Found ${themes3.length} themes:`);
    themes3.forEach(t => console.log(`  - ${t.name} (status: ${t.status}, access: ${t.accessType})`));

    process.exit(0);
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
