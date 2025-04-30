const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);
const schema = require('../shared/schema');

// Function to create tables
async function createTables() {
  try {
    console.log('Creating tables if they do not exist...');
    
    // Create the tables based on the schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL DEFAULT 'passenger',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS buses (
        id SERIAL PRIMARY KEY,
        bus_number VARCHAR(50) NOT NULL UNIQUE,
        license_number VARCHAR(50) NOT NULL,
        driver_id INTEGER,
        bus_type VARCHAR(50) NOT NULL,
        total_seats INTEGER NOT NULL DEFAULT 32,
        from_location VARCHAR(100) NOT NULL,
        to_location VARCHAR(100) NOT NULL,
        departure_time VARCHAR(10) NOT NULL,
        arrival_time VARCHAR(10) NOT NULL,
        ticket_price INTEGER NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bus_seats (
        id SERIAL PRIMARY KEY,
        bus_id INTEGER NOT NULL,
        seat_number INTEGER NOT NULL,
        row_number INTEGER NOT NULL,
        column_number INTEGER NOT NULL,
        is_booked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        bus_id INTEGER NOT NULL,
        seat_id INTEGER NOT NULL,
        booking_date TIMESTAMP DEFAULT NOW(),
        passenger_name VARCHAR(255) NOT NULL,
        passenger_phone VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        from_location VARCHAR(100) NOT NULL,
        to_location VARCHAR(100) NOT NULL,
        distance INTEGER,
        popularity_score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}

// Function to create default admin user
async function createDefaultAdmin() {
  try {
    console.log('Checking for admin user...');
    
    const adminQuery = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (adminQuery.rows.length === 0) {
      console.log('Creating default admin user...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Insert admin user
      await pool.query(
        'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'admin@busreservation.com', 'admin']
      );
      
      console.log('Default admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}

// Function to create default driver user
async function createDefaultDriver() {
  try {
    console.log('Checking for driver user...');
    
    const driverQuery = await pool.query('SELECT * FROM users WHERE username = $1', ['driver']);
    
    if (driverQuery.rows.length === 0) {
      console.log('Creating default driver user...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('driver123', salt);
      
      // Insert driver user
      await pool.query(
        'INSERT INTO users (username, password, email, role, full_name, phone) VALUES ($1, $2, $3, $4, $5, $6)',
        ['driver', hashedPassword, 'driver@busreservation.com', 'driver', 'Default Driver', '9876543210']
      );
      
      console.log('Default driver user created successfully');
    } else {
      console.log('Driver user already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating driver user:', error);
    return false;
  }
}

// Run all setup functions
async function runSetup() {
  try {
    const tablesCreated = await createTables();
    
    if (tablesCreated) {
      await createDefaultAdmin();
      await createDefaultDriver();
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error during database setup:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  runSetup();
}

module.exports = {
  createTables,
  createDefaultAdmin,
  createDefaultDriver,
  runSetup
};