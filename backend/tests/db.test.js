const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { connectDatabase, formatDatabaseError } = require('../config/db');

test('connectDatabase passes the configured database name without rewriting the URI', async () => {
  const originalConnect = mongoose.connect;
  const originalOrderInit = Order.init;
  const originalIndexes = Order.collection.indexes;
  const uri = 'mongodb+srv://cluster.example/other?retryWrites=true&w=majority';
  let receivedArgs;
  mongoose.connect = async (...args) => {
    receivedArgs = args;
    return mongoose;
  };
  Order.init = async () => Order;
  Order.collection.indexes = async () => [
    { name: '_id_', key: { _id: 1 } },
    { name: 'checkoutId_1', key: { checkoutId: 1 }, unique: true, sparse: true },
    {
      name: 'qikink_reference_unique_sparse',
      key: { 'qikinkFulfillment.reference': 1 },
      unique: true,
      sparse: true
    }
  ];

  try {
    await connectDatabase({ mongodbUri: uri, mongodbDbName: 'adviprints' });
    assert.equal(receivedArgs[0], uri);
    assert.equal(receivedArgs[1].dbName, 'adviprints');
  } finally {
    mongoose.connect = originalConnect;
    Order.init = originalOrderInit;
    Order.collection.indexes = originalIndexes;
  }
});

test('connectDatabase refuses to start without the unique sparse order indexes', async () => {
  const originalConnect = mongoose.connect;
  const originalOrderInit = Order.init;
  const originalIndexes = Order.collection.indexes;
  mongoose.connect = async () => mongoose;
  Order.init = async () => Order;
  Order.collection.indexes = async () => [{ name: '_id_', key: { _id: 1 } }];

  try {
    await assert.rejects(
      connectDatabase({ mongodbUri: 'mongodb://localhost/test' }),
      /required unique sparse checkoutId or Qikink reference index/
    );
  } finally {
    mongoose.connect = originalConnect;
    Order.init = originalOrderInit;
    Order.collection.indexes = originalIndexes;
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
