const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connectDatabase, formatDatabaseError } = require('../config/db');

test('connectDatabase passes the configured database name without rewriting the URI', async () => {
  const originalConnect = mongoose.connect;
  const uri = 'mongodb+srv://cluster.example/other?retryWrites=true&w=majority';
  let receivedArgs;
  mongoose.connect = async (...args) => {
    receivedArgs = args;
    return mongoose;
  };

  try {
    await connectDatabase({ mongodbUri: uri, mongodbDbName: 'adviprints' });
    assert.equal(receivedArgs[0], uri);
    assert.equal(receivedArgs[1].dbName, 'adviprints');
  } finally {
    mongoose.connect = originalConnect;
  }
});

test('database error messages omit driver details that could contain credentials', () => {
  const error = Object.assign(new Error('mongodb://user:password@cluster.example'), {
    name: 'MongoServerSelectionError'
  });

  const message = formatDatabaseError(error);
  assert.match(message, /MongoServerSelectionError/);
  assert.match(message, /MONGODB_URI/);
  assert.doesNotMatch(message, /password|cluster\.example/);
});
