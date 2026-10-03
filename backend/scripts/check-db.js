// Diagnostic: verifies configuration and MongoDB connectivity without printing credentials.
//   npm run check-db
const { getConfig, describeMongoTarget } = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/db');
const mongoose = require('mongoose');

const run = async () => {
  const config = getConfig();
  console.log(`Environment : ${config.nodeEnv}`);
  console.log(`Target      : ${describeMongoTarget(config.mongodbUri)}`);

  await connectDatabase(config);
  await mongoose.connection.db.admin().ping();
  console.log('Ping        : ok');

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    const count = await mongoose.connection.db.collection(name).estimatedDocumentCount();
    console.log(`  ${name.padEnd(24)} ${count} documents`);
  }
  await disconnectDatabase();
};

run().catch(async (err) => {
  console.error(`FAILED: ${err.message}`);
  console.error('Common causes: wrong MONGODB_URI, wrong database user/password, Atlas Network Access list does not include this host (0.0.0.0/0 for Render), cluster paused.');
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
