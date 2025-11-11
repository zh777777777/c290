import type { Stall, User, UserPreferences, CampusBlock, Canteen } from "@shared/schema";

// Configuration for recommendation weights
const WEIGHTS = {
  PREFERENCE: 0.35,
  PROXIMITY: 0.25,
  QUEUE: 0.20,
  RATING: 0.20,
};

export interface ScoredStall {
  stall: Stall;
  canteen: Canteen;
  distance?: number;
  score: number;
  breakdown: {
    preferenceScore: number;
    proximityScore: number;
    queueScore: number;
    ratingScore: number;
  };
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate Jaccard similarity between user cuisine preferences and stall cuisine
 * Returns a value between 0 and 1
 */
function calculatePreferenceScore(
  userCuisines: string[],
  stallCuisine: string,
  dietaryRestrictions: string[]
): number {
  // If user has dietary restrictions that conflict with the stall, penalize heavily
  // For now, we'll implement basic logic (can be extended with a restrictions database)
  const hasConflict = dietaryRestrictions.some(restriction => {
    if (restriction.toLowerCase() === 'vegetarian' && stallCuisine.toLowerCase().includes('meat')) {
      return true;
    }
    if (restriction.toLowerCase() === 'halal' && !stallCuisine.toLowerCase().includes('halal')) {
      return true;
    }
    return false;
  });

  if (hasConflict) return 0;

  // Check if stall cuisine matches any user preference
  const isPreferred = userCuisines.some(
    cuisine => cuisine.toLowerCase() === stallCuisine.toLowerCase()
  );

  // Return higher score for exact match, lower for non-match
  return isPreferred ? 1.0 : 0.3;
}

/**
 * Normalize proximity using inverse distance curve
 * Closer stalls get higher scores (0-1 scale)
 */
function normalizeProximity(distanceMeters: number, maxDistance: number): number {
  if (distanceMeters >= maxDistance) return 0;
  // Use inverse curve: score = 1 - (distance / maxDistance)
  return 1 - distanceMeters / maxDistance;
}

/**
 * Normalize queue time - shorter waits get higher scores
 * Returns 0-1 scale
 */
function normalizeQueueTime(waitMinutes: number, maxWait: number): number {
  if (waitMinutes >= maxWait) return 0;
  // Inverse: shorter wait = higher score
  return 1 - waitMinutes / maxWait;
}

/**
 * Normalize rating from 0-5 scale to 0-1 scale
 */
function normalizeRating(rating: string): number {
  const ratingNum = parseFloat(rating);
  if (isNaN(ratingNum)) return 0.5; // Default middle score for missing ratings
  return Math.min(ratingNum / 5.0, 1.0);
}

/**
 * Main recommendation engine
 * Returns ranked list of stalls with scores
 */
export function calculateRecommendations(
  user: User,
  preferences: UserPreferences | undefined,
  userBlock: CampusBlock | undefined,
  stalls: Stall[],
  canteens: Canteen[],
  blocks: CampusBlock[]
): ScoredStall[] {
  // Set defaults if preferences not available
  const prefs = preferences || {
    cuisineTypes: [],
    dietaryRestrictions: [],
    maxQueueTime: 30,
    maxWalkingDistance: 1000,
    preferLowCost: false,
    avoidPeakHours: false,
  };

  // Handle nullable fields with defaults
  const cuisineTypes = (prefs.cuisineTypes || []) as string[];
  const dietaryRestrictions = (prefs.dietaryRestrictions || []) as string[];
  const maxQueueTime = prefs.maxQueueTime || 30;
  const maxWalkingDistance = prefs.maxWalkingDistance || 1000;

  // Determine confidence level based on available data
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (!userBlock) confidence = 'low';
  else if (!preferences || cuisineTypes.length === 0) confidence = 'medium';

  // Pre-calculate distances for all stalls
  const stallsWithDistance = stalls.map(stall => {
    const canteen = canteens.find(c => c.id === stall.canteenId);
    let distance: number | undefined;
    
    if (userBlock && canteen) {
      const canteenBlock = blocks.find(b => b.nearestCanteenId === canteen.id);
      if (canteenBlock && canteenBlock.latitude && canteenBlock.longitude) {
        distance = calculateDistance(
          parseFloat(userBlock.latitude || "0"),
          parseFloat(userBlock.longitude || "0"),
          parseFloat(canteenBlock.latitude || "0"),
          parseFloat(canteenBlock.longitude || "0")
        );
      }
    }
    
    return { stall, canteen, distance };
  });

  // Hard filters: remove stalls that exceed limits
  const filteredStalls = stallsWithDistance.filter(({ stall, distance }) => {
    // Filter by max queue time
    if (stall.estimatedWaitTime > maxQueueTime) {
      return false;
    }
    
    // Filter by max walking distance (hard filter - MUST enforce)
    if (distance !== undefined && distance > maxWalkingDistance) {
      return false;
    }
    
    return true;
  });

  // Score each stall
  const scoredStalls: ScoredStall[] = filteredStalls.map(({ stall, canteen, distance }) => {
    // Calculate proximity score (distance already computed)
    let proximityScore = 0.5; // Default neutral score if no location data
    
    if (distance !== undefined) {
      proximityScore = normalizeProximity(distance, maxWalkingDistance);
    }

    // Calculate preference score
    const preferenceScore = cuisineTypes.length > 0
      ? calculatePreferenceScore(cuisineTypes, stall.cuisineType, dietaryRestrictions)
      : 0.5; // Neutral if no preferences set

    // Calculate queue score
    const queueScore = normalizeQueueTime(stall.estimatedWaitTime, maxQueueTime);

    // Calculate rating score
    const ratingScore = normalizeRating(stall.rating || "3.5");

    // Calculate weighted total score
    const totalScore =
      preferenceScore * WEIGHTS.PREFERENCE +
      proximityScore * WEIGHTS.PROXIMITY +
      queueScore * WEIGHTS.QUEUE +
      ratingScore * WEIGHTS.RATING;

    return {
      stall,
      canteen: canteen!,
      distance,
      score: totalScore,
      breakdown: {
        preferenceScore,
        proximityScore,
        queueScore,
        ratingScore,
      },
      confidence,
    };
  });

  // Filter out stalls with very low scores (likely exceeded distance limits)
  const validStalls = scoredStalls.filter(s => s.score > 0.1);

  // Sort by score descending
  return validStalls.sort((a, b) => b.score - a.score);
}
