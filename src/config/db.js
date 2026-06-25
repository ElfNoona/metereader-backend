const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,             // Maintain up to 10 socket connections concurrently
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of freezing execution
      socketTimeoutMS: 45000,      // Close inactive sockets after 45s
    });
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Failure: ${error.message}`);
    process.exit(1); // Force termination if configuration fails on startup
  }
};

module.exports = connectDB;