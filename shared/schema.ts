import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Canteens
export const canteens = pgTable("canteens", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  totalStalls: integer("total_stalls").notNull().default(0),
});

export const insertCanteenSchema = createInsertSchema(canteens).omit({ id: true });
export type InsertCanteen = z.infer<typeof insertCanteenSchema>;
export type Canteen = typeof canteens.$inferSelect;

// Stalls
export const stalls = pgTable("stalls", {
  id: varchar("id", { length: 255 }).primaryKey(),
  canteenId: varchar("canteen_id", { length: 255 }).notNull(),
  name: text("name").notNull(),
  cuisineType: text("cuisine_type").notNull(),
  currentQueue: integer("current_queue").notNull().default(0),
  estimatedWaitTime: integer("estimated_wait_time").notNull().default(0), // in minutes
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
});

export const insertStallSchema = createInsertSchema(stalls).omit({ id: true, rating: true, reviewCount: true });
export type InsertStall = z.infer<typeof insertStallSchema>;
export type Stall = typeof stalls.$inferSelect;

// Food Rescue Listings
export const foodListings = pgTable("food_listings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  vendorId: varchar("vendor_id", { length: 255 }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  pickupTimeStart: text("pickup_time_start").notNull(),
  pickupTimeEnd: text("pickup_time_end").notNull(),
  imageUrl: text("image_url").notNull(),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFoodListingSchema = createInsertSchema(foodListings).omit({ 
  id: true, 
  available: true, 
  createdAt: true 
});
export type InsertFoodListing = z.infer<typeof insertFoodListingSchema>;
export type FoodListing = typeof foodListings.$inferSelect;

// Vendors
export const vendors = pgTable("vendors", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // bakery, restaurant, cafe, hawker
  address: text("address").notNull(),
  operatingHours: text("operating_hours").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  imageUrl: text("image_url"),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({ 
  id: true, 
  rating: true, 
  reviewCount: true 
});
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Ratings (for both stalls and vendors)
export const ratings = pgTable("ratings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  entityType: text("entity_type").notNull(), // 'stall' or 'vendor'
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRatingSchema = createInsertSchema(ratings).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

// Users (for authentication and profiles)
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number"),
  currentBlockId: varchar("current_block_id", { length: 255 }), // Current campus location
  isDeliveryPerson: boolean("is_delivery_person").notNull().default(false),
  deliveryAvailable: boolean("delivery_available").notNull().default(false),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  voucherBalance: decimal("voucher_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  totalDeliveries: true,
  voucherBalance: true,
  createdAt: true 
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Food Preferences
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  cuisineTypes: text("cuisine_types").array(), // ['Chinese', 'Western', 'Indian']
  dietaryRestrictions: text("dietary_restrictions").array(), // ['vegetarian', 'halal', 'no-pork']
  spiceLevel: text("spice_level"), // 'none', 'mild', 'medium', 'hot'
  priceRange: text("price_range"), // 'budget', 'moderate', 'premium'
  maxQueueTime: integer("max_queue_time").notNull().default(30), // Max acceptable wait in minutes
  maxWalkingDistance: integer("max_walking_distance").notNull().default(500), // Max distance in meters
  preferLowCost: boolean("prefer_low_cost").notNull().default(false),
  avoidPeakHours: boolean("avoid_peak_hours").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ 
  id: true, 
  updatedAt: true 
});
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Campus Blocks/Buildings
export const campusBlocks = pgTable("campus_blocks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: text("name").notNull(), // 'Block A', 'Engineering Building', 'Library'
  shortName: text("short_name").notNull(), // 'BLK-A', 'ENG', 'LIB'
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  nearestCanteenId: varchar("nearest_canteen_id", { length: 255 }),
});

export const insertCampusBlockSchema = createInsertSchema(campusBlocks).omit({ id: true });
export type InsertCampusBlock = z.infer<typeof insertCampusBlockSchema>;
export type CampusBlock = typeof campusBlocks.$inferSelect;

// Delivery Requests (Orders with delivery)
export const deliveryRequests = pgTable("delivery_requests", {
  id: varchar("id", { length: 255 }).primaryKey(),
  customerId: varchar("customer_id", { length: 255 }).notNull(),
  deliveryPersonId: varchar("delivery_person_id", { length: 255 }),
  stallId: varchar("stall_id", { length: 255 }).notNull(),
  foodItems: text("food_items").notNull(), // JSON string of items
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  isPeakHour: boolean("is_peak_hour").notNull().default(false),
  pickupLocation: text("pickup_location").notNull(), // Canteen/stall location
  deliveryLocation: text("delivery_location").notNull(), // Campus block/building
  deliveryBlockId: varchar("delivery_block_id", { length: 255 }),
  status: text("status").notNull().default("pending"), // pending, accepted, picked_up, delivering, delivered, cancelled
  customerRating: integer("customer_rating"), // 1-5
  customerReview: text("customer_review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  deliveredAt: timestamp("delivered_at"),
});

export const insertDeliveryRequestSchema = createInsertSchema(deliveryRequests).omit({ 
  id: true,
  deliveryPersonId: true,
  status: true,
  customerRating: true,
  customerReview: true,
  createdAt: true,
  acceptedAt: true,
  deliveredAt: true
});
export type InsertDeliveryRequest = z.infer<typeof insertDeliveryRequestSchema>;
export type DeliveryRequest = typeof deliveryRequests.$inferSelect;

// Delivery Earnings (Track earnings per delivery)
export const deliveryEarnings = pgTable("delivery_earnings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  deliveryPersonId: varchar("delivery_person_id", { length: 255 }).notNull(),
  deliveryRequestId: varchar("delivery_request_id", { length: 255 }).notNull(),
  baseEarning: decimal("base_earning", { precision: 10, scale: 2 }).notNull(),
  peakBonus: decimal("peak_bonus", { precision: 10, scale: 2 }).notNull().default("0"),
  totalEarning: decimal("total_earning", { precision: 10, scale: 2 }).notNull(),
  paidOut: boolean("paid_out").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeliveryEarningsSchema = createInsertSchema(deliveryEarnings).omit({ 
  id: true,
  paidOut: true,
  createdAt: true
});
export type InsertDeliveryEarnings = z.infer<typeof insertDeliveryEarningsSchema>;
export type DeliveryEarnings = typeof deliveryEarnings.$inferSelect;

// Vouchers (Reward vouchers for delivery persons)
export const vouchers = pgTable("vouchers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(), // '5 deliveries milestone', 'Top deliverer bonus'
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVoucherSchema = createInsertSchema(vouchers).omit({ 
  id: true,
  used: true,
  usedAt: true,
  createdAt: true
});
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Voucher = typeof vouchers.$inferSelect;
