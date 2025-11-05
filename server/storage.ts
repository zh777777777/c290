import { 
  type Canteen, type InsertCanteen,
  type Stall, type InsertStall,
  type FoodListing, type InsertFoodListing,
  type Vendor, type InsertVendor,
  type Rating, type InsertRating,
  canteens, stalls, foodListings, vendors, ratings
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, sql } from "drizzle-orm";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure WebSocket for Neon in Node.js environment
neonConfig.webSocketConstructor = ws;

export interface IStorage {
  // Canteens
  getAllCanteens(): Promise<Canteen[]>;
  getCanteen(id: string): Promise<Canteen | undefined>;
  createCanteen(canteen: InsertCanteen): Promise<Canteen>;
  deleteCanteen(id: string): Promise<void>;
  
  // Stalls
  getAllStalls(): Promise<Stall[]>;
  getStallsByCanteen(canteenId: string): Promise<Stall[]>;
  getStall(id: string): Promise<Stall | undefined>;
  createStall(stall: InsertStall): Promise<Stall>;
  updateStallQueue(id: string, queueNumber: number, waitTime: number): Promise<Stall | undefined>;
  deleteStall(id: string): Promise<void>;
  
  // Food Listings
  getAllFoodListings(availableOnly?: boolean): Promise<FoodListing[]>;
  getFoodListing(id: string): Promise<FoodListing | undefined>;
  getFoodListingsByVendor(vendorId: string): Promise<FoodListing[]>;
  createFoodListing(listing: InsertFoodListing): Promise<FoodListing>;
  updateFoodListingAvailability(id: string, available: boolean): Promise<FoodListing | undefined>;
  deleteFoodListing(id: string): Promise<void>;
  
  // Vendors
  getAllVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;
  
  // Ratings
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByEntity(entityType: string, entityId: string): Promise<Rating[]>;
  updateEntityRating(entityType: string, entityId: string): Promise<void>;
  getAllRatings(): Promise<Rating[]>;
}

export class MemStorage implements IStorage {
  private canteens: Map<string, Canteen>;
  private stalls: Map<string, Stall>;
  private foodListings: Map<string, FoodListing>;
  private vendors: Map<string, Vendor>;
  private ratings: Map<string, Rating>;

  constructor() {
    this.canteens = new Map();
    this.stalls = new Map();
    this.foodListings = new Map();
    this.vendors = new Map();
    this.ratings = new Map();
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed 5 canteens
    const canteenNames = ["North Canteen", "South Canteen", "East Canteen", "West Canteen", "Central Canteen"];
    const canteenLocations = ["Block A", "Block B", "Block C", "Block D", "Block E"];
    
    canteenNames.forEach((name, index) => {
      const id = `canteen-${index + 1}`;
      this.canteens.set(id, {
        id,
        name,
        location: canteenLocations[index],
        totalStalls: 0,
      });
    });

    // Seed stalls for each canteen
    const cuisines = ["Chinese", "Malay", "Indian", "Western", "Japanese", "Korean", "Thai", "Vietnamese"];
    const stallNames = [
      "Wok & Roll", "Nasi Lemak Paradise", "Curry House", "Grill Master",
      "Sushi Station", "K-Food Corner", "Thai Delights", "Pho Heaven",
      "Chicken Rice Express", "Mee Goreng", "Roti Prata", "Fish & Chips",
      "Bento Box", "Bibimbap Bowl", "Tom Yum", "Spring Rolls"
    ];

    let stallIndex = 0;
    this.canteens.forEach((canteen) => {
      const numStalls = Math.floor(Math.random() * 3) + 3; // 3-5 stalls per canteen
      for (let i = 0; i < numStalls; i++) {
        const id = `stall-${stallIndex + 1}`;
        const queue = Math.floor(Math.random() * 20); // 0-19 people
        const waitTime = Math.ceil(queue * 2.5); // ~2.5 min per person
        
        this.stalls.set(id, {
          id,
          canteenId: canteen.id,
          name: stallNames[stallIndex % stallNames.length],
          cuisineType: cuisines[stallIndex % cuisines.length],
          currentQueue: queue,
          estimatedWaitTime: waitTime,
          rating: (Math.random() * 1.5 + 3.5).toFixed(2), // 3.5-5.0
          reviewCount: Math.floor(Math.random() * 200) + 50,
        });
        stallIndex++;
      }
      canteen.totalStalls = numStalls;
    });

    // Seed vendors
    const vendorData = [
      { name: "Sunrise Bakery", type: "bakery", address: "123 Orchard Road", operatingHours: "6:00 AM - 8:00 PM" },
      { name: "Golden Wok Restaurant", type: "restaurant", address: "456 Chinatown Street", operatingHours: "11:00 AM - 10:00 PM" },
      { name: "Kopi & Toast Cafe", type: "cafe", address: "789 Marina Bay", operatingHours: "7:00 AM - 6:00 PM" },
      { name: "Hawker's Delight", type: "hawker", address: "101 East Coast Road", operatingHours: "10:00 AM - 9:00 PM" },
      { name: "French Patisserie", type: "bakery", address: "234 Somerset Road", operatingHours: "8:00 AM - 7:00 PM" },
    ];

    vendorData.forEach((data, index) => {
      const id = `vendor-${index + 1}`;
      this.vendors.set(id, {
        id,
        name: data.name,
        type: data.type,
        address: data.address,
        operatingHours: data.operatingHours,
        rating: (Math.random() * 1 + 4).toFixed(2), // 4.0-5.0
        reviewCount: Math.floor(Math.random() * 150) + 30,
        imageUrl: null,
      });
    });

    // Seed food listings
    const foodItems = [
      { title: "Assorted Bread & Pastries", desc: "Fresh croissants, baguettes, and danish pastries", img: "Bakery_bread_and_pastries_491a3fb4.png", original: 25, discounted: 12 },
      { title: "Nasi Lemak Set", desc: "Fragrant coconut rice with chicken, sambal, and sides", img: "Nasi_lemak_food_item_ff62eaaa.png", original: 8, discounted: 4 },
      { title: "Dim Sum Platter", desc: "Assorted steamed dim sum - har gow, siu mai, bao", img: "Dim_sum_selection_52cbe93d.png", original: 18, discounted: 9 },
      { title: "Fresh Salad Bowl", desc: "Mixed greens with seasonal vegetables and dressing", img: "Fresh_salad_bowl_933a387a.png", original: 12, discounted: 6 },
      { title: "Chicken Rice", desc: "Tender sliced chicken with fragrant rice and chili sauce", img: "Chicken_rice_dish_87e4f1a2.png", original: 6, discounted: 3 },
    ];

    foodItems.forEach((item, index) => {
      const id = `listing-${index + 1}`;
      const vendorId = `vendor-${(index % vendorData.length) + 1}`;
      
      this.foodListings.set(id, {
        id,
        vendorId,
        title: item.title,
        description: item.desc,
        originalPrice: item.original.toFixed(2),
        discountedPrice: item.discounted.toFixed(2),
        quantity: Math.floor(Math.random() * 10) + 5,
        pickupTimeStart: "17:00",
        pickupTimeEnd: "19:30",
        imageUrl: item.img,
        available: true,
        createdAt: new Date(),
      });
    });
  }

  // Canteens
  async getAllCanteens(): Promise<Canteen[]> {
    return Array.from(this.canteens.values());
  }

  async getCanteen(id: string): Promise<Canteen | undefined> {
    return this.canteens.get(id);
  }

  async createCanteen(insertCanteen: InsertCanteen): Promise<Canteen> {
    const id = randomUUID();
    const canteen: Canteen = { ...insertCanteen, id, totalStalls: 0 };
    this.canteens.set(id, canteen);
    return canteen;
  }

  // Stalls
  async getAllStalls(): Promise<Stall[]> {
    return Array.from(this.stalls.values());
  }

  async getStallsByCanteen(canteenId: string): Promise<Stall[]> {
    return Array.from(this.stalls.values()).filter(s => s.canteenId === canteenId);
  }

  async getStall(id: string): Promise<Stall | undefined> {
    return this.stalls.get(id);
  }

