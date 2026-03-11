import { drizzle } from "drizzle-orm/mysql2";
import { users } from "./drizzle/schema.js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

// Create a simple hash for the password (in production, use bcrypt)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedAdmin() {
  try {
    console.log("🌱 Creating admin user...");
    
    const adminEmail = "petterlammert@gmail.com";
    const adminPassword = "321power";
    const passwordHash = hashPassword(adminPassword);
    
    // Create a unique openId for this admin
    const openId = `admin-${Date.now()}`;
    
    const result = await db.insert(users).values({
      openId: openId,
      name: "Admin",
      email: adminEmail,
      loginMethod: "custom",
      role: "admin",
    });
    
    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔐 Password: ${adminPassword}`);
    console.log(`🆔 OpenID: ${openId}`);
    console.log("\n⚠️  IMPORTANT: Store this password securely!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
