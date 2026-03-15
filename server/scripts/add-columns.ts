process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("ALTER TABLE navigation_items ADD COLUMN IF NOT EXISTS css_class VARCHAR(100)");
  console.log("Added css_class to navigation_items");
  await client.query("ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS source_icon TEXT");
  console.log("Added source_icon to testimonials");
} finally {
  client.release();
  await pool.end();
}
