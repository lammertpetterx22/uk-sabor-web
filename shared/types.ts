/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Re-export database types for convenience
export type {
  Event,
  InsertEvent,
  Course,
  InsertCourse,
  Class,
  InsertClass,
  Instructor,
  InsertInstructor,
  EventTicket,
  InsertEventTicket,
  CoursePurchase,
  InsertCoursePurchase,
  ClassPurchase,
  InsertClassPurchase,
  Order,
  InsertOrder,
  InstructorApplication,
  InsertInstructorApplication,
} from "../drizzle/schema";
