import "dotenv/config";
import { getDb } from "../server/db";
import { courses, events, classes } from "../drizzle/schema";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) {
    console.error("No DATABASE_URL found in environment variables");
    process.exit(1);
  }
  
  console.log("Updating Courses...");
  await db.update(courses)
    .set({ description: "Join our comprehensive dance course designed to help you master new routines. Perfect for all skill levels, with step-by-step guidance from professional instructors." })
    .where(sql`description ILIKE '%lorem%' OR description ILIKE '%ipsum%'`);

  console.log("Updating Events...");
  await db.update(events)
    .set({ description: "Experience an unforgettable night of music and social dancing. Meet new people, practice your moves, and enjoy the vibrant atmosphere." })
    .where(sql`description ILIKE '%lorem%' OR description ILIKE '%ipsum%'`);

  console.log("Updating Classes...");
  await db.update(classes)
    .set({ description: "A high-energy live class where we break down combinations and focus on technique. Come ready to sweat and have fun!" })
    .where(sql`description ILIKE '%lorem%' OR description ILIKE '%ipsum%'`);

  console.log("Done updating placeholder text!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