  async createStall(insertStall: InsertStall): Promise<Stall> {
    const id = randomUUID();
    const stall: Stall = { 
      id,
      canteenId: insertStall.canteenId,
      name: insertStall.name,
      cuisineType: insertStall.cuisineType,
      currentQueue: insertStall.currentQueue ?? 0,
      estimatedWaitTime: insertStall.estimatedWaitTime ?? 0,
      rating: "0",
      reviewCount: 0 
    };
    this.stalls.set(id, stall);
    
    // Update canteen stall count
    const canteen = this.canteens.get(insertStall.canteenId);
    if (canteen) {
      canteen.totalStalls++;
    }
    
    return stall;
  }

  async updateStallQueue(id: string, queueNumber: number, waitTime: number): Promise<Stall | undefined> {
    const stall = this.stalls.get(id);
    if (stall) {
      stall.currentQueue = queueNumber;
      stall.estimatedWaitTime = waitTime;
    }
    return stall;
  }

  // Food Listings
  async getAllFoodListings(availableOnly: boolean = false): Promise<FoodListing[]> {
    const listings = Array.from(this.foodListings.values());
    return availableOnly ? listings.filter(l => l.available) : listings;
  }

  async getFoodListing(id: string): Promise<FoodListing | undefined> {
    return this.foodListings.get(id);
  }

  async getFoodListingsByVendor(vendorId: string): Promise<FoodListing[]> {
    return Array.from(this.foodListings.values()).filter(l => l.vendorId === vendorId);
  }

  async createFoodListing(insertListing: InsertFoodListing): Promise<FoodListing> {
    const id = randomUUID();
    const listing: FoodListing = {
      ...insertListing,
      id,
      available: true,
      createdAt: new Date(),
    };
    this.foodListings.set(id, listing);
    return listing;
  }

  async updateFoodListingAvailability(id: string, available: boolean): Promise<FoodListing | undefined> {
    const listing = this.foodListings.get(id);
    if (listing) {
      listing.available = available;
    }
    return listing;
  }

  // Vendors
  async getAllVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const id = randomUUID();
    const vendor: Vendor = {
      id,
      name: insertVendor.name,
      type: insertVendor.type,
      address: insertVendor.address,
      operatingHours: insertVendor.operatingHours,
      rating: "0",
      reviewCount: 0,
      imageUrl: insertVendor.imageUrl || null,
    };
    this.vendors.set(id, vendor);
    return vendor;
  }

  // Ratings
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = randomUUID();
    const rating: Rating = {
      id,
      entityType: insertRating.entityType,
      entityId: insertRating.entityId,
      rating: insertRating.rating,
      review: insertRating.review || null,
      createdAt: new Date(),
    };
    this.ratings.set(id, rating);
    
    // Update entity rating
    await this.updateEntityRating(insertRating.entityType, insertRating.entityId);
    
    return rating;
  }

  async getRatingsByEntity(entityType: string, entityId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values())
      .filter(r => r.entityType === entityType && r.entityId === entityId);
  }

  async getAllRatings(): Promise<Rating[]> {
    return Array.from(this.ratings.values());
  }

  async updateEntityRating(entityType: string, entityId: string): Promise<void> {
    const entityRatings = await this.getRatingsByEntity(entityType, entityId);
    if (entityRatings.length === 0) return;

    const avgRating = entityRatings.reduce((sum, r) => sum + r.rating, 0) / entityRatings.length;
    
    if (entityType === 'stall') {
      const stall = this.stalls.get(entityId);
      if (stall) {
        stall.rating = avgRating.toFixed(2);
        stall.reviewCount = entityRatings.length;
      }
    } else if (entityType === 'vendor') {
      const vendor = this.vendors.get(entityId);
      if (vendor) {
        vendor.rating = avgRating.toFixed(2);
        vendor.reviewCount = entityRatings.length;
      }
    }
  }

  // Delete methods
  async deleteCanteen(id: string): Promise<void> {
    // Delete all stalls in this canteen first
    const stallsToDelete = Array.from(this.stalls.values()).filter(s => s.canteenId === id);
    stallsToDelete.forEach(s => this.stalls.delete(s.id));
    this.canteens.delete(id);
  }

  async deleteStall(id: string): Promise<void> {
    const stall = this.stalls.get(id);
    if (stall) {
      this.stalls.delete(id);
      const canteen = this.canteens.get(stall.canteenId);
      if (canteen) {
        canteen.totalStalls--;
      }
    }
  }

  async deleteVendor(id: string): Promise<void> {
    // Delete all food listings for this vendor first
    const listingsToDelete = Array.from(this.foodListings.values()).filter(l => l.vendorId === id);
    listingsToDelete.forEach(l => this.foodListings.delete(l.id));
    this.vendors.delete(id);
  }

  async deleteFoodListing(id: string): Promise<void> {
    this.foodListings.delete(id);
  }
}

