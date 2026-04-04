const mongoose = require('mongoose');

async function cleanDatabase() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/healthcare_trust');
    console.log('Connected to MongoDB');

    const collections = [
      'users',
      'appointments',
      'blooddonors',
      'organdonors',
      'medicines',
      'prescriptions',
    ];

    for (const collection of collections) {
      const result = await mongoose.connection.collection(collection).deleteMany({});
      console.log(`${collection}: ${result.deletedCount} documents deleted`);
    }

    console.log('Database cleaned successfully');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

cleanDatabase();
