import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import {
  insertStallSchema,
  insertFoodListingSchema,
  insertVendorSchema,
  insertRatingSchema,
  insertUserSchema,
  insertUserPreferencesSchema,
  insertDeliveryRequestSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up EJS as view engine
  app.set("view engine", "ejs");
  app.set("views", path.join(process.cwd(), "views"));

  // Serve static files
  app.use("/public", (req, res, next) => {
    res.sendFile(path.join(process.cwd(), req.path), (err) => {
      if (err) next();
    });
  });

  // Serve generated images
  app.use("/assets", (req, res, next) => {
    res.sendFile(path.join(process.cwd(), "attached_assets", req.path), (err) => {
      if (err) next();
    });
  });

  // ===== PAGE ROUTES =====

  // Home page - redirects to queue monitor
  app.get("/", (req, res) => {
    res.redirect("/queue-monitor");
  });

  // Queue Monitor Dashboard
  app.get("/queue-monitor", async (req, res) => {
    try {
      const canteens = await storage.getAllCanteens();
      const stalls = await storage.getAllStalls();
      
      // Group stalls by canteen
      const canteenData = canteens.map(canteen => ({
        ...canteen,
        stalls: stalls.filter(s => s.canteenId === canteen.id),
      }));

      res.render("queue-monitor", {
        title: "Queue Monitor - Food Rescue SG",
        canteens: canteenData,
        activePage: "queue",
      });
    } catch (error) {
      console.error("Error rendering queue monitor:", error);
      res.status(500).send("Error loading queue monitor");
    }
  });

  // Food Rescue Marketplace
  app.get("/food-rescue", async (req, res) => {
    try {
      const listings = await storage.getAllFoodListings(true);
      const vendors = await storage.getAllVendors();
      
      // Enrich listings with vendor data
      const enrichedListings = listings.map(listing => ({
        ...listing,
        vendor: vendors.find(v => v.id === listing.vendorId),
      }));

      // Calculate impact statistics
      const totalSaved = listings.reduce((sum, l) => 
        sum + (parseFloat(l.originalPrice) - parseFloat(l.discountedPrice)) * l.quantity, 0
      );
      const mealsRescued = listings.reduce((sum, l) => sum + l.quantity, 0);
      const co2Reduced = mealsRescued * 2.5; // Assuming 2.5kg CO2 per meal

      res.render("food-rescue", {
        title: "Food Rescue SG - Save Food, Save Money, Save Tomorrow",
        listings: enrichedListings,
        vendors,
        stats: {
          totalSaved: totalSaved.toFixed(2),
          mealsRescued,
          co2Reduced: co2Reduced.toFixed(1),
        },
        activePage: "rescue",
      });
    } catch (error) {
      console.error("Error rendering food rescue:", error);
      res.status(500).send("Error loading food rescue marketplace");
    }
  });

  // Vendor Portal
  app.get("/vendor-portal", async (req, res) => {
    try {
      const vendors = await storage.getAllVendors();
      res.render("vendor-portal", {
        title: "Vendor Portal - Food Rescue SG",
        vendors,
        activePage: "vendor",
      });
    } catch (error) {
      console.error("Error rendering vendor portal:", error);
      res.status(500).send("Error loading vendor portal");
    }
  });

  // Smart Recommendations
  app.get("/recommendations", async (req, res) => {
    try {
      const blocks = await storage.getAllCampusBlocks();
      
      // For demo purposes, create or get a test user
      let testUser = await storage.getUserByUsername("demo_user");
      if (!testUser) {
        testUser = await storage.createUser({
          username: "demo_user",
          email: "demo@foodrescue.sg",
          passwordHash: "demo_hash",
          fullName: "Demo User",
          currentBlockId: blocks[0]?.id || null,
          deliveryAvailable: false,
        });
        
        // Create default preferences
        await storage.createUserPreferences({
          userId: testUser.id,
          cuisineTypes: ["Chinese", "Western", "Japanese"],
          dietaryRestrictions: [],
          maxQueueTime: 30,
          maxWalkingDistance: 500,
          preferLowCost: true,
          avoidPeakHours: true,
        });
      }
      
      const userPrefs = await storage.getUserPreferences(testUser.id);
      const currentBlock = testUser.currentBlockId ? await storage.getCampusBlock(testUser.currentBlockId) : null;
      
      res.render("recommendations", {
        title: "Smart Recommendations - Food Rescue SG",
        user: testUser,
        preferences: userPrefs,
        currentBlock,
        blocks,
        activePage: "recommendations",
      });
    } catch (error) {
      console.error("Error rendering recommendations:", error);
      res.status(500).send("Error loading recommendations");
    }
  });

  // Order Food with Delivery
  app.get("/order-food", async (req, res) => {
    try {
      const stalls = await storage.getAllStalls();
      const canteens = await storage.getAllCanteens();
      const blocks = await storage.getAllCampusBlocks();
      
      // Get demo user
      let testUser = await storage.getUserByUsername("demo_user");
      if (!testUser) {
        testUser = await storage.createUser({
          username: "demo_user",
          email: "demo@foodrescue.sg",
          passwordHash: "demo_hash",
          fullName: "Demo User",
          currentBlockId: blocks[0]?.id || null,
          deliveryAvailable: false,
        });
      }
      
      const currentBlock = testUser.currentBlockId ? await storage.getCampusBlock(testUser.currentBlockId) : null;
      
      // Check if it's peak hour (11:30-13:30 or 17:30-19:30 Singapore time)
      const now = new Date();
      const sgHour = (now.getUTCHours() + 8) % 24; // Singapore is UTC+8
      const sgMinute = now.getUTCMinutes();
      const isPeakHour = 
        (sgHour === 11 && sgMinute >= 30) || 
        (sgHour === 12) || 
        (sgHour === 13 && sgMinute < 30) ||
        (sgHour === 17 && sgMinute >= 30) || 
        (sgHour === 18) || 
        (sgHour === 19 && sgMinute < 30);
      
      res.render("order-food", {
        title: "Order Food - Food Rescue SG",
        stalls,
        canteens,
        campusBlocks: blocks,
        user: testUser,
        currentBlock,
        isPeakHour,
        activePage: "order",
      });
    } catch (error) {
      console.error("Error rendering order food:", error);
      res.status(500).send("Error loading order page");
    }
  });

  // Delivery Hub
  app.get("/delivery-hub", async (req, res) => {
    try {
      const blocks = await storage.getAllCampusBlocks();
      
      // Get demo user
      let testUser = await storage.getUserByUsername("demo_user");
      if (!testUser) {
        testUser = await storage.createUser({
          username: "demo_user",
          email: "demo@foodrescue.sg",
          passwordHash: "demo_hash",
          fullName: "Demo User",
          currentBlockId: blocks[0]?.id || null,
          deliveryAvailable: false,
          isDeliveryPerson: false,
        });
      }
      
      // Get pending delivery requests (only if user is online)
      let pendingRequests: any[] = [];
      if (testUser.isDeliveryPerson && testUser.deliveryAvailable) {
        const rawRequests = await storage.getPendingDeliveryRequests();
        const stalls = await storage.getAllStalls();
        const canteens = await storage.getAllCanteens();
        
        // Enrich with stall and canteen names
        pendingRequests = rawRequests.map(req => {
          const stall = stalls.find(s => s.id === req.stallId);
          const canteen = canteens.find(c => c.id === stall?.canteenId);
          return {
            ...req,
            stallName: stall?.name || 'Unknown Stall',
            canteenName: canteen?.name || 'Unknown Canteen',
          };
        });
      }
      
      // Get user's active deliveries
      let myDeliveries: any[] = [];
      if (testUser.isDeliveryPerson) {
        const rawDeliveries = await storage.getDeliveryRequestsByDeliveryPerson(testUser.id);
        const stalls = await storage.getAllStalls();
        const canteens = await storage.getAllCanteens();
        
        // Filter out cancelled/pending, enrich with names
        myDeliveries = rawDeliveries
          .filter(d => d.status !== 'cancelled' && d.status !== 'pending')
          .map(req => {
            const stall = stalls.find(s => s.id === req.stallId);
            const canteen = canteens.find(c => c.id === stall?.canteenId);
            return {
              ...req,
              stallName: stall?.name || 'Unknown Stall',
              canteenName: canteen?.name || 'Unknown Canteen',
            };
          });
      }
      
      // Get earnings data
      let earningsHistory: any[] = [];
      let totalEarnings = 0;
      if (testUser.isDeliveryPerson) {
        earningsHistory = await storage.getDeliveryPersonEarnings(testUser.id);
        totalEarnings = await storage.getTotalEarnings(testUser.id);
      }
      
      // Get vouchers
      const vouchers = await storage.getUserVouchers(testUser.id, false);
      
      res.render("delivery-hub", {
        title: "Delivery Hub - Food Rescue SG",
        user: testUser,
        campusBlocks: blocks,
        pendingRequests,
        pendingCount: pendingRequests.length,
        myDeliveries,
        earningsHistory,
        totalEarnings: totalEarnings.toFixed(2),
        vouchers,
        activePage: "delivery",
      });
    } catch (error) {
      console.error("Error rendering delivery hub:", error);
      res.status(500).send("Error loading delivery hub");
    }
  });

  // Admin Dashboard
  app.get("/admin", async (req, res) => {
    try {
      const canteens = await storage.getAllCanteens();
      const stalls = await storage.getAllStalls();
      const vendors = await storage.getAllVendors();
      const listings = await storage.getAllFoodListings();
      const ratings = await storage.getAllRatings();

      res.render("admin", {
        title: "Admin Dashboard - Food Rescue SG",
        canteens,
        stalls,
        vendors,
        listings,
        stats: {
          totalCanteens: canteens.length,
          totalStalls: stalls.length,
          totalVendors: vendors.length,
          activeListings: listings.filter(l => l.available).length,
          totalRatings: ratings.length,
        },
        activePage: "admin",
      });
    } catch (error) {
      console.error("Error rendering admin dashboard:", error);
      res.status(500).send("Error loading admin dashboard");
    }
  });

  // ===== API ROUTES =====

  // Get all campus blocks
  app.get("/api/campus-blocks", async (req, res) => {
    try {
      const blocks = await storage.getAllCampusBlocks();
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching campus blocks:", error);
      res.status(500).json({ error: "Failed to fetch campus blocks" });
    }
  });

  // Get user by ID
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get smart recommendations for a user
  app.get("/api/recommendations/:userId", async (req, res) => {
    try {
      const { calculateRecommendations } = await import("./services/recommendations");
      
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const preferences = await storage.getUserPreferences(user.id);
      const userBlock = user.currentBlockId 
        ? await storage.getCampusBlock(user.currentBlockId)
        : undefined;
      
      const stalls = await storage.getAllStalls();
      const canteens = await storage.getAllCanteens();
      const blocks = await storage.getAllCampusBlocks();

      const recommendations = calculateRecommendations(
        user,
        preferences,
        userBlock,
        stalls,
        canteens,
        blocks
      );

      res.json(recommendations);
    } catch (error) {
      console.error("Error calculating recommendations:", error);
      res.status(500).json({ error: "Failed to calculate recommendations" });
    }
  });

  // Update user location
  app.patch("/api/users/:userId/location", async (req, res) => {
    try {
      const { blockId } = req.body;
      const user = await storage.updateUserLocation(req.params.userId, blockId);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // Update user preferences
  app.patch("/api/users/:userId/preferences", async (req, res) => {
    try {
      const validatedData = insertUserPreferencesSchema.partial().parse(req.body);
      const preferences = await storage.updateUserPreferences(
        req.params.userId,
        validatedData
      );
      res.json(preferences);
    } catch (error) {
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });

  // Create delivery request (order food with delivery)
  app.post("/api/delivery-requests", async (req, res) => {
    try {
      // Get demo user for customer ID
      const demoUser = await storage.getUserByUsername("demo_user");
      if (!demoUser) {
        return res.status(400).json({ error: "User not found" });
      }

      // SERVER-SIDE PRICING CALCULATION & VALIDATION (SECURITY)
      // Parse and validate food total
      const foodTotal = parseFloat(req.body.totalAmount || "0");
      if (isNaN(foodTotal) || foodTotal <= 0 || foodTotal > 1000) {
        return res.status(400).json({ error: "Invalid food total amount (must be between $0.01 and $1000)" });
      }
      
      // Validate stall exists
      const stall = await storage.getStall(req.body.stallId);
      if (!stall) {
        return res.status(400).json({ error: "Invalid stall ID" });
      }
      
      // Sanitize text inputs (prevent XSS)
      const sanitizeText = (text: string): string => {
        return text
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;')
          .substring(0, 500); // Max length
      };
      
      const foodItems = sanitizeText(req.body.foodItems || "");
      if (foodItems.trim().length === 0) {
        return res.status(400).json({ error: "Food items cannot be empty" });
      }
      
      const pickupLocation = sanitizeText(req.body.pickupLocation || "");
      const deliveryLocation = sanitizeText(req.body.deliveryLocation || "");
      
      // Validate delivery block exists
      if (req.body.deliveryBlockId) {
        const block = await storage.getCampusBlock(req.body.deliveryBlockId);
        if (!block) {
          return res.status(400).json({ error: "Invalid delivery location" });
        }
      }
      
      const requestData = req.body;
      
      // Calculate peak hour status (SERVER TIME - cannot be spoofed)
      const now = new Date();
      const sgHour = (now.getUTCHours() + 8) % 24; // Singapore is UTC+8
      const sgMinute = now.getUTCMinutes();
      const isPeakHour = 
        (sgHour === 11 && sgMinute >= 30) || 
        (sgHour === 12) || 
        (sgHour === 13 && sgMinute < 30) ||
        (sgHour === 17 && sgMinute >= 30) || 
        (sgHour === 18) || 
        (sgHour === 19 && sgMinute < 30);
      
      // Calculate delivery fee (SERVER-AUTHORITATIVE)
      const baseDeliveryFee = 1.50;
      const peakSurcharge = 0.50;
      const deliveryFee = isPeakHour ? baseDeliveryFee + peakSurcharge : baseDeliveryFee;
      
      // Calculate correct total
      const correctTotal = foodTotal + deliveryFee;
      
      // Note: Client also sends their calculated total, but we ignore it for security

      const validatedData = insertDeliveryRequestSchema.parse({
        customerId: demoUser.id,
        stallId: requestData.stallId,
        foodItems, // Sanitized
        totalAmount: foodTotal.toFixed(2), // Food total only, validated
        deliveryFee: deliveryFee.toFixed(2), // Server-calculated
        isPeakHour, // Server-determined
        pickupLocation, // Sanitized
        deliveryLocation, // Sanitized
        deliveryBlockId: requestData.deliveryBlockId, // Validated
      });
      
      const deliveryRequest = await storage.createDeliveryRequest(validatedData);
      res.json(deliveryRequest);
    } catch (error) {
      console.error("Error creating delivery request:", error);
      res.status(400).json({ error: "Invalid delivery request data" });
    }
  });

  // Get pending delivery requests (for delivery persons)
  app.get("/api/delivery-requests/pending", async (req, res) => {
    try {
      const requests = await storage.getPendingDeliveryRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  // Get customer's delivery requests
  app.get("/api/delivery-requests/customer/:customerId", async (req, res) => {
    try {
      const requests = await storage.getDeliveryRequestsByCustomer(req.params.customerId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer requests" });
    }
  });

  // Register as delivery person
  app.post("/api/users/register-delivery-person", async (req, res) => {
    try {
      const { phoneNumber, currentBlockId } = req.body;
      
      // Get demo user
      const user = await storage.getUserByUsername("demo_user");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Register user as delivery person
      const updatedUser = await storage.registerAsDeliveryPerson(user.id, phoneNumber, currentBlockId);
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user" });
      }
      
      res.json({ success: true, message: "Registered as delivery person", user: updatedUser });
    } catch (error) {
      console.error("Error registering delivery person:", error);
      res.status(500).json({ error: "Failed to register as delivery person" });
    }
  });

  // Toggle delivery availability
  app.post("/api/users/toggle-availability", async (req, res) => {
    try {
      const { available } = req.body;
      
      // Get demo user
      const user = await storage.getUserByUsername("demo_user");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updatedUser = await storage.toggleDeliveryAvailability(user.id, available);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error toggling availability:", error);
      res.status(500).json({ error: "Failed to toggle availability" });
    }
  });

  // Accept delivery request
  app.patch("/api/delivery-requests/:id/accept", async (req, res) => {
    try {
      // Get demo user as delivery person
      const user = await storage.getUserByUsername("demo_user");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.isDeliveryPerson) {
        return res.status(403).json({ error: "User is not a delivery person" });
      }
      
      const request = await storage.acceptDeliveryRequest(req.params.id, user.id);
      
      if (!request) {
        return res.status(404).json({ error: "Delivery request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error accepting delivery request:", error);
      res.status(500).json({ error: "Failed to accept delivery request" });
    }
  });

  // Update delivery status
  app.patch("/api/delivery-requests/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const request = await storage.updateDeliveryStatus(req.params.id, status);
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  });

  // Get all stalls for a canteen
  app.get("/api/canteens/:id/stalls", async (req, res) => {
    try {
      const stalls = await storage.getStallsByCanteen(req.params.id);
      res.json(stalls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stalls" });
    }
  });

  // Update stall queue
  app.post("/api/stalls/:id/queue", async (req, res) => {
    try {
      const { queueNumber, waitTime } = req.body;
      const stall = await storage.updateStallQueue(
        req.params.id,
        parseInt(queueNumber),
        parseInt(waitTime)
      );
      res.json(stall);
    } catch (error) {
      res.status(500).json({ error: "Failed to update queue" });
    }
  });

  // Create food listing
  app.post("/api/food-listings", async (req, res) => {
    try {
      const validatedData = insertFoodListingSchema.parse(req.body);
      const listing = await storage.createFoodListing(validatedData);
      res.json(listing);
    } catch (error) {
      res.status(400).json({ error: "Invalid food listing data" });
    }
  });

  // Get all food listings
  app.get("/api/food-listings", async (req, res) => {
    try {
      const availableOnly = req.query.available === "true";
      const listings = await storage.getAllFoodListings(availableOnly);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // Update food listing availability
  app.patch("/api/food-listings/:id/availability", async (req, res) => {
    try {
      const { available } = req.body;
      const listing = await storage.updateFoodListingAvailability(
        req.params.id,
        available
      );
      res.json(listing);
    } catch (error) {
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  // Create vendor
  app.post("/api/vendors", async (req, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  // Submit rating
  app.post("/api/ratings", async (req, res) => {
    try {
      const validatedData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating(validatedData);
      res.json(rating);
    } catch (error) {
      res.status(400).json({ error: "Invalid rating data" });
    }
  });

  // Get ratings for an entity
  app.get("/api/ratings/:entityType/:entityId", async (req, res) => {
    try {
      const ratings = await storage.getRatingsByEntity(
        req.params.entityType,
        req.params.entityId
      );
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });

  // Simulate real-time queue updates
  app.post("/api/simulate-queue-update", async (req, res) => {
    try {
      const stalls = await storage.getAllStalls();
      // Randomly update some stalls
      for (const stall of stalls) {
        if (Math.random() > 0.7) {
          const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const newQueue = Math.max(0, stall.currentQueue + change);
          const newWait = Math.ceil(newQueue * 2.5);
          await storage.updateStallQueue(stall.id, newQueue, newWait);
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to simulate update" });
    }
  });

  // ===== ADMIN API ROUTES =====

  // Get all canteens
  app.get("/api/canteens", async (req, res) => {
    try {
      const canteens = await storage.getAllCanteens();
      res.json(canteens);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch canteens" });
    }
  });

  // Create canteen
  app.post("/api/canteens", async (req, res) => {
    try {
      const { name, location } = req.body;
      const canteen = await storage.createCanteen({ name, location });
      res.json(canteen);
    } catch (error) {
      res.status(400).json({ error: "Invalid canteen data" });
    }
  });

  // Delete canteen
  app.delete("/api/canteens/:id", async (req, res) => {
    try {
      await storage.deleteCanteen(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete canteen" });
    }
  });

  // Create stall
  app.post("/api/stalls", async (req, res) => {
    try {
      const validatedData = insertStallSchema.parse(req.body);
      const stall = await storage.createStall(validatedData);
      res.json(stall);
    } catch (error) {
      res.status(400).json({ error: "Invalid stall data" });
    }
  });

  // Delete stall
  app.delete("/api/stalls/:id", async (req, res) => {
    try {
      await storage.deleteStall(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stall" });
    }
  });

  // Delete vendor
  app.delete("/api/vendors/:id", async (req, res) => {
    try {
      await storage.deleteVendor(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vendor" });
    }
  });

  // Delete food listing
  app.delete("/api/food-listings/:id", async (req, res) => {
    try {
      await storage.deleteFoodListing(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete food listing" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
