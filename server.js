const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Data file path
const dataFilePath = path.join(__dirname, 'data', 'buses.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({ buses: [] }));
}

// Helper function to read buses data
function readBusesData() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading buses data:', error);
        return { buses: [] };
    }
}

// Helper function to write buses data
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
// Get all buses
app.get('/api/buses', (req, res) => {
    const data = readBusesData();
    res.json(data.buses);
});

// Add a new bus
app.post('/api/buses', (req, res) => {
    const data = readBusesData();
    const newBus = req.body;
    
    // Check if bus number already exists
    const existingBusIndex = data.buses.findIndex(bus => bus.busn === newBus.busn);
    if (existingBusIndex !== -1) {
        return res.status(400).json({ success: false, message: 'Bus with this number already exists' });
    }
    
    // Add new bus
    data.buses.push(newBus);
    
    // Save data
    if (writeBusesData(data)) {
        res.status(201).json({ success: true, message: 'Bus added successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to add bus' });
    }
});

// Book a seat
app.post('/api/reservations', (req, res) => {
    const { busNumber, seatNumber, passengerName, passengerPhone } = req.body;
    
    // Validate required fields
    if (!busNumber || !seatNumber || !passengerName || !passengerPhone) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const data = readBusesData();
    
    // Find bus
    const busIndex = data.buses.findIndex(bus => bus.busn === busNumber);
    if (busIndex === -1) {
        return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    
    // Calculate row and column from seat number
    const row = Math.floor((seatNumber - 1) / 4);
    const col = (seatNumber - 1) % 4;
    
    // Check if seat is already booked
    if (data.buses[busIndex].seats[row][col] !== 'Empty') {
        return res.status(400).json({ success: false, message: 'Seat already booked' });
    }
    
    // Book seat
    data.buses[busIndex].seats[row][col] = `${passengerName} (${passengerPhone})`;
    
    // Save data
    if (writeBusesData(data)) {
        res.status(200).json({ success: true, message: 'Seat booked successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to book seat' });
    }
});

// Get placeholder images
app.get('/api/placeholder/:width/:height', (req, res) => {
    const { width, height } = req.params;
    // Send SVG placeholder image
    res.set('Content-Type', 'image/svg+xml');
    res.send(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#3a0ca3" />
            <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Bus Image</text>
            <rect x="10%" y="70%" width="80%" height="10%" fill="#4361ee" rx="10" />
            <circle cx="30%" cy="80%" r="5%" fill="#333" />
            <circle cx="70%" cy="80%" r="5%" fill="#333" />
        </svg>
    `);
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
