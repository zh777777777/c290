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
      res.status(500).send("Error loading vendor portal");
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

  const httpServer = createServer(app);
  return httpServer;
}
