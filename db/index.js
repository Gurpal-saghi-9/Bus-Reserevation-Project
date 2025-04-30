const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('../shared/schema');

// Create the database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle instance
const db = drizzle(pool, { schema });

// Query function for direct SQL queries
const query = async (text, params) => {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log('Executed query', { 
      text, 
      duration, 
      rows: result.rowCount 
    });
    
    return result;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
};

module.exports = {
  pool,
  db,
  query
};