const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:loveyoung52017888@db.vpzmhglfwomgrashheol.supabase.co:5432/postgres';

async function runMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!\n');

    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await client.query(sql);
        console.log(`✓ ${file} completed\n`);
      } catch (err) {
        console.error(`✗ ${file} failed:`, err.message);
        // Continue with other migrations
      }
    }

    // Verify tables
    console.log('\nVerifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nExisting tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Check inventory
    console.log('\nInventory check:');
    const invResult = await client.query('SELECT sku, name, quantity FROM inventory ORDER BY sku LIMIT 15');
    invResult.rows.forEach(row => console.log(`  ${row.sku}: ${row.name} (${row.quantity})`));

  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

runMigrations();
