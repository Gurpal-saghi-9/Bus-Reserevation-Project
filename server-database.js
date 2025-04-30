const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const app = express();
const PORT = 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Setup middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: 'bus-reservation-system-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Import middleware
const { attachUserData } = require('./middleware/auth');

// Use middleware to attach user data to requests if authenticated
app.use(attachUserData);

// Import API routes
const authRoutes = require('./routes/auth');
const busRoutes = require('./routes/buses');
const bookingRoutes = require('./routes/bookings');

// Register API routes
app.use('/api', authRoutes);
app.use('/api', busRoutes);
app.use('/api', bookingRoutes);

// Database initialization and migration
const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    const setup = require('./migrations/setup');
    await setup.runSetup();
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
};

// Simple placeholder API for bus images
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  
  res.set('Content-Type', 'image/svg+xml');
  res.send(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="busGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#busGradient)" />
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">Premium Bus</text>
    </svg>
  `);
});

// Simple database test route
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'Database connection successful', 
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed', 
      error: error.message 
    });
  }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback route for client-side routing
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'An unexpected error occurred',
    error: err.message
  });
});

// Start server
const startServer = async () => {
  try {
    // Run migrations before starting the server
    await runMigrations();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Bus Reservation System server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();