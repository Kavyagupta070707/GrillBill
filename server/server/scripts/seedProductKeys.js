const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ProductKey = require('../models/ProductKey');

// Load environment variables
dotenv.config();

const seedProductKeys = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing product keys
    await ProductKey.deleteMany({});
    console.log('Cleared existing product keys');

    // Sample product keys
    const productKeys = [
      { key: 'RPK-2024-ADMIN-001', plan: 'starter' },
      { key: 'RPK-2024-ADMIN-002', plan: 'professional' },
      { key: 'RPK-2024-ADMIN-003', plan: 'enterprise' },
      { key: 'RPK-2024-ADMIN-004', plan: 'starter' },
      { key: 'RPK-2024-ADMIN-005', plan: 'professional' },
      { key: 'RPK-2024-DEMO-001', plan: 'starter' },
      { key: 'RPK-2024-DEMO-002', plan: 'professional' },
      { key: 'RPK-2024-DEMO-003', plan: 'enterprise' }
    ];

    // Insert product keys
    await ProductKey.insertMany(productKeys);
    console.log(`Seeded ${productKeys.length} product keys`);

    console.log('Product keys seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding product keys:', error);
    process.exit(1);
  }
};

seedProductKeys();