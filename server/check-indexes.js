require('dotenv').config();
const mongoose = require('mongoose');

async function checkIndexes() {
  const collections = [
    'users',
    'notifications',
    'wallets',
    'ledgerentries',
    'transactionledgers',
    'recyclerschedules',
    'membershipplans',
    'processedwebhooks'
  ];

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');
    const db = mongoose.connection.db;

    for (const collName of collections) {
      console.log(`\nIndexes for collection: ${collName}`);
      try {
        const collection = db.collection(collName);
        const indexes = await collection.indexes();
        indexes.forEach(idx => {
          console.log(` - Name: ${idx.name}, Keys: ${JSON.stringify(idx.key)}, Unique: ${!!idx.unique}`);
        });
      } catch (err) {
        console.log(` ⚠️ Could not fetch indexes for ${collName}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkIndexes();
