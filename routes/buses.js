const express = require('express');
const router = express.Router();
const { eq, and } = require('drizzle-orm');
const { db } = require('../db');
const { buses, busSeats, users } = require('../shared/schema');
const { isAuth, isAdmin, isDriver, isAdminOrDriver } = require('../middleware/auth');

/**
 * @route GET /api/buses
 * @desc Get all buses
 * @access Public
 */
router.get('/buses', async (req, res) => {
  try {
    const allBuses = await db.select().from(buses);
    
    // Format the response with all necessary information
    const formattedBuses = allBuses.map(bus => {
      return {
        id: bus.id,
        busn: bus.busNumber,
        license: bus.licenseNumber,
        driver: bus.driverId ? bus.driverId : null,
        driverPhone: "",
        arrival: bus.arrivalTime,
        depart: bus.departureTime,
        from: bus.from,
        to: bus.to,
        busType: bus.busType,
        ticketPrice: bus.ticketPrice,
        image: bus.imageUrl,
        seats: Array(8).fill().map(() => Array(4).fill('Empty')), // Default empty seats
        status: "scheduled"
      };
    });
    
    res.status(200).json(formattedBuses);
  } catch (error) {
    console.error('Error getting buses:', error);
    res.status(500).json({ message: 'Server error while retrieving buses' });
  }
});

/**
 * @route GET /api/buses/:id
 * @desc Get a single bus by ID
 * @access Public
 */
router.get('/buses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const busResult = await db.select().from(buses).where(eq(buses.id, id)).limit(1);
    
    if (busResult.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    const bus = busResult[0];
    
    // Get bus seats
    const busSeatsResult = await db.select().from(busSeats).where(eq(busSeats.busId, bus.id));
    
    // Format the seats into a 2D array (8 rows x 4 columns)
    const seatsArray = Array(8).fill().map(() => Array(4).fill('Empty'));
    
    busSeatsResult.forEach(seat => {
      if (seat.isBooked) {
        seatsArray[seat.rowNumber][seat.columnNumber] = 'Booked';
      }
    });
    
    // Get driver information if available
    let driverInfo = null;
    if (bus.driverId) {
      const driverResult = await db.select().from(users).where(eq(users.id, bus.driverId)).limit(1);
      if (driverResult.length > 0) {
        driverInfo = {
          id: driverResult[0].id,
          name: driverResult[0].fullName || driverResult[0].username,
          phone: driverResult[0].phone || 'Not provided'
        };
      }
    }
    
    const formattedBus = {
      id: bus.id,
      busn: bus.busNumber,
      license: bus.licenseNumber,
      driver: driverInfo ? driverInfo.name : 'Not assigned',
      driverPhone: driverInfo ? driverInfo.phone : 'Not available',
      arrival: bus.arrivalTime,
      depart: bus.departureTime,
      from: bus.from,
      to: bus.to,
      busType: bus.busType,
      ticketPrice: bus.ticketPrice,
      image: bus.imageUrl,
      seats: seatsArray,
      driverId: bus.driverId,
      status: "scheduled"
    };
    
    res.status(200).json(formattedBus);
  } catch (error) {
    console.error('Error getting bus:', error);
    res.status(500).json({ message: 'Server error while retrieving bus' });
  }
});

/**
 * @route POST /api/buses
 * @desc Create a new bus
 * @access Private (Admin only)
 */
router.post('/buses', isAdmin, async (req, res) => {
  try {
    const { 
      busn, license, driver, driverPhone, arrival, depart, 
      from, to, busType, ticketPrice, image, seats 
    } = req.body;
    
    // Validate required fields
    if (!busn || !license || !from || !to || !depart || !arrival || !busType || !ticketPrice) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if bus number already exists
    const existingBus = await db.select().from(buses).where(eq(buses.busNumber, busn)).limit(1);
    if (existingBus.length > 0) {
      return res.status(400).json({ message: 'Bus with this number already exists' });
    }
    
    // Find driver if name is provided
    let driverId = null;
    if (driver) {
      const driverResult = await db.select().from(users)
        .where(and(
          eq(users.role, 'driver'),
          eq(users.fullName, driver)
        ))
        .limit(1);
      
      if (driverResult.length > 0) {
        driverId = driverResult[0].id;
      }
    }
    
    // Create the bus
    const newBus = await db.insert(buses).values({
      busNumber: busn,
      licenseNumber: license,
      driverId,
      busType,
      from,
      to,
      departureTime: depart,
      arrivalTime: arrival,
      ticketPrice: parseFloat(ticketPrice),
      imageUrl: image || `/api/placeholder/500/300`,
      totalSeats: 32 // Default to 32 seats (8 rows x 4 columns)
    }).returning();
    
    if (newBus.length === 0) {
      return res.status(500).json({ message: 'Failed to create bus' });
    }
    
    // Create seats for the bus
    const seatPromises = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 4; col++) {
        const seatNumber = row * 4 + col + 1;
        seatPromises.push(
          db.insert(busSeats).values({
            busId: newBus[0].id,
            seatNumber,
            rowNumber: row,
            columnNumber: col,
            isBooked: false
          })
        );
      }
    }
    
    await Promise.all(seatPromises);
    
    // Format the response
    const formattedBus = {
      id: newBus[0].id,
      busn: newBus[0].busNumber,
      license: newBus[0].licenseNumber,
      driver: driver || 'Not assigned',
      driverPhone: driverPhone || 'Not available',
      arrival: newBus[0].arrivalTime,
      depart: newBus[0].departureTime,
      from: newBus[0].from,
      to: newBus[0].to,
      busType: newBus[0].busType,
      ticketPrice: newBus[0].ticketPrice,
      image: newBus[0].imageUrl,
      seats: Array(8).fill().map(() => Array(4).fill('Empty')),
      status: "scheduled"
    };
    
    res.status(201).json(formattedBus);
  } catch (error) {
    console.error('Error creating bus:', error);
    res.status(500).json({ message: 'Server error while creating bus' });
  }
});

/**
 * @route PUT /api/buses/:id
 * @desc Update a bus
 * @access Private (Admin only)
 */
router.put('/buses/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      busn, license, driver, arrival, depart, 
      from, to, busType, ticketPrice, image 
    } = req.body;
    
    // Check if bus exists
    const existingBus = await db.select().from(buses).where(eq(buses.id, id)).limit(1);
    if (existingBus.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    // Find driver if name is provided
    let driverId = existingBus[0].driverId;
    if (driver) {
      const driverResult = await db.select().from(users)
        .where(and(
          eq(users.role, 'driver'),
          eq(users.fullName, driver)
        ))
        .limit(1);
      
      if (driverResult.length > 0) {
        driverId = driverResult[0].id;
      }
    }
    
    // Update the bus
    const updatedBus = await db.update(buses)
      .set({
        busNumber: busn || existingBus[0].busNumber,
        licenseNumber: license || existingBus[0].licenseNumber,
        driverId,
        busType: busType || existingBus[0].busType,
        from: from || existingBus[0].from,
        to: to || existingBus[0].to,
        departureTime: depart || existingBus[0].departureTime,
        arrivalTime: arrival || existingBus[0].arrivalTime,
        ticketPrice: ticketPrice ? parseFloat(ticketPrice) : existingBus[0].ticketPrice,
        imageUrl: image || existingBus[0].imageUrl,
        updatedAt: new Date()
      })
      .where(eq(buses.id, id))
      .returning();
    
    if (updatedBus.length === 0) {
      return res.status(500).json({ message: 'Failed to update bus' });
    }
    
    res.status(200).json(updatedBus[0]);
  } catch (error) {
    console.error('Error updating bus:', error);
    res.status(500).json({ message: 'Server error while updating bus' });
  }
});

/**
 * @route DELETE /api/buses/:id
 * @desc Delete a bus
 * @access Private (Admin only)
 */
router.delete('/buses/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if bus exists
    const existingBus = await db.select().from(buses).where(eq(buses.id, id)).limit(1);
    if (existingBus.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    // Delete related seats first
    await db.delete(busSeats).where(eq(busSeats.busId, id));
    
    // Delete the bus
    await db.delete(buses).where(eq(buses.id, id));
    
    res.status(200).json({ message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).json({ message: 'Server error while deleting bus' });
  }
});

/**
 * @route GET /api/driver/buses
 * @desc Get all buses assigned to the logged in driver
 * @access Private (Driver only)
 */
router.get('/driver/buses', isDriver, async (req, res) => {
  try {
    const driverId = req.session.user.id;
    
    // Get all buses assigned to this driver
    const driverBuses = await db.select().from(buses).where(eq(buses.driverId, driverId));
    
    // Format the response
    const formattedBuses = await Promise.all(driverBuses.map(async (bus) => {
      // Get bus seats
      const busSeatsResult = await db.select().from(busSeats).where(eq(busSeats.busId, bus.id));
      
      // Format the seats into a 2D array (8 rows x 4 columns)
      const seatsArray = Array(8).fill().map(() => Array(4).fill('Empty'));
      
      busSeatsResult.forEach(seat => {
        if (seat.isBooked) {
          seatsArray[seat.rowNumber][seat.columnNumber] = 'Booked';
        }
      });
      
      return {
        id: bus.id,
        busn: bus.busNumber,
        license: bus.licenseNumber,
        driver: req.session.user.fullName || req.session.user.username,
        driverPhone: req.session.user.phone || 'Not provided',
        arrival: bus.arrivalTime,
        depart: bus.departureTime,
        from: bus.from,
        to: bus.to,
        busType: bus.busType,
        ticketPrice: bus.ticketPrice,
        image: bus.imageUrl,
        seats: seatsArray,
        status: "scheduled"
      };
    }));
    
    res.status(200).json(formattedBuses);
  } catch (error) {
    console.error('Error getting driver buses:', error);
    res.status(500).json({ message: 'Server error while retrieving driver buses' });
  }
});

/**
 * @route POST /api/driver/buses/:id/status
 * @desc Update bus status (departed, arrived, cancelled)
 * @access Private (Driver only)
 */
