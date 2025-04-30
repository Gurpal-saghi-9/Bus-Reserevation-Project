const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { busSeats, buses } = require('../shared/schema');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { eq, and } = require('drizzle-orm');

// Get all seats for a specific bus
router.get('/bus/:busId', async (req, res) => {
  try {
    const { busId } = req.params;
    
    // Check if bus exists
    const [bus] = await db.select().from(buses).where(eq(buses.id, busId));
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Get all seats for the bus
    const seats = await db.select().from(busSeats).where(eq(busSeats.busId, busId));
    
    return res.status(200).json({
      success: true,
      data: seats
    });
  } catch (error) {
    console.error('Error fetching seats:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching seats',
      error: error.message
    });
  }
});

// Initialize seats for a bus (Admin only)
router.post('/init/:busId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { busId } = req.params;
    
    // Check if bus exists
    const [bus] = await db.select().from(buses).where(eq(buses.id, busId));
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Check if seats already exist for this bus
    const existingSeats = await db.select().from(busSeats).where(eq(busSeats.busId, busId));
    
    if (existingSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Seats already initialized for this bus'
      });
    }
    
    // Initialize seats based on totalSeats (default layout: 4 seats per row)
    const totalSeats = bus.totalSeats || 32;
    const seatsPerRow = 4;
    const rows = Math.ceil(totalSeats / seatsPerRow);
    
    const seatValues = [];
    let seatNumber = 1;
    
    for (let rowNumber = 1; rowNumber <= rows; rowNumber++) {
      for (let columnNumber = 1; columnNumber <= seatsPerRow; columnNumber++) {
        // Skip if we've reached the total number of seats
        if (seatNumber > totalSeats) break;
        
        seatValues.push({
          busId: parseInt(busId),
          seatNumber,
          rowNumber,
          columnNumber,
          isBooked: false
        });
        
        seatNumber++;
      }
    }
    
    // Insert all seats in bulk
    const newSeats = await db.insert(busSeats).values(seatValues).returning();
    
    return res.status(201).json({
      success: true,
      message: `${newSeats.length} seats initialized successfully`,
      data: newSeats
    });
  } catch (error) {
    console.error('Error initializing seats:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while initializing seats',
      error: error.message
    });
  }
});

// Update seat status (Admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBooked } = req.body;
    
    // Check if seat exists
    const [seat] = await db.select().from(busSeats).where(eq(busSeats.id, id));
    
    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found'
      });
    }
    
    // Update seat
    const [updatedSeat] = await db.update(busSeats)
      .set({ 
        isBooked: isBooked === true || isBooked === 'true',
        updatedAt: new Date()
      })
      .where(eq(busSeats.id, id))
      .returning();
    
    return res.status(200).json({
      success: true,
      message: 'Seat status updated successfully',
      data: updatedSeat
    });
  } catch (error) {
    console.error('Error updating seat:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating seat',
      error: error.message
    });
  }
});

module.exports = router;