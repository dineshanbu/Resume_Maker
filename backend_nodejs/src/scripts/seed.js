// backend/src/scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template.model');
const { SubscriptionPlan } = require('../models/Subscription.model');
const sampleTemplates = require('../data/sampleTemplates');

// Subscription Plans Data
const subscriptionPlans = [
  {
    name: 'Free',
    displayName: 'Free Plan',
    description: 'Get started with basic features',
    pricing: {
      monthly: { amount: 0, currency: 'INR' },
      yearly: { amount: 0, currency: 'INR', discount: 0 }
    },
    features: {
      resumeLimit: 2,
      templateAccess: 'free',
      pdfDownloads: 5,
      jobApplications: 10,
      customTemplates: false,
      prioritySupport: false,
      analyticsAccess: false,
      aiSuggestions: false,
      coverLetterBuilder: false,
      removeWatermark: false
    },
    sortOrder: 1
  },
  {
    name: 'Basic',
    displayName: 'Basic Plan',
    description: 'Perfect for active job seekers',
    pricing: {
      monthly: { amount: 299, currency: 'INR' },
      yearly: { amount: 2999, currency: 'INR', discount: 17 }
    },
    features: {
      resumeLimit: 5,
      templateAccess: 'basic',
      pdfDownloads: 50,
      jobApplications: 50,
      customTemplates: false,
      prioritySupport: true,
      analyticsAccess: true,
      aiSuggestions: true,
      coverLetterBuilder: true,
      removeWatermark: true
    },
    sortOrder: 2
  },
  {
    name: 'Premium',
    displayName: 'Premium Plan',
    description: 'Unlimited access to all features',
    pricing: {
      monthly: { amount: 599, currency: 'INR' },
      yearly: { amount: 5999, currency: 'INR', discount: 17 }
    },
    features: {
      resumeLimit: -1, // Unlimited
      templateAccess: 'premium',
      pdfDownloads: -1, // Unlimited
      jobApplications: -1, // Unlimited
      customTemplates: true,
      prioritySupport: true,
      analyticsAccess: true,
      aiSuggestions: true,
      coverLetterBuilder: true,
      removeWatermark: true
    },
    sortOrder: 3
  }
];

// Connect to Database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Seed Templates
const seedTemplates = async () => {
  try {
    console.log('\n🌱 Seeding Templates...');
    
    // Clear existing templates
    await Template.deleteMany({});
    console.log('  ✓ Cleared existing templates');
    
    // Insert sample templates
    const templates = await Template.insertMany(sampleTemplates);
    console.log(`  ✓ Inserted ${templates.length} templates`);
    
    return templates;
  } catch (error) {
    console.error('  ❌ Error seeding templates:', error);
    throw error;
  }
};

// Seed Subscription Plans
const seedSubscriptionPlans = async () => {
  try {
    console.log('\n🌱 Seeding Subscription Plans...');
    
    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log('  ✓ Cleared existing plans');
    
    // Insert subscription plans
    const plans = await SubscriptionPlan.insertMany(subscriptionPlans);
    console.log(`  ✓ Inserted ${plans.length} subscription plans`);
    
    return plans;
  } catch (error) {
    console.error('  ❌ Error seeding subscription plans:', error);
    throw error;
  }
};

// Main Seed Function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   Database Seeding Started          ║');
    console.log('╚══════════════════════════════════════╝');
    
    const templates = await seedTemplates();
    const plans = await seedSubscriptionPlans();
    
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   Seeding Completed Successfully!   ║');
    console.log('╚══════════════════════════════════════╝\n');
    
    console.log('📊 Summary:');
    console.log(`   Templates: ${templates.length}`);
    console.log(`   Subscription Plans: ${plans.length}`);
    
    console.log('\n✨ Database is ready to use!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding Failed:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();

// Export for use in other scripts
module.exports = { seedTemplates, seedSubscriptionPlans };