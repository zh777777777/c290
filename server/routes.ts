import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import {
  insertStallSchema,
  insertFoodListingSchema,
  insertVendorSchema,
  insertRatingSchema,
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
