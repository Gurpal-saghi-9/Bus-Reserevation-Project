const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { pool, db } = require('./db');
const app = express();
const PORT = 5000;

// Import routes
const authRoutes = require('./routes/auth');
const busesRoutes = require('./routes/buses');
const bookingsRoutes = require('./routes/bookings');
const seatsRoutes = require('./routes/seats');
const profileRoutes = require('./routes/profile');
const driversRoutes = require('./routes/drivers');

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: 'bus-reservation-system-secret', // In production, this should be an environment variable
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Legacy file-based data (will be migrated to database)
const dataFilePath = path.join(__dirname, 'data', 'buses.json');

// Ensure data directory exists for backward compatibility
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize data file if it doesn't exist (for backward compatibility)
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({ buses: [] }));
}

// Helper function to read buses data from file (for backward compatibility)
function readBusesData() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading buses data:', error);
        return { buses: [] };
    }
}

// Helper function to write buses data to file (for backward compatibility)
function writeBusesData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing buses data:', error);
        return false;
    }
}

// API Routes
// Legacy API routes (will be migrated to the new routes)
// Get all buses from file (temporary until full migration)
app.get('/api/legacy/buses', (req, res) => {
    const data = readBusesData();
    res.json(data.buses);
});

// New API routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/drivers', driversRoutes);

// Get placeholder images for buses
app.get('/api/placeholder/:width/:height', (req, res) => {
    const { width, height } = req.params;
    // Send SVG placeholder image
    res.set('Content-Type', 'image/svg+xml');
    res.send(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="busGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2563eb" />
                    <stop offset="100%" stop-color="#0f172a" />
                </linearGradient>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3" />
                </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#busGradient)" rx="10" />
            <rect x="10%" y="50%" width="80%" height="30%" fill="#ffffff" opacity="0.1" rx="5" />
            <rect x="5%" y="70%" width="90%" height="15%" fill="#10b981" opacity="0.8" rx="5" filter="url(#shadow)" />
            <circle cx="25%" cy="85%" r="5%" fill="#333" />
            <circle cx="75%" cy="85%" r="5%" fill="#333" />
            <text x="50%" y="40%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">Premium Bus</text>
            <text x="50%" y="65%" font-family="Arial" font-size="16" fill="white" text-anchor="middle">Luxury Travel Experience</text>
        </svg>
    `);
});

// Serve the index.html for client routes (for SPA-like behavior)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback for other client routes
app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
