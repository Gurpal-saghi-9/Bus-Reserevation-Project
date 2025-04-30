const express = require('express');
const router = express.Router();
const { eq, and } = require('drizzle-orm');
const { db } = require('../db');
const { bookings, buses, busSeats, users } = require('../shared/schema');
const { isAuth, isAdmin } = require('../middleware/auth');

/**
 * @route POST /api/reservations
 * @desc Book a seat on a bus
 * @access Private (Authenticated users only)
 */
router.post('/reservations', isAuth, async (req, res) => {
  try {
    const { busNumber, seatNumber, passengerName, passengerPhone } = req.body;
    const userId = req.session.user.id;
    
    // Validate required fields
    if (!busNumber || !seatNumber || !passengerName || !passengerPhone) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Get bus by number
    const busResult = await db.select().from(buses).where(eq(buses.busNumber, busNumber)).limit(1);
    
    if (busResult.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    const bus = busResult[0];
    
    // Find the specific seat
    const seatResult = await db.select().from(busSeats)
      .where(and(
        eq(busSeats.busId, bus.id),
        eq(busSeats.seatNumber, seatNumber)
      ))
      .limit(1);
    
    if (seatResult.length === 0) {
      return res.status(404).json({ message: 'Seat not found' });
    }
    
    const seat = seatResult[0];
    
    // Check if seat is already booked
    if (seat.isBooked) {
      return res.status(400).json({ message: 'This seat is already booked' });
    }
    
    // Create booking
    const newBooking = await db.insert(bookings).values({
      userId,
      busId: bus.id,
      seatId: seat.id,
      passengerName,
      passengerPhone,
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentAmount: bus.ticketPrice
    }).returning();
    
    if (newBooking.length === 0) {
      return res.status(500).json({ message: 'Failed to create booking' });
    }
    
    // Mark seat as booked
    await db.update(busSeats)
      .set({
        isBooked: true,
        updatedAt: new Date()
      })
      .where(eq(busSeats.id, seat.id));
    
    // Format and return the response
    const booking = {
      id: newBooking[0].id,
      userId,
      busId: bus.id,
      seatNumber,
      passengerName,
      passengerPhone,
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentAmount: bus.ticketPrice,
      createdAt: newBooking[0].createdAt
    };
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
});

/**
 * @route GET /api/bookings/user
 * @desc Get all bookings for the logged in user
 * @access Private (Authenticated users only)
 */
router.get('/bookings/user', isAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get all bookings for this user
    const userBookings = await db.select().from(bookings).where(eq(bookings.userId, userId));
    
    // Format the response
    const formattedBookings = await Promise.all(userBookings.map(async (booking) => {
      const busResult = await db.select().from(buses).where(eq(buses.id, booking.busId)).limit(1);
      
      if (busResult.length === 0) {
        return null; // Skip booking if bus doesn't exist
      }
      
      const bus = busResult[0];
      
      const seatResult = await db.select().from(busSeats).where(eq(busSeats.id, booking.seatId)).limit(1);
      const seat = seatResult.length > 0 ? seatResult[0] : null;
      
      return {
        id: booking.id,
        seatNumber: seat ? seat.seatNumber : 'Unknown',
        passengerName: booking.passengerName,
        passengerPhone: booking.passengerPhone,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentAmount: booking.paymentAmount,
        createdAt: booking.createdAt,
        bus: {
          id: bus.id,
          busn: bus.busNumber,
          from: bus.from,
          to: bus.to,
          depart: bus.departureTime,
          arrival: bus.arrivalTime,
          busType: bus.busType
        }
      };
    }));
    
    // Filter out null values (bookings with missing buses)
    const validBookings = formattedBookings.filter(booking => booking !== null);
    
    res.status(200).json(validBookings);
  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({ message: 'Server error while retrieving bookings' });
  }
});

/**
 * @route POST /api/bookings/:id/cancel
 * @desc Cancel a booking
 * @access Private (Authenticated users only)
 */
router.post('/bookings/:id/cancel', isAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    // Find the booking
    const bookingResult = await db.select().from(bookings)
      .where(and(
        eq(bookings.id, id),
        eq(bookings.userId, userId)
      ))
      .limit(1);
    
    if (bookingResult.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not owned by you' });
    }
    
    const booking = bookingResult[0];
    
    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    
    // Update booking status
    await db.update(bookings)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id));
    
    // Free up the seat
    await db.update(busSeats)
      .set({
        isBooked: false,
        updatedAt: new Date()
      })
      .where(eq(busSeats.id, booking.seatId));
    
    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
});

/**
 * @route GET /api/admin/bookings
 * @desc Get all bookings (admin view)
 * @access Private (Admin only)
 */
router.get('/admin/bookings', isAdmin, async (req, res) => {
  try {
    // Get all bookings
    const allBookings = await db.select().from(bookings);
    
    // Format the response
    const formattedBookings = await Promise.all(allBookings.map(async (booking) => {
      const busResult = await db.select().from(buses).where(eq(buses.id, booking.busId)).limit(1);
      const bus = busResult.length > 0 ? busResult[0] : null;
      
      const userResult = await db.select().from(users).where(eq(users.id, booking.userId)).limit(1);
      const user = userResult.length > 0 ? userResult[0] : null;
      
      const seatResult = await db.select().from(busSeats).where(eq(busSeats.id, booking.seatId)).limit(1);
      const seat = seatResult.length > 0 ? seatResult[0] : null;
      
      return {
        id: booking.id,
        seatNumber: seat ? seat.seatNumber : 'Unknown',
        passengerName: booking.passengerName,
        passengerPhone: booking.passengerPhone,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentAmount: booking.paymentAmount,
        createdAt: booking.createdAt,
        bus: bus ? {
          id: bus.id,
          busn: bus.busNumber,
          from: bus.from,
          to: bus.to
        } : 'Unknown',
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email
        } : 'Unknown'
      };
    }));
    
    res.status(200).json(formattedBookings);
  } catch (error) {
    console.error('Error getting all bookings:', error);
    res.status(500).json({ message: 'Server error while retrieving bookings' });
  }
});

module.exports = router;