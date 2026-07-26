const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bhidu';

const connectDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB Connected Successfully to database: bhidu');
    return mongoose;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️ Continuing without database - orders may not be saved!');
    throw err;
  }
};

module.exports = { connectDatabase };