router.post('/driver/buses/:busn/status', isDriver, async (req, res) => {
  try {
    const { busn } = req.params;
    const { status } = req.body;
    const driverId = req.session.user.id;
    
    if (!['departed', 'arrived', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use departed, arrived, or cancelled' });
    }
    
    // Find the bus
    const busResult = await db.select().from(buses)
      .where(and(
        eq(buses.busNumber, busn),
        eq(buses.driverId, driverId)
      ))
      .limit(1);
    
    if (busResult.length === 0) {
      return res.status(404).json({ message: 'Bus not found or not assigned to you' });
    }
    
    // Update bus status - we'll handle this with a status field once we add it to the schema
    // For now, just return success
    res.status(200).json({ message: `Bus marked as ${status} successfully` });
  } catch (error) {
    console.error('Error updating bus status:', error);
    res.status(500).json({ message: 'Server error while updating bus status' });
  }
});

/**
 * @route GET /api/driver/buses/:busn/passengers
 * @desc Get all passengers for a specific bus
 * @access Private (Driver or Admin)
 */
router.get('/driver/buses/:busn/passengers', isAdminOrDriver, async (req, res) => {
  try {
    const { busn } = req.params;
    
    // Get bus ID from bus number
    const busResult = await db.select().from(buses).where(eq(buses.busNumber, busn)).limit(1);
    
    if (busResult.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    const busId = busResult[0].id;
    
    // Get bookings and passenger data
    // For now, return mock data - we'll implement this properly with the bookings table
    const passengers = [
      { name: 'John Doe', seatNumber: 4, phone: '9876543210' },
      { name: 'Jane Smith', seatNumber: 8, phone: '8765432109' },
      { name: 'Bob Johnson', seatNumber: 15, phone: '7654321098' }
    ];
    
    res.status(200).json(passengers);
  } catch (error) {
    console.error('Error getting passengers:', error);
    res.status(500).json({ message: 'Server error while retrieving passengers' });
  }
});

/**
 * @route GET /api/admin/buses
 * @desc Get all buses (admin version with more details)
 * @access Private (Admin only)
 */
router.get('/admin/buses', isAdmin, async (req, res) => {
  try {
    const allBuses = await db.select().from(buses);
    
    // Get driver information for each bus
    const busesWithDrivers = await Promise.all(allBuses.map(async (bus) => {
      let driverInfo = null;
      
      if (bus.driverId) {
        const driverResult = await db.select().from(users).where(eq(users.id, bus.driverId)).limit(1);
        if (driverResult.length > 0) {
          driverInfo = {
            id: driverResult[0].id,
            username: driverResult[0].username,
            fullName: driverResult[0].fullName || driverResult[0].username,
            phone: driverResult[0].phone || 'Not provided'
          };
        }
      }
      
      return {
        ...bus,
        driver: driverInfo ? driverInfo.fullName : 'Not assigned',
        driverInfo
      };
    }));
    
    res.status(200).json(busesWithDrivers);
  } catch (error) {
    console.error('Error getting admin buses:', error);
    res.status(500).json({ message: 'Server error while retrieving admin buses' });
  }
});

/**
 * @route POST /api/admin/assign-driver
 * @desc Assign a driver to a bus
 * @access Private (Admin only)
 */
router.post('/admin/assign-driver', isAdmin, async (req, res) => {
  try {
    const { busId, driverId } = req.body;
    
    if (!busId || !driverId) {
      return res.status(400).json({ message: 'Bus ID and driver ID are required' });
    }
    
    // Check if bus exists
    const busResult = await db.select().from(buses).where(eq(buses.id, busId)).limit(1);
    if (busResult.length === 0) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    // Check if driver exists and has driver role
    const driverResult = await db.select().from(users)
      .where(and(
        eq(users.id, driverId),
        eq(users.role, 'driver')
      ))
      .limit(1);
    
    if (driverResult.length === 0) {
      return res.status(404).json({ message: 'Driver not found or user is not a driver' });
    }
    
    // Update the bus with the new driver
    const updatedBus = await db.update(buses)
      .set({
        driverId,
        updatedAt: new Date()
      })
      .where(eq(buses.id, busId))
      .returning();
    
    res.status(200).json({
      message: 'Driver assigned successfully',
      bus: updatedBus[0],
      driver: {
        id: driverResult[0].id,
        username: driverResult[0].username,
        fullName: driverResult[0].fullName || driverResult[0].username
      }
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ message: 'Server error while assigning driver' });
  }
});

/**
 * @route GET /api/admin/drivers
 * @desc Get all drivers for admin assignment
 * @access Private (Admin only)
 */
router.get('/admin/drivers', isAdmin, async (req, res) => {
  try {
    const drivers = await db.select().from(users).where(eq(users.role, 'driver'));
    
    // Format the response
    const formattedDrivers = drivers.map(driver => ({
      id: driver.id,
      username: driver.username,
      fullName: driver.fullName || driver.username,
      phone: driver.phone || 'Not provided',
      email: driver.email
    }));
    
    res.status(200).json(formattedDrivers);
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({ message: 'Server error while retrieving drivers' });
  }
});

module.exports = router;