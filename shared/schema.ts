import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Canteens
export const canteens = pgTable("canteens", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  totalStalls: integer("total_stalls").notNull().default(0),
});

export const insertCanteenSchema = createInsertSchema(canteens).omit({ id: true });
export type InsertCanteen = z.infer<typeof insertCanteenSchema>;
export type Canteen = typeof canteens.$inferSelect;

// Stalls
export const stalls = pgTable("stalls", {
  id: varchar("id").primaryKey(),
  canteenId: varchar("canteen_id").notNull(),
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
  id: varchar("id").primaryKey(),
  vendorId: varchar("vendor_id").notNull(),
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
  id: varchar("id").primaryKey(),
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
  id: varchar("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'stall' or 'vendor'
  entityId: varchar("entity_id").notNull(),
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
