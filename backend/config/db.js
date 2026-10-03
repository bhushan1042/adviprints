const mongoose = require('mongoose');
const { describeMongoTarget } = require('./env');

const POOL_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
};

let listenersAttached = false;

const attachListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;
  const { connection } = mongoose;
  connection.on('disconnected', () => console.warn('[db] MongoDB disconnected; the driver will retry automatically'));
  connection.on('reconnected', () => console.info('[db] MongoDB reconnected'));
  connection.on('error', (err) => console.error('[db] MongoDB connection error:', err.message));
};

// Single authoritative connection path. Throws on failure; never falls back to another database.
const connectDatabase = async (config) => {
  attachListeners();
  mongoose.set('strictQuery', true);
  const options = { ...POOL_OPTIONS };
  if (config.mongodbDbName) options.dbName = config.mongodbDbName;

  console.info(`[db] Connecting to ${describeMongoTarget(config.mongodbUri)}`);
  await mongoose.connect(config.mongodbUri, options);
  console.info(`[db] Connected (database: ${mongoose.connection.name})`);
  return mongoose.connection;
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
};

const isDatabaseReady = () => mongoose.connection.readyState === 1;

module.exports = { connectDatabase, disconnectDatabase, isDatabaseReady };
