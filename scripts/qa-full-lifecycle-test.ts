/**
 * QA Fullstack Test: Complete User Lifecycle Audit
 *
 * This script simulates the complete user journey:
 * 1. Create Teacher account → Create Course, Class, Event
 * 2. Create Promoter account → Create Course, Class, Event
 * 3. Create Student account → Purchase all 6 products
 * 4. Verify balances updated correctly for Teacher and Promoter
 * 5. Test withdrawal request functionality
 * 6. Generate comprehensive audit report
 */

import { getDb } from "../server/db";
import {
  users,
  instructors,
  courses,
  classes,
  events,
  orders,
  coursePurchases,
  classPurchases,
  eventTickets,
  balances,
  ledgerTransactions,
  withdrawalRequests,
  serializeRoles
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { addEarnings, getOrCreateBalance } from "../server/features/financials";

// Test data
const TEACHER_EMAIL = `teacher-qa-${Date.now()}@test.com`;
const PROMOTER_EMAIL = `promoter-qa-${Date.now()}@test.com`;
const STUDENT_EMAIL = `student-qa-${Date.now()}@test.com`;
const TEST_PASSWORD = "TestPass123!";

// Pricing
const COURSE_PRICE = 49.99;
const CLASS_PRICE = 15.00;
const EVENT_PRICE = 25.00;

// Commission rates (starter plan: 15% for events/classes, 30% for courses)
const EVENT_COMMISSION = 0.15;
const CLASS_COMMISSION = 0.15;
const COURSE_COMMISSION = 0.30;

interface TestResults {
  teacherId: number;
  promoterId: number;
  studentId: number;
  teacherInstructorId: number;
  promoterInstructorId: number;
  teacherProducts: {
    courseId: number;
    classId: number;
    eventId: number;
  };
  promoterProducts: {
    courseId: number;
    classId: number;
    eventId: number;
  };
  purchases: {
    teacherCourse: number;
    teacherClass: number;
    teacherEvent: number;
    promoterCourse: number;
    promoterClass: number;
    promoterEvent: number;
  };
  teacherBalance: {
    before: string;
    after: string;
    expected: number;
  };
  promoterBalance: {
    before: string;
    after: string;
    expected: number;
  };
  withdrawalTests: {
    teacherWithdrawal: any;
    promoterWithdrawal: any;
  };
  errors: string[];
  warnings: string[];
}

async function createTestUser(email: string, name: string, role: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const openId = `custom-${Date.now()}-${Math.random()}`;

  const [user] = await db.insert(users).values({
    email,
    name,
    passwordHash: hashedPassword,
    openId,
    loginMethod: "custom",
    role,
    roles: serializeRoles(role === "teacher" || role === "promoter" ? [role] : []),
    subscriptionPlan: "starter",
  }).returning();

  console.log(`✅ Created ${role}: ${name} (${email}) - ID: ${user.id}`);
  return user.id;
}

async function createInstructorProfile(userId: number, name: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [instructor] = await db.insert(instructors).values({
    userId,
    name,
    bio: `QA Test Instructor - ${name}`,
    specialties: JSON.stringify(["Salsa", "Bachata"]),
  }).returning();

  console.log(`✅ Created instructor profile for ${name} - Instructor ID: ${instructor.id}`);
  return instructor.id;
}

async function createCourse(instructorId: number, title: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [course] = await db.insert(courses).values({
    title,
    description: "QA Test Course - Comprehensive dance training",
    instructorId,
    price: COURSE_PRICE.toFixed(2) as any,
    level: "intermediate",
    danceStyle: "Salsa",
    duration: "4 weeks",
    lessonsCount: 8,
    status: "published",
    videoUrl: "https://test.video.url/course-demo.mp4",
    imageUrl: "https://test.image.url/course-cover.jpg",
  }).returning();

  console.log(`✅ Created course: ${title} - Course ID: ${course.id}, Price: £${COURSE_PRICE}`);
  return course.id;
}

async function createClass(instructorId: number, title: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const classDate = new Date();
  classDate.setDate(classDate.getDate() + 7); // Next week

  const [classItem] = await db.insert(classes).values({
    title,
    description: "QA Test Class - Intensive workshop",
    instructorId,
    price: CLASS_PRICE.toFixed(2) as any,
    danceStyle: "Bachata",
    level: "beginner",
    classDate,
    duration: 90,
    maxParticipants: 20,
    currentParticipants: 0,
    status: "published",
    paymentMethod: "online",
  }).returning();

  console.log(`✅ Created class: ${title} - Class ID: ${classItem.id}, Price: £${CLASS_PRICE}`);
  return classItem.id;
}

async function createEvent(creatorId: number, title: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 14); // Two weeks from now

  const [event] = await db.insert(events).values({
    title,
    description: "QA Test Event - Social dance party",
    venue: "QA Test Venue",
    city: "London",
    eventDate,
    ticketPrice: EVENT_PRICE.toFixed(2) as any,
    maxTickets: 100,
    ticketsSold: 0,
    status: "published",
    paymentMethod: "online",
    creatorId,
    imageUrl: "https://test.image.url/event-banner.jpg",
  }).returning();

  console.log(`✅ Created event: ${title} - Event ID: ${event.id}, Price: £${EVENT_PRICE}`);
  return event.id;
}

