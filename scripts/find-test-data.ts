#!/usr/bin/env tsx
/**
 * Script to find suspicious test/dummy data in the database
 * Run: npx tsx scripts/find-test-data.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { like, or, ilike } from 'drizzle-orm';
import { courses, events, classes, users, instructors } from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

console.log('\n🔍 Finding Test/Dummy Data\n');
console.log('━'.repeat(60));

async function main() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  try {
    // Look for suspicious patterns in courses
    console.log('\n📚 Checking COURSES for test data...\n');

    const suspiciousCourses = await db
      .select()
      .from(courses)
      .where(
        or(
          ilike(courses.title, '%test%'),
          ilike(courses.title, '%dddd%'),
          ilike(courses.title, '%asdf%'),
          ilike(courses.title, '%lorem%'),
          ilike(courses.title, '%ipsum%'),
          ilike(courses.description, '%lorem%'),
          ilike(courses.description, '%ipsum%'),
        )
      );

    if (suspiciousCourses.length > 0) {
      console.log(`⚠️  Found ${suspiciousCourses.length} suspicious course(s):\n`);
      suspiciousCourses.forEach((course, i) => {
        console.log(`   ${i + 1}. "${course.title}" (ID: ${course.id})`);
        console.log(`      ├─ Description: ${course.description?.substring(0, 100) || 'N/A'}...`);
        console.log(`      ├─ Instructor ID: ${course.instructorId}`);
        console.log(`      ├─ Price: £${course.price}`);
        console.log(`      ├─ Status: ${course.status}`);
        console.log(`      └─ Created: ${course.createdAt.toISOString().split('T')[0]}\n`);
      });
    } else {
      console.log('✅ No suspicious courses found\n');
    }

    // Look for suspicious patterns in events
    console.log('━'.repeat(60));
    console.log('\n🎉 Checking EVENTS for test data...\n');

    const suspiciousEvents = await db
      .select()
      .from(events)
      .where(
        or(
          ilike(events.title, '%test%'),
          ilike(events.title, '%dddd%'),
          ilike(events.title, '%asdf%'),
          ilike(events.title, '%lorem%'),
        )
      );

    if (suspiciousEvents.length > 0) {
      console.log(`⚠️  Found ${suspiciousEvents.length} suspicious event(s):\n`);
      suspiciousEvents.forEach((event, i) => {
        console.log(`   ${i + 1}. "${event.title}" (ID: ${event.id})`);
        console.log(`      ├─ Venue: ${event.venue}`);
        console.log(`      ├─ Date: ${event.eventDate.toISOString().split('T')[0]}`);
        console.log(`      ├─ Price: £${event.ticketPrice}`);
        console.log(`      ├─ Status: ${event.status}`);
        console.log(`      └─ Creator ID: ${event.creatorId}\n`);
      });
    } else {
      console.log('✅ No suspicious events found\n');
    }

    // Look for suspicious patterns in classes
    console.log('━'.repeat(60));
    console.log('\n💃 Checking CLASSES for test data...\n');

    const suspiciousClasses = await db
      .select()
      .from(classes)
      .where(
        or(
          ilike(classes.title, '%test%'),
          ilike(classes.title, '%dddd%'),
          ilike(classes.title, '%asdf%'),
          ilike(classes.title, '%lorem%'),
        )
      );

    if (suspiciousClasses.length > 0) {
      console.log(`⚠️  Found ${suspiciousClasses.length} suspicious class(es):\n`);
      suspiciousClasses.forEach((cls, i) => {
        console.log(`   ${i + 1}. "${cls.title}" (ID: ${cls.id})`);
        console.log(`      ├─ Date: ${cls.classDate.toISOString().split('T')[0]}`);
        console.log(`      ├─ Price: £${cls.price}`);
        console.log(`      ├─ Status: ${cls.status}`);
        console.log(`      └─ Instructor ID: ${cls.instructorId}\n`);
      });
    } else {
      console.log('✅ No suspicious classes found\n');
    }

    // Look for suspicious patterns in users
    console.log('━'.repeat(60));
    console.log('\n👤 Checking USERS for test data...\n');

    const suspiciousUsers = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.email, '%test%'),
          ilike(users.email, '%asdf%'),
          ilike(users.name, '%test%'),
          ilike(users.name, '%asdf%'),
        )
      );

    if (suspiciousUsers.length > 0) {
      console.log(`⚠️  Found ${suspiciousUsers.length} suspicious user(s):\n`);
      suspiciousUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name || 'Unnamed'} (ID: ${user.id})`);
        console.log(`      ├─ Email: ${user.email || 'N/A'}`);
        console.log(`      ├─ Role: ${user.role}`);
        console.log(`      └─ Created: ${user.createdAt.toISOString().split('T')[0]}\n`);
      });
    } else {
      console.log('✅ No suspicious users found\n');
    }

    // Look for suspicious patterns in instructors
    console.log('━'.repeat(60));
    console.log('\n🎓 Checking INSTRUCTORS for test data...\n');

    const suspiciousInstructors = await db
      .select()
      .from(instructors)
      .where(
        or(
          ilike(instructors.name, '%test%'),
          ilike(instructors.name, '%asdf%'),
          ilike(instructors.name, '%dddd%'),
        )
      );

    if (suspiciousInstructors.length > 0) {
      console.log(`⚠️  Found ${suspiciousInstructors.length} suspicious instructor(s):\n`);
      suspiciousInstructors.forEach((instructor, i) => {
        console.log(`   ${i + 1}. ${instructor.name} (ID: ${instructor.id})`);
        console.log(`      ├─ User ID: ${instructor.userId || 'N/A'}`);
        console.log(`      ├─ Bio: ${instructor.bio?.substring(0, 50) || 'N/A'}...`);
        console.log(`      └─ Created: ${instructor.createdAt.toISOString().split('T')[0]}\n`);
      });
    } else {
      console.log('✅ No suspicious instructors found\n');
    }

    console.log('━'.repeat(60));
    console.log('\n📊 Summary:\n');
    console.log(`   • ${suspiciousCourses.length} suspicious course(s)`);
    console.log(`   • ${suspiciousEvents.length} suspicious event(s)`);
    console.log(`   • ${suspiciousClasses.length} suspicious class(es)`);
    console.log(`   • ${suspiciousUsers.length} suspicious user(s)`);
    console.log(`   • ${suspiciousInstructors.length} suspicious instructor(s)\n`);

    const totalSuspicious =
      suspiciousCourses.length +
      suspiciousEvents.length +
      suspiciousClasses.length +
      suspiciousUsers.length +
      suspiciousInstructors.length;

    if (totalSuspicious > 0) {
      console.log('⚠️  To delete these items, you can:');
      console.log('   1. Use the admin dashboard to delete them manually');
      console.log('   2. Create a custom cleanup script targeting specific IDs');
      console.log('   3. Run SQL queries directly in your database console\n');
    } else {
      console.log('✅ Database looks clean! No obvious test data found.\n');
    }

    console.log('━'.repeat(60) + '\n');

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
