/**
 * Seed script to add instructors to the database
 * Run with: node seed-instructors.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { instructors } from "./drizzle/schema";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

const instructorData = [
  {
    name: "Sara Bartos",
    bio: "Sara is a passionate Latin dance instructor with over 15 years of experience in Salsa, Bachata, and Merengue. She specializes in teaching beginners and has a gift for making dance accessible to everyone. Her energetic teaching style and infectious enthusiasm inspire students to fall in love with Latin dance.",
    photoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sara-bartos_instructor.jpg",
    instagramHandle: "sarabartosss",
    specialties: JSON.stringify(["Salsa", "Bachata", "Merengue", "Beginner Friendly"]),
  },
  {
    name: "Lammert",
    bio: "Lammert is an advanced Latin dance instructor known for his technical expertise and smooth style. With a background in competitive ballroom and Latin dance, he brings precision and elegance to every class. Lammert excels at teaching intermediate and advanced dancers who want to refine their technique.",
    photoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/lammert-instructor.jpg",
    instagramHandle: "lammert_22",
    specialties: JSON.stringify(["Salsa", "Tango", "Waltz", "Advanced Technique"]),
  },
  {
    name: "Yersin Rivas",
    bio: "Yersin Rivas is a dynamic and charismatic instructor specializing in Salsa and Rueda de Casino. With years of experience performing and teaching across Europe, Yersin brings authentic Cuban flair to his classes. He's passionate about teaching the cultural roots of Latin dance and creating an inclusive dance community.",
    photoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/yersin-rivas_instructor.jpg",
    instagramHandle: "yersinrivas",
    specialties: JSON.stringify(["Salsa", "Rueda de Casino", "Cuban Style", "Group Dancing"]),
  },
  {
    name: "Chan2thepi",
    bio: "Chan2thepi is a versatile instructor with expertise in multiple Latin dance styles including Salsa, Bachata, and Contemporary Latin. Known for her creative choreography and engaging teaching methods, she helps students express themselves through movement. Chan2thepi believes dance is a celebration of culture and joy.",
    photoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/chan2thepi_instructor.jpg",
    instagramHandle: "chan2thepi",
    specialties: JSON.stringify(["Salsa", "Bachata", "Contemporary Latin", "Choreography"]),
  },
];

async function seedInstructors() {
  try {
    console.log("🌱 Starting to seed instructors...");

    for (const instructor of instructorData) {
      const result = await db.insert(instructors).values(instructor);
      console.log(`✅ Added instructor: ${instructor.name}`);
    }

    console.log("🎉 All instructors seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding instructors:", error);
    process.exit(1);
  }
}

seedInstructors();
