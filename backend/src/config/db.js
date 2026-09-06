const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      console.log('No MONGODB_URI found in environment. Starting MongoMemoryServer for instant local evaluation...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log(`In-memory MongoDB initialized at: ${uri}`);
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // If Atlas connection fails (e.g. bad credentials/network in offline mode), fallback to in-memory
    if (!mongod) {
      try {
        console.log('Attempting fallback to in-memory MongoDB...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        const fallbackUri = mongod.getUri();
        const fallbackConn = await mongoose.connect(fallbackUri);
        console.log(`Fallback In-Memory MongoDB Connected at: ${fallbackUri}`);
        return fallbackConn;
      } catch (memErr) {
        console.error(`Fallback failed: ${memErr.message}`);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