// Database Storage using PostgreSQL + Drizzle ORM
export class DbStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  // Canteens
  async getAllCanteens(): Promise<Canteen[]> {
    return await this.db.select().from(canteens);
  }

  async getCanteen(id: string): Promise<Canteen | undefined> {
    const results = await this.db.select().from(canteens).where(eq(canteens.id, id));
    return results[0];
  }

  async createCanteen(insertCanteen: InsertCanteen): Promise<Canteen> {
    const id = randomUUID();
    const results = await this.db.insert(canteens).values({ ...insertCanteen, id, totalStalls: 0 }).returning();
    return results[0];
  }

  // Stalls
  async getAllStalls(): Promise<Stall[]> {
    return await this.db.select().from(stalls);
  }

  async getStallsByCanteen(canteenId: string): Promise<Stall[]> {
    return await this.db.select().from(stalls).where(eq(stalls.canteenId, canteenId));
  }

  async getStall(id: string): Promise<Stall | undefined> {
    const results = await this.db.select().from(stalls).where(eq(stalls.id, id));
    return results[0];
  }

  async createStall(insertStall: InsertStall): Promise<Stall> {
    const id = randomUUID();
    const results = await this.db.insert(stalls).values({ 
      ...insertStall, 
      id,
      rating: "0",
      reviewCount: 0 
    }).returning();
    
    // Update canteen stall count
    await this.db
      .update(canteens)
      .set({ totalStalls: sql`${canteens.totalStalls} + 1` })
      .where(eq(canteens.id, insertStall.canteenId));
    
    return results[0];
  }

  async updateStallQueue(id: string, queueNumber: number, waitTime: number): Promise<Stall | undefined> {
    const results = await this.db
      .update(stalls)
      .set({ currentQueue: queueNumber, estimatedWaitTime: waitTime })
      .where(eq(stalls.id, id))
      .returning();
    return results[0];
  }

  // Food Listings
  async getAllFoodListings(availableOnly: boolean = false): Promise<FoodListing[]> {
    if (availableOnly) {
      return await this.db.select().from(foodListings).where(eq(foodListings.available, true));
    }
    return await this.db.select().from(foodListings);
  }

  async getFoodListing(id: string): Promise<FoodListing | undefined> {
    const results = await this.db.select().from(foodListings).where(eq(foodListings.id, id));
    return results[0];
  }

  async getFoodListingsByVendor(vendorId: string): Promise<FoodListing[]> {
    return await this.db.select().from(foodListings).where(eq(foodListings.vendorId, vendorId));
  }

  async createFoodListing(insertListing: InsertFoodListing): Promise<FoodListing> {
    const id = randomUUID();
    const results = await this.db.insert(foodListings).values({
      ...insertListing,
      id,
      available: true,
    }).returning();
    return results[0];
  }

  async updateFoodListingAvailability(id: string, available: boolean): Promise<FoodListing | undefined> {
    const results = await this.db
      .update(foodListings)
      .set({ available })
      .where(eq(foodListings.id, id))
      .returning();
    return results[0];
  }

  // Vendors
  async getAllVendors(): Promise<Vendor[]> {
    return await this.db.select().from(vendors);
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const results = await this.db.select().from(vendors).where(eq(vendors.id, id));
    return results[0];
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const id = randomUUID();
    const results = await this.db.insert(vendors).values({
      ...insertVendor,
      id,
      rating: "0",
      reviewCount: 0,
    }).returning();
    return results[0];
  }

  // Canteen Delete
  async deleteCanteen(id: string): Promise<void> {
    // Delete all stalls in this canteen first
    await this.db.delete(stalls).where(eq(stalls.canteenId, id));
    // Delete the canteen
    await this.db.delete(canteens).where(eq(canteens.id, id));
  }

  // Stall Delete
  async deleteStall(id: string): Promise<void> {
    const stall = await this.getStall(id);
    if (stall) {
      // Delete the stall
      await this.db.delete(stalls).where(eq(stalls.id, id));
      // Update canteen stall count
      await this.db
        .update(canteens)
        .set({ totalStalls: sql`${canteens.totalStalls} - 1` })
        .where(eq(canteens.id, stall.canteenId));
    }
  }

  // Vendor Delete
  async deleteVendor(id: string): Promise<void> {
    // Delete all food listings for this vendor first
    await this.db.delete(foodListings).where(eq(foodListings.vendorId, id));
    // Delete the vendor
    await this.db.delete(vendors).where(eq(vendors.id, id));
  }

  // Food Listing Delete
  async deleteFoodListing(id: string): Promise<void> {
    await this.db.delete(foodListings).where(eq(foodListings.id, id));
  }

  // Ratings
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = randomUUID();
    const results = await this.db.insert(ratings).values({
      ...insertRating,
      id,
    }).returning();
    
    // Update entity rating
    await this.updateEntityRating(insertRating.entityType, insertRating.entityId);
    
    return results[0];
  }

  async getRatingsByEntity(entityType: string, entityId: string): Promise<Rating[]> {
    return await this.db
      .select()
      .from(ratings)
      .where(and(eq(ratings.entityType, entityType), eq(ratings.entityId, entityId)));
  }

  async getAllRatings(): Promise<Rating[]> {
    return await this.db.select().from(ratings);
  }

  async updateEntityRating(entityType: string, entityId: string): Promise<void> {
    const entityRatings = await this.getRatingsByEntity(entityType, entityId);
    if (entityRatings.length === 0) return;

    // Keep numeric value - Drizzle will handle decimal conversion
    const avgRating = entityRatings.reduce((sum, r) => sum + r.rating, 0) / entityRatings.length;
    
    if (entityType === 'stall') {
      await this.db
        .update(stalls)
        .set({ rating: sql`${avgRating}::numeric(3,2)`, reviewCount: entityRatings.length })
        .where(eq(stalls.id, entityId));
    } else if (entityType === 'vendor') {
      await this.db
        .update(vendors)
        .set({ rating: sql`${avgRating}::numeric(3,2)`, reviewCount: entityRatings.length })
        .where(eq(vendors.id, entityId));
    }
  }

  // Seed database with initial data
  async seedDatabase() {
    // Check if already seeded
    const existingCanteens = await this.getAllCanteens();
    if (existingCanteens.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with initial data...");

    // Seed 5 canteens
    const canteenNames = ["North Canteen", "South Canteen", "East Canteen", "West Canteen", "Central Canteen"];
    const canteenLocations = ["Block A", "Block B", "Block C", "Block D", "Block E"];
    
    for (let i = 0; i < canteenNames.length; i++) {
      const id = `canteen-${i + 1}`;
      await this.db.insert(canteens).values({
        id,
        name: canteenNames[i],
        location: canteenLocations[i],
        totalStalls: 0,
      });
    }

    // Seed stalls for each canteen
    const cuisines = ["Chinese", "Malay", "Indian", "Western", "Japanese", "Korean", "Thai", "Vietnamese"];
    const stallNames = [
      "Wok & Roll", "Nasi Lemak Paradise", "Curry House", "Grill Master",
      "Sushi Station", "K-Food Corner", "Thai Delights", "Pho Heaven",
      "Chicken Rice Express", "Mee Goreng", "Roti Prata", "Fish & Chips",
      "Bento Box", "Bibimbap Bowl", "Tom Yum", "Spring Rolls"
    ];

    let stallIndex = 0;
    const seededCanteens = await this.getAllCanteens();
    
    for (const canteen of seededCanteens) {
      const numStalls = Math.floor(Math.random() * 3) + 3; // 3-5 stalls per canteen
      for (let i = 0; i < numStalls; i++) {
        const id = `stall-${stallIndex + 1}`;
        const queue = Math.floor(Math.random() * 20); // 0-19 people
        const waitTime = Math.ceil(queue * 2.5); // ~2.5 min per person
        
        await this.db.insert(stalls).values({
          id,
          canteenId: canteen.id,
          name: stallNames[stallIndex % stallNames.length],
          cuisineType: cuisines[stallIndex % cuisines.length],
          currentQueue: queue,
          estimatedWaitTime: waitTime,
          rating: (Math.random() * 1.5 + 3.5).toFixed(2), // 3.5-5.0
          reviewCount: Math.floor(Math.random() * 200) + 50,
        });
        stallIndex++;
      }
      
      // Update canteen stall count
      await this.db
        .update(canteens)
        .set({ totalStalls: numStalls })
        .where(eq(canteens.id, canteen.id));
    }

    // Seed vendors
    const vendorData = [
      { name: "Sunrise Bakery", type: "bakery", address: "123 Orchard Road", operatingHours: "6:00 AM - 8:00 PM" },
      { name: "Golden Wok Restaurant", type: "restaurant", address: "456 Chinatown Street", operatingHours: "11:00 AM - 10:00 PM" },
      { name: "Kopi & Toast Cafe", type: "cafe", address: "789 Marina Bay", operatingHours: "7:00 AM - 6:00 PM" },
      { name: "Hawker's Delight", type: "hawker", address: "101 East Coast Road", operatingHours: "10:00 AM - 9:00 PM" },
      { name: "French Patisserie", type: "bakery", address: "234 Somerset Road", operatingHours: "8:00 AM - 7:00 PM" },
    ];

    for (let i = 0; i < vendorData.length; i++) {
      const id = `vendor-${i + 1}`;
      await this.db.insert(vendors).values({
        id,
        ...vendorData[i],
        rating: (Math.random() * 1 + 4).toFixed(2), // 4.0-5.0
        reviewCount: Math.floor(Math.random() * 150) + 30,
        imageUrl: null,
      });
    }

    // Seed food listings
    const foodItems = [
      { title: "Assorted Bread & Pastries", desc: "Fresh croissants, baguettes, and danish pastries", img: "Bakery_bread_and_pastries_491a3fb4.png", original: 25, discounted: 12 },
      { title: "Nasi Lemak Set", desc: "Fragrant coconut rice with chicken, sambal, and sides", img: "Nasi_lemak_food_item_ff62eaaa.png", original: 8, discounted: 4 },
      { title: "Dim Sum Platter", desc: "Assorted steamed dim sum - har gow, siu mai, bao", img: "Dim_sum_selection_52cbe93d.png", original: 18, discounted: 9 },
      { title: "Fresh Salad Bowl", desc: "Mixed greens with seasonal vegetables and dressing", img: "Fresh_salad_bowl_933a387a.png", original: 12, discounted: 6 },
      { title: "Chicken Rice", desc: "Tender sliced chicken with fragrant rice and chili sauce", img: "Chicken_rice_dish_87e4f1a2.png", original: 6, discounted: 3 },
    ];

    for (let i = 0; i < foodItems.length; i++) {
      const id = `listing-${i + 1}`;
      const vendorId = `vendor-${(i % vendorData.length) + 1}`;
      const item = foodItems[i];
      
      await this.db.insert(foodListings).values({
        id,
        vendorId,
        title: item.title,
        description: item.desc,
        originalPrice: item.original.toFixed(2),
        discountedPrice: item.discounted.toFixed(2),
        quantity: Math.floor(Math.random() * 10) + 5,
        pickupTimeStart: "17:00",
        pickupTimeEnd: "19:30",
        imageUrl: item.img,
        available: true,
      });
    }

    console.log("Database seeding completed!");
  }
}

export const storage = new DbStorage();