async function simulatePurchase(
  studentId: number,
  itemType: "course" | "class" | "event",
  itemId: number,
  instructorProfileId: number | null,
  creatorUserId: number | null,
  price: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate earnings (simulating webhook logic)
  let commission: number;
  if (itemType === "course") {
    commission = COURSE_COMMISSION;
  } else {
    commission = itemType === "class" ? CLASS_COMMISSION : EVENT_COMMISSION;
  }

  const platformFee = price * commission;
  const instructorEarnings = price - platformFee;

  // Get the USER ID for courses and classes (must join instructors table)
  let actualUserId: number | null = null;
  if (itemType === "event") {
    actualUserId = creatorUserId;
  } else {
    // For courses and classes, we need to get the userId from the instructor profile
    if (instructorProfileId) {
      const [instructor] = await db.select({ userId: instructors.userId })
        .from(instructors)
        .where(eq(instructors.id, instructorProfileId))
        .limit(1);
      actualUserId = instructor?.userId || null;
    }
  }

  // 1. Create order
  const [order] = await db.insert(orders).values({
    userId: studentId,
    amount: price.toFixed(2) as any,
    currency: "GBP",
    status: "completed",
    itemType,
    itemId,
    stripePaymentIntentId: `pi_qa_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }).returning();

  console.log(`💳 Created order #${order.id} for ${itemType} #${itemId} - £${price.toFixed(2)}`);

  // 2. Create purchase record
  if (itemType === "course") {
    await db.insert(coursePurchases).values({
      userId: studentId,
      courseId: itemId,
      instructorId: actualUserId,
      orderId: order.id,
      pricePaid: price.toFixed(2) as any,
      platformFee: platformFee.toFixed(2) as any,
      instructorEarnings: instructorEarnings.toFixed(2) as any,
      progress: 0,
      completed: false,
    });
  } else if (itemType === "class") {
    await db.insert(classPurchases).values({
      userId: studentId,
      classId: itemId,
      instructorId: actualUserId,
      orderId: order.id,
      pricePaid: price.toFixed(2) as any,
      platformFee: platformFee.toFixed(2) as any,
      instructorEarnings: instructorEarnings.toFixed(2) as any,
      accessCode: `ACCESS-QA-${Date.now()}`,
      status: "active",
    });

    // Update participants count
    await db.update(classes)
      .set({ currentParticipants: 1 })
      .where(eq(classes.id, itemId));
  } else if (itemType === "event") {
    await db.insert(eventTickets).values({
      userId: studentId,
      eventId: itemId,
      instructorId: actualUserId,
      orderId: order.id,
      quantity: 1,
      pricePaid: price.toFixed(2) as any,
      platformFee: platformFee.toFixed(2) as any,
      instructorEarnings: instructorEarnings.toFixed(2) as any,
      ticketCode: `TICKET-QA-${Date.now()}`,
      status: "valid",
    });

    // Update tickets sold
    await db.update(events)
      .set({ ticketsSold: 1 })
      .where(eq(events.id, itemId));
  }

  // 3. Credit instructor earnings (simulating webhook)
  if (actualUserId) {
    await addEarnings({
      userId: actualUserId,
      amount: instructorEarnings,
      description: `Sale: ${itemType} #${itemId} (Order #${order.id})`,
      orderId: order.id,
    });

    console.log(`💰 Credited £${instructorEarnings.toFixed(2)} to user #${actualUserId} (${itemType} sale, commission: ${(commission * 100).toFixed(0)}%)`);
  }

  return order.id;
}

async function testWithdrawalRequest(userId: number, amount: number): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const balance = await getOrCreateBalance(userId);
  const currentBalance = parseFloat(balance.currentBalance as string);

  if (amount > currentBalance) {
    console.log(`⚠️  User #${userId} attempted withdrawal of £${amount.toFixed(2)} but only has £${currentBalance.toFixed(2)}`);
    return null;
  }

  // Deduct from balance
  await db.update(balances)
    .set({
      currentBalance: (currentBalance - amount).toFixed(2) as any,
      updatedAt: new Date(),
    })
    .where(eq(balances.userId, userId));

  // Create withdrawal request
  const [request] = await db.insert(withdrawalRequests).values({
    userId,
    amount: amount.toFixed(2) as any,
    status: "pending",
  }).returning();

  // Add ledger entry
  await db.insert(ledgerTransactions).values({
    userId,
    amount: (-amount).toFixed(2) as any,
    type: "withdrawal",
    description: `Withdrawal request #${request.id}`,
    status: "pending",
  });

  console.log(`💸 User #${userId} requested withdrawal of £${amount.toFixed(2)} - Request ID: ${request.id}`);
  return request;
}

async function runFullLifecycleTest(): Promise<TestResults> {
  const results: TestResults = {
    teacherId: 0,
    promoterId: 0,
    studentId: 0,
    teacherInstructorId: 0,
    promoterInstructorId: 0,
    teacherProducts: { courseId: 0, classId: 0, eventId: 0 },
    promoterProducts: { courseId: 0, classId: 0, eventId: 0 },
    purchases: {
      teacherCourse: 0,
      teacherClass: 0,
      teacherEvent: 0,
      promoterCourse: 0,
      promoterClass: 0,
      promoterEvent: 0,
    },
    teacherBalance: { before: "0.00", after: "0.00", expected: 0 },
    promoterBalance: { before: "0.00", after: "0.00", expected: 0 },
    withdrawalTests: { teacherWithdrawal: null, promoterWithdrawal: null },
    errors: [],
    warnings: [],
  };

  try {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 QA FULL LIFECYCLE TEST - STARTING");
    console.log("=".repeat(80) + "\n");

    // ====================================================================
    // PASO 1: Create Teacher Account & Products
    // ====================================================================
    console.log("\n📋 PASO 1: Creating Teacher Account & Products\n");

    results.teacherId = await createTestUser(TEACHER_EMAIL, "QA Teacher", "teacher");
    results.teacherInstructorId = await createInstructorProfile(results.teacherId, "QA Teacher");

    results.teacherProducts.courseId = await createCourse(results.teacherInstructorId, "Teacher's Salsa Mastery Course");
    results.teacherProducts.classId = await createClass(results.teacherInstructorId, "Teacher's Bachata Bootcamp");
    results.teacherProducts.eventId = await createEvent(results.teacherId, "Teacher's Salsa Social Night");

    // ====================================================================
    // PASO 1: Create Promoter Account & Products
    // ====================================================================
    console.log("\n📋 PASO 1: Creating Promoter Account & Products\n");

    results.promoterId = await createTestUser(PROMOTER_EMAIL, "QA Promoter", "promoter");
    results.promoterInstructorId = await createInstructorProfile(results.promoterId, "QA Promoter");

    results.promoterProducts.courseId = await createCourse(results.promoterInstructorId, "Promoter's Bachata Fundamentals");
    results.promoterProducts.classId = await createClass(results.promoterInstructorId, "Promoter's Salsa Workshop");
    results.promoterProducts.eventId = await createEvent(results.promoterId, "Promoter's Dance Festival");

    // ====================================================================
    // PASO 2: Create Student Account & Purchase All Products
    // ====================================================================
    console.log("\n📋 PASO 2: Creating Student Account & Purchasing All Products\n");

    results.studentId = await createTestUser(STUDENT_EMAIL, "QA Student", "user");

    // Get initial balances
    const teacherBalanceBefore = await getOrCreateBalance(results.teacherId);
    const promoterBalanceBefore = await getOrCreateBalance(results.promoterId);
    results.teacherBalance.before = teacherBalanceBefore.currentBalance as string;
    results.promoterBalance.before = promoterBalanceBefore.currentBalance as string;

    console.log(`\n💰 Initial Balances:`);
    console.log(`   Teacher: £${results.teacherBalance.before}`);
    console.log(`   Promoter: £${results.promoterBalance.before}\n`);

    // Purchase Teacher's products
    console.log("🛒 Purchasing Teacher's Products:\n");
    results.purchases.teacherCourse = await simulatePurchase(
      results.studentId, "course", results.teacherProducts.courseId, results.teacherInstructorId, null, COURSE_PRICE
    );
    results.purchases.teacherClass = await simulatePurchase(
      results.studentId, "class", results.teacherProducts.classId, results.teacherInstructorId, null, CLASS_PRICE
    );
    results.purchases.teacherEvent = await simulatePurchase(
      results.studentId, "event", results.teacherProducts.eventId, null, results.teacherId, EVENT_PRICE
    );

    // Purchase Promoter's products
    console.log("\n🛒 Purchasing Promoter's Products:\n");
    results.purchases.promoterCourse = await simulatePurchase(
      results.studentId, "course", results.promoterProducts.courseId, results.promoterInstructorId, null, COURSE_PRICE
    );
    results.purchases.promoterClass = await simulatePurchase(
      results.studentId, "class", results.promoterProducts.classId, results.promoterInstructorId, null, CLASS_PRICE
    );
    results.purchases.promoterEvent = await simulatePurchase(
      results.studentId, "event", results.promoterProducts.eventId, null, results.promoterId, EVENT_PRICE
    );

    // ====================================================================
    // PASO 3: Verify Balances Updated Correctly
    // ====================================================================
    console.log("\n📋 PASO 3: Verifying Balance Updates\n");

    const teacherBalanceAfter = await getOrCreateBalance(results.teacherId);
    const promoterBalanceAfter = await getOrCreateBalance(results.promoterId);
    results.teacherBalance.after = teacherBalanceAfter.currentBalance as string;
    results.promoterBalance.after = promoterBalanceAfter.currentBalance as string;

    // Calculate expected earnings
    const courseEarnings = COURSE_PRICE * (1 - COURSE_COMMISSION);
    const classEarnings = CLASS_PRICE * (1 - CLASS_COMMISSION);
    const eventEarnings = EVENT_PRICE * (1 - EVENT_COMMISSION);
    const expectedTotal = courseEarnings + classEarnings + eventEarnings;

    results.teacherBalance.expected = expectedTotal;
    results.promoterBalance.expected = expectedTotal;

    console.log(`💰 Final Balances:`);
    console.log(`   Teacher: £${results.teacherBalance.after} (Expected: £${expectedTotal.toFixed(2)})`);
    console.log(`   Promoter: £${results.promoterBalance.after} (Expected: £${expectedTotal.toFixed(2)})\n`);

    // Verify balances
    const teacherActual = parseFloat(results.teacherBalance.after);
    const promoterActual = parseFloat(results.promoterBalance.after);

    if (Math.abs(teacherActual - expectedTotal) > 0.01) {
      results.errors.push(`❌ Teacher balance mismatch: Expected £${expectedTotal.toFixed(2)}, Got £${teacherActual.toFixed(2)}`);
    } else {
      console.log(`✅ Teacher balance correct: £${teacherActual.toFixed(2)}`);
    }

    if (Math.abs(promoterActual - expectedTotal) > 0.01) {
      results.errors.push(`❌ Promoter balance mismatch: Expected £${expectedTotal.toFixed(2)}, Got £${promoterActual.toFixed(2)}`);
    } else {
      console.log(`✅ Promoter balance correct: £${promoterActual.toFixed(2)}`);
    }

    // ====================================================================
    // PASO 4: Test Withdrawal Requests
    // ====================================================================
    console.log("\n📋 PASO 4: Testing Withdrawal Requests\n");

    const withdrawalAmount = 10.00; // Request £10 withdrawal
    results.withdrawalTests.teacherWithdrawal = await testWithdrawalRequest(results.teacherId, withdrawalAmount);
    results.withdrawalTests.promoterWithdrawal = await testWithdrawalRequest(results.promoterId, withdrawalAmount);

    // Verify withdrawal requests created
    if (results.withdrawalTests.teacherWithdrawal) {
      console.log(`✅ Teacher withdrawal request created successfully`);
    } else {
      results.errors.push(`❌ Teacher withdrawal request failed`);
    }

    if (results.withdrawalTests.promoterWithdrawal) {
      console.log(`✅ Promoter withdrawal request created successfully`);
    } else {
      results.errors.push(`❌ Promoter withdrawal request failed`);
    }

    // ====================================================================
    // Verify Student Access
    // ====================================================================
    console.log("\n📋 Verifying Student Access to Purchased Content\n");

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const studentCourses = await db.select()
      .from(coursePurchases)
      .where(eq(coursePurchases.userId, results.studentId));

    const studentClasses = await db.select()
      .from(classPurchases)
      .where(eq(classPurchases.userId, results.studentId));

    const studentTickets = await db.select()
      .from(eventTickets)
      .where(eq(eventTickets.userId, results.studentId));

    console.log(`✅ Student has access to ${studentCourses.length} courses`);
    console.log(`✅ Student has access to ${studentClasses.length} classes`);
    console.log(`✅ Student has ${studentTickets.length} event tickets`);

    if (studentCourses.length !== 2) {
      results.errors.push(`❌ Expected 2 courses, found ${studentCourses.length}`);
    }
    if (studentClasses.length !== 2) {
      results.errors.push(`❌ Expected 2 classes, found ${studentClasses.length}`);
    }
    if (studentTickets.length !== 2) {
      results.errors.push(`❌ Expected 2 tickets, found ${studentTickets.length}`);
    }

  } catch (error: any) {
    results.errors.push(`💥 CRITICAL ERROR: ${error.message}`);
    console.error("\n💥 Test failed with error:", error);
  }

  return results;
}

// ====================================================================
// Generate Audit Report
// ====================================================================
function generateAuditReport(results: TestResults) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 QA AUDIT REPORT - FULL LIFECYCLE TEST");
  console.log("=".repeat(80) + "\n");

  console.log("👥 TEST ACCOUNTS CREATED:");
  console.log(`   Teacher ID: ${results.teacherId} (${TEACHER_EMAIL})`);
  console.log(`   Promoter ID: ${results.promoterId} (${PROMOTER_EMAIL})`);
  console.log(`   Student ID: ${results.studentId} (${STUDENT_EMAIL})\n`);

  console.log("📦 PRODUCTS CREATED:");
  console.log(`   Teacher: Course #${results.teacherProducts.courseId}, Class #${results.teacherProducts.classId}, Event #${results.teacherProducts.eventId}`);
  console.log(`   Promoter: Course #${results.promoterProducts.courseId}, Class #${results.promoterProducts.classId}, Event #${results.promoterProducts.eventId}\n`);

  console.log("💳 PURCHASES COMPLETED:");
  console.log(`   Teacher Products: ${Object.values(results.purchases).slice(0, 3).every(id => id > 0) ? '✅ All purchased' : '❌ Some failed'}`);
  console.log(`   Promoter Products: ${Object.values(results.purchases).slice(3).every(id => id > 0) ? '✅ All purchased' : '❌ Some failed'}\n`);

  console.log("💰 FINANCIAL VERIFICATION:");
  console.log(`   Teacher Balance: £${results.teacherBalance.after} (Expected: £${results.teacherBalance.expected.toFixed(2)}) ${Math.abs(parseFloat(results.teacherBalance.after) - results.teacherBalance.expected) < 0.01 ? '✅' : '❌'}`);
  console.log(`   Promoter Balance: £${results.promoterBalance.after} (Expected: £${results.promoterBalance.expected.toFixed(2)}) ${Math.abs(parseFloat(results.promoterBalance.after) - results.promoterBalance.expected) < 0.01 ? '✅' : '❌'}\n`);

  console.log("💸 WITHDRAWAL TESTS:");
  console.log(`   Teacher Withdrawal: ${results.withdrawalTests.teacherWithdrawal ? `✅ Request #${results.withdrawalTests.teacherWithdrawal.id} (${results.withdrawalTests.teacherWithdrawal.status})` : '❌ Failed'}`);
  console.log(`   Promoter Withdrawal: ${results.withdrawalTests.promoterWithdrawal ? `✅ Request #${results.withdrawalTests.promoterWithdrawal.id} (${results.withdrawalTests.promoterWithdrawal.status})` : '❌ Failed'}\n`);

  if (results.errors.length > 0) {
    console.log("❌ ERRORS FOUND:");
    results.errors.forEach(error => console.log(`   ${error}`));
    console.log("");
  }

  if (results.warnings.length > 0) {
    console.log("⚠️  WARNINGS:");
    results.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log("");
  }

  const allTestsPassed = results.errors.length === 0;
  console.log("=".repeat(80));
  console.log(allTestsPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED");
  console.log("=".repeat(80) + "\n");

  return allTestsPassed;
}

// ====================================================================
// Main Execution
// ====================================================================
async function main() {
  try {
    const results = await runFullLifecycleTest();
    const success = generateAuditReport(results);

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

main();
