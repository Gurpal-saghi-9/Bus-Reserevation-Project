const { pgTable, serial, varchar, text, timestamp, json, boolean, integer } = require('drizzle-orm/pg-core');

// Users table
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  role: varchar('role', { length: 20 }).notNull().default('passenger'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Buses table
const buses = pgTable('buses', {
  id: serial('id').primaryKey(),
  busNumber: varchar('bus_number', { length: 50 }).notNull().unique(),
  licenseNumber: varchar('license_number', { length: 50 }).notNull(),
  driverId: integer('driver_id'),
  busType: varchar('bus_type', { length: 50 }).notNull(),
  totalSeats: integer('total_seats').notNull().default(32),
  from: varchar('from_location', { length: 100 }).notNull(),
  to: varchar('to_location', { length: 100 }).notNull(),
  departureTime: varchar('departure_time', { length: 10 }).notNull(),
  arrivalTime: varchar('arrival_time', { length: 10 }).notNull(),
  ticketPrice: integer('ticket_price').notNull(),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Bus Seats table
const busSeats = pgTable('bus_seats', {
  id: serial('id').primaryKey(),
  busId: integer('bus_id').notNull(),
  seatNumber: integer('seat_number').notNull(),
  rowNumber: integer('row_number').notNull(),
  columnNumber: integer('column_number').notNull(),
  isBooked: boolean('is_booked').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Bookings table
const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  busId: integer('bus_id').notNull(),
  seatId: integer('seat_id').notNull(),
  bookingDate: timestamp('booking_date').defaultNow(),
  passengerName: varchar('passenger_name', { length: 255 }).notNull(),
  passengerPhone: varchar('passenger_phone', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('confirmed'),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('pending'),
  paymentAmount: integer('payment_amount').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Routes table (to track history of routes)
const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  from: varchar('from_location', { length: 100 }).notNull(),
  to: varchar('to_location', { length: 100 }).notNull(),
  distance: integer('distance'),
  popularityScore: integer('popularity_score').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

module.exports = {
  users,
  buses,
  busSeats,
  bookings,
  routes
};