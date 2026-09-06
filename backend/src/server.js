require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initCronJobs } = require('./jobs/expiryNotificationJob');
const User = require('./models/User');
const seedDatabase = require('./seed/seedData');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty (e.g. initial in-memory boot)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Running automated seed...');
      await seedDatabase();
    }

    // Start background cron jobs
    initCronJobs();

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`======================================================`);
      console.log(`Legal Metrology Backend Server running on port ${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
      console.log(`======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
