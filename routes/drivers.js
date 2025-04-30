const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { users, buses, bookings, busSeats } = require('../shared/schema');
const { isAuthenticated, isDriver, isAdmin } = require('../middleware/auth');
const { eq, and } = require('drizzle-orm');

// Get all buses assigned to the driver
router.get('/my-buses', isAuthenticated, isDriver, async (req, res) => {
  try {
    const driverId = req.session.user.id;
    
    const assignedBuses = await db.select().from(buses)
      .where(eq(buses.driverId, driverId));
    
    return res.status(200).json({
      success: true,
      data: assignedBuses
    });
  } catch (error) {
    console.error('Error fetching driver buses:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching assigned buses',
      error: error.message
    });
  }
});

// Get the passenger list for a bus
router.get('/bus/:busId/passengers', isAuthenticated, isDriver, async (req, res) => {
  try {
    const { busId } = req.params;
    const driverId = req.session.user.id;
    
    // Check if the bus is assigned to this driver
    const [bus] = await db.select().from(buses)
      .where(
        and(
          eq(buses.id, busId),
          eq(buses.driverId, driverId)
        )
      );
    
    if (!bus) {
      return res.status(403).json({
        success: false,
        message: 'Bus not found or not assigned to you'
      });
    }
    
    // Get all bookings for this bus with passenger details
    const passengers = await db.select({
      bookingId: bookings.id,
      passengerName: bookings.passengerName,
      passengerPhone: bookings.passengerPhone,
      status: bookings.status,
      bookingDate: bookings.bookingDate,
      seatNumber: busSeats.seatNumber
    })
    .from(bookings)
    .leftJoin(busSeats, eq(bookings.seatId, busSeats.id))
    .where(
      and(
        eq(bookings.busId, busId),
        eq(bookings.status, 'confirmed')
      )
    );
    
    return res.status(200).json({
      success: true,
      data: passengers
    });
  } catch (error) {
    console.error('Error fetching passengers:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching passenger list',
      error: error.message
    });
  }
});

// Update bus status (e.g., mark as departed or arrived)
router.put('/bus/:busId/status', isAuthenticated, isDriver, async (req, res) => {
  try {
    const { busId } = req.params;
    const { status } = req.body;
    const driverId = req.session.user.id;
    
    if (!status || !['scheduled', 'departed', 'arrived', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status required (scheduled, departed, arrived, or cancelled)'
      });
    }
    
    // Check if the bus is assigned to this driver
    const [bus] = await db.select().from(buses)
      .where(
        and(
          eq(buses.id, busId),
          eq(buses.driverId, driverId)
        )
      );
    
    if (!bus) {
      return res.status(403).json({
        success: false,
        message: 'Bus not found or not assigned to you'
      });
    }
    
    // Update bus status
    const [updatedBus] = await db.update(buses)
      .set({ 
        status: status,
        updatedAt: new Date()
      })
      .where(eq(buses.id, busId))
      .returning();
    
    return res.status(200).json({
      success: true,
      message: `Bus status updated to ${status}`,
      data: updatedBus
    });
  } catch (error) {
    console.error('Error updating bus status:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating bus status',
      error: error.message
    });
  }
});

// Get all drivers (admin only)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const drivers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.role, 'driver'));
    
    return res.status(200).json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching drivers',
      error: error.message
    });
  }
});

// Assign a driver to a bus (admin only)
router.put('/assign/:driverId/bus/:busId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { driverId, busId } = req.params;
    
    // Check if driver exists and has driver role
    const [driver] = await db.select().from(users)
      .where(
        and(
          eq(users.id, driverId),
          eq(users.role, 'driver')
        )
      );
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Check if bus exists
    const [bus] = await db.select().from(buses).where(eq(buses.id, busId));
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Assign driver to bus
    const [updatedBus] = await db.update(buses)
      .set({ 
        driverId: parseInt(driverId),
        updatedAt: new Date()
      })
      .where(eq(buses.id, busId))
      .returning();
    
    return res.status(200).json({
      success: true,
      message: 'Driver assigned to bus successfully',
      data: updatedBus
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while assigning driver',
      error: error.message
    });
  }
});

module.exports = router;