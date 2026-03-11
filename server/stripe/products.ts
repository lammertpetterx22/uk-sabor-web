/**
 * Stripe Products Configuration
 * This file centralizes all product and pricing information for UK Sabor
 * Products are created dynamically based on database items (events, courses, classes)
 */

export const STRIPE_CONFIG = {
  currency: "gbp",
  locale: "en-GB",
};

/**
 * Product metadata keys for tracking purchases
 */
export const PRODUCT_METADATA = {
  ITEM_TYPE: "item_type", // "event", "course", or "class"
  ITEM_ID: "item_id",
  INSTRUCTOR_ID: "instructor_id",
  USER_ID: "user_id",
};

/**
 * Helper function to create Stripe product data from database items
 */
export function createEventProductData(event: {
  id: number;
  title: string;
  description?: string;
  ticketPrice: string;
}) {
  return {
    name: event.title,
    description: event.description || `UK Sabor Event: ${event.title}`,
    metadata: {
      [PRODUCT_METADATA.ITEM_TYPE]: "event",
      [PRODUCT_METADATA.ITEM_ID]: event.id.toString(),
    },
    price: Math.round(parseFloat(event.ticketPrice) * 100), // Convert to cents
  };
}

export function createCourseProductData(course: {
  id: number;
  title: string;
  description?: string;
  price: string;
  instructorId: number;
}) {
  return {
    name: course.title,
    description: course.description || `UK Sabor Course: ${course.title}`,
    metadata: {
      [PRODUCT_METADATA.ITEM_TYPE]: "course",
      [PRODUCT_METADATA.ITEM_ID]: course.id.toString(),
      [PRODUCT_METADATA.INSTRUCTOR_ID]: course.instructorId.toString(),
    },
    price: Math.round(parseFloat(course.price) * 100), // Convert to cents
  };
}

export function createClassProductData(classItem: {
  id: number;
  title: string;
  description?: string;
  price: string;
  instructorId: number;
}) {
  return {
    name: classItem.title,
    description: classItem.description || `UK Sabor Class: ${classItem.title}`,
    metadata: {
      [PRODUCT_METADATA.ITEM_TYPE]: "class",
      [PRODUCT_METADATA.ITEM_ID]: classItem.id.toString(),
      [PRODUCT_METADATA.INSTRUCTOR_ID]: classItem.instructorId.toString(),
    },
    price: Math.round(parseFloat(classItem.price) * 100), // Convert to cents
  };
}
