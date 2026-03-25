#!/usr/bin/env tsx
/**
 * List all courses in the database
 * Run: npx tsx scripts/find-all-courses.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { courses, instructors } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

console.log('\n📚 All Courses in Database\n');
console.log('━'.repeat(70));

async function main() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  try {
    const allCourses = await db.select().from(courses);

    if (allCourses.length === 0) {
      console.log('\n📭 No courses found in database.\n');
      await client.end();
      return;
    }

    console.log(`\nFound ${allCourses.length} course(s):\n`);

    for (const course of allCourses) {
      // Get instructor name
      let instructorName = 'Unknown';
      if (course.instructorId) {
        const instructor = await db
          .select()
          .from(instructors)
          .where(eq(instructors.id, course.instructorId))
          .limit(1);

        if (instructor.length > 0) {
          instructorName = instructor[0].name;
        }
      }

      console.log(`📖 ${course.title}`);
      console.log(`   ├─ ID: ${course.id}`);
      console.log(`   ├─ Instructor: ${instructorName} (ID: ${course.instructorId})`);
      console.log(`   ├─ Price: £${course.price}`);
      console.log(`   ├─ Level: ${course.level}`);
      console.log(`   ├─ Style: ${course.danceStyle || 'N/A'}`);
      console.log(`   ├─ Status: ${course.status}`);
      console.log(`   ├─ Lessons: ${course.lessonsCount || 'N/A'}`);
      console.log(`   ├─ Description: ${course.description?.substring(0, 80) || 'N/A'}...`);
      console.log(`   ├─ Created: ${course.createdAt.toISOString().split('T')[0]}`);
      console.log(`   └─ Updated: ${course.updatedAt.toISOString().split('T')[0]}\n`);
    }

    console.log('━'.repeat(70));
    console.log(`\n📊 Total: ${allCourses.length} course(s)\n`);

    // Flag any that look suspicious
    const suspicious = allCourses.filter(c =>
      c.title.length < 5 || // Very short titles
      /^[a-z]+$/i.test(c.title.replace(/\s/g, '')) && c.title.length < 10 || // Random letters
      !c.description || // No description
      c.description.includes('lorem') ||
      c.description.includes('ipsum')
    );

    if (suspicious.length > 0) {
      console.log(`⚠️  ${suspicious.length} course(s) might be test data:\n`);
      suspicious.forEach(c => {
        console.log(`   • "${c.title}" (ID: ${c.id})`);
      });
      console.log('\nTo delete a course, run:');
      console.log('   npx tsx scripts/delete-course.ts <course_id>\n');
    }

    console.log('━'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
