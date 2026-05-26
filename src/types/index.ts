// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  profileImage?: string | null;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "super_admin" | "admin" | "manager" | "visitor";

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

// Menu types
export interface PrimaryCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  categories?: MenuCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  primaryCategoryId: string;
  primaryCategory?: PrimaryCategory;
  items?: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

// Measurement types - simplified (no abbreviation)
export interface MeasurementType {
  id: string;
  name: string;
  shortName?: string;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Menu item measurement for pricing variations
export interface MenuItemMeasurement {
  id: string;
  menuItemId: string;
  measurementTypeId: string;
  measurementType?: MeasurementType;
  price: number;
}

export type LocationAvailability = "both" | "scarborough" | "markham";

// Menu item - updated to match backend entity
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price?: number; // Base price (used when priceScarborough/priceMarkham are null)
  priceScarborough?: number | null; // Override price for Scarborough
  priceMarkham?: number | null; // Override price for Markham
  locationAvailability: LocationAvailability; // Which location(s) this item is available at
  allergens?: Allergen[];
  dietaryInfo?: DietaryInfo[];
  isAvailable: boolean;
  imageUrls?: string[];
  sortOrder: number;
  categoryId: string;
  category?: MenuCategory;
  hasMeasurements: boolean;
  preparationTime?: number;
  measurements?: MenuItemMeasurement[];
  createdAt: string;
  updatedAt: string;
}

// Dietary and Allergen enums
export type DietaryInfo =
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "dairy_free"
  | "nut_free"
  | "halal"
  | "kosher";

export type Allergen =
  | "gluten"
  | "dairy"
  | "nuts"
  | "eggs"
  | "soy"
  | "shellfish"
  | "fish"
  | "sesame";

// Event types - updated to match backend
export type EventType =
  | "live_music"
  | "sports_viewing"
  | "trivia_night"
  | "karaoke"
  | "private_party"
  | "special_event";

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  displayStartDate: string;
  displayEndDate: string;
  eventStartDate: string;
  eventEndDate: string;
  isActive: boolean;
  imageUrls?: string[];
  ticketLink?: string;
  location?: string;
  capacity?: number;
  registrationRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

// Special types
export type SpecialType =
  | "daily"
  | "game_time"
  | "day_time"
  | "chef"
  | "seasonal";
export type SpecialCategory = "regular" | "late_night";
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type Location = "markham" | "scarborough" | "both";

/**
 * Special interface
 *
 * Design:
 * - Daily specials: Use dayOfWeek to determine which day to show (all day)
 * - Late night specials: Set specialCategory to 'late_night' (shown all day)
 * - displayStartDate/displayEndDate: Date-only fields for limited promotions
 */
export interface Special {
  id: string;
  title: string;
  description?: string;
  type: SpecialType;
  /** For daily specials, the day of the week this special is active */
  dayOfWeek?: DayOfWeek | null;
  /** Category: regular or late_night (late_night shown all day) */
  specialCategory?: SpecialCategory | null;
  /** Optional start date for limited-time promotions (YYYY-MM-DD) */
  displayStartDate?: string | null;
  /** Optional end date for limited-time promotions (YYYY-MM-DD) */
  displayEndDate?: string | null;
  isActive: boolean;
  imageUrls?: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Opening Hours types
// Note: closeTime can be less than openTime for overnight hours (e.g., open 22:00, close 02:00)
export interface OpeningHours {
  id: string;
  dayOfWeek: DayOfWeek;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
  location: Location;
  createdAt: string;
  updatedAt: string;
}

// Newsletter types
export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  isVerified: boolean;
  preferredLocation?: "markham" | "scarborough" | "both";
  interests?: string[];
  source?: string | null;
  verificationToken?: string | null;
  unsubscribeToken?: string | null;
  verifiedAt?: string | null;
  unsubscribedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewsletterStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed";

export interface NewsletterCampaign {
  id: string;
  subject: string;
  content: string;
  status: NewsletterStatus;
  scheduledAt?: string;
  sentAt?: string;
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
  successfulSends: number;
  failedSends: number;
  createdAt: string;
  updatedAt: string;
}

// Gallery types
export type GalleryMediaType = "image" | "video";

export interface GallerySection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  categoryId?: string | null;
  category?: GallerySection | null;
  mediaType: GalleryMediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryGrouped {
  category: GallerySection | null;
  items: GalleryItem[];
}

// Common types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
  timestamp?: string;
  path?: string;
  method?: string;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}
