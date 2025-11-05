# Design Guidelines: School Canteen Queue & Food Rescue SG Platform

## Design Approach
**Selected System:** Material Design with mobile-first principles
**Justification:** This platform requires efficient data display (queue monitoring), content-rich marketplace features, and strong mobile usability for Singapore students and consumers. Material Design provides robust patterns for real-time dashboards, card-based layouts, and mobile-optimized interfaces.

**Core Design Principles:**
- Mobile-first design (students checking queues on-the-go)
- Instant information accessibility (queue status at a glance)
- Trust-building through transparency (food rescue marketplace)
- Singapore-centric visual language

---

## Typography

**Font Families:**
- Primary: Inter (UI elements, body text) - via Google Fonts
- Secondary: DM Sans (headings, emphasis) - via Google Fonts

**Type Scale:**
- Hero/Display: text-5xl to text-6xl, font-bold
- Page Titles: text-3xl to text-4xl, font-bold
- Section Headers: text-2xl, font-semibold
- Card Titles: text-xl, font-semibold
- Body Text: text-base, font-normal
- Metadata/Supporting: text-sm, font-medium
- Labels/Captions: text-xs, font-medium

---

## Layout System

**Spacing Primitives:**
Use Tailwind units: **2, 4, 6, 8, 12, 16** for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-16
- Card gaps: gap-4 to gap-6
- Element margins: m-2, m-4, m-8

**Grid Structure:**
- Mobile: Single column (grid-cols-1)
- Tablet: 2 columns (md:grid-cols-2)
- Desktop: 3-4 columns for cards (lg:grid-cols-3, xl:grid-cols-4)

**Container Widths:**
- Full-width dashboard: max-w-7xl
- Content sections: max-w-6xl
- Form containers: max-w-2xl

---

## Component Library

### Navigation
**Primary Header:**
- Fixed top navigation with logo, main navigation links, and user profile
- Mobile: Hamburger menu with slide-out drawer
- Height: h-16
- Shadow: shadow-md for elevation

**Tab Navigation:** 
- For switching between "Queue Monitor" and "Food Rescue" sections
- Horizontal tabs with underline indicator
- Mobile: Scrollable horizontal tabs

### Queue Status Dashboard
**Canteen Cards:**
- Large, prominent cards displaying canteen names (1 to 5)
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Each card shows: canteen name, number of stalls, overall status indicator
- Rounded corners: rounded-xl
- Elevation: shadow-lg

**Queue Status Indicators:**
- Use large, clear visual indicators (circles or badges)
- Display queue number prominently with text-4xl font-bold
- Include wait time estimation below queue number
- Status represented through border treatments (not color)
- Icons from Heroicons for status (clock, users, checkmark)

**Stall Listings:**
- Expandable/collapsible stall cards within each canteen
- Each stall card includes: name, cuisine type, current queue number, estimated wait time, rating (stars + number)
- Compact list view: divide into columns showing key info at a glance

### Food Rescue Marketplace
**Hero Section:**
- Height: 60vh on desktop, 50vh mobile
- Large background image showing Singapore hawker center or fresh food
- Overlaid content: tagline, mission statement, primary CTA button
- CTA button with backdrop blur: backdrop-blur-md bg-white/90
- No hover states on blurred buttons

**Food Listing Cards:**
- Photo-first design with food image at top (aspect-ratio-square or 4:3)
- Card content: vendor name, food item, original price, discounted price, pickup time window, distance/location
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Hover effect: subtle lift with shadow increase (no color changes)

**Vendor Profiles:**
- Split layout: vendor photo/logo left, information right (2-column on desktop)
- Include: vendor name, type (bakery/restaurant/hawker), rating, address, operating hours
- List of available items below profile

### Forms & Inputs
**Search & Filter Bar:**
- Prominent search bar with icon from Heroicons (magnifying-glass)
- Filter chips/buttons for food type, location, discount percentage
- Sticky positioning on scroll for marketplace

**Input Fields:**
- Consistent height: h-12
- Rounded: rounded-lg
- Border treatment: border-2
- Focus state: ring treatment with ring-2
- Labels: text-sm font-medium, mb-2

**Buttons:**
- Primary CTA: px-6 py-3, rounded-lg, font-semibold
- Secondary: Similar sizing with different border treatment
- Icon buttons: square aspect ratio, p-3

### Data Display Components
**Rating System:**
- Star icons from Heroicons (solid/outline)
- Display: Stars followed by numerical rating (4.5) and review count (120 reviews)
- Text: text-sm

**Info Cards:**
- Compact cards showing statistics (total food saved, CO2 reduced, meals rescued)
- Icons from Heroicons
- Large numbers: text-3xl font-bold
- Labels below: text-sm

**Time/Distance Indicators:**
- Pill-shaped badges: rounded-full px-3 py-1
- Icons + text combinations
- Text: text-xs font-medium

### Admin Dashboard
**Data Tables:**
- Clean, alternating row treatments
- Sortable headers with icons
- Action buttons in final column
- Responsive: stack on mobile with card layout

**Statistics Overview:**
- Grid of metric cards: grid-cols-2 md:grid-cols-4
- Each card: number, label, trend indicator
- Spacing: gap-6

---

## Images

**Hero Image (Food Rescue Section):**
- High-quality photograph of Singapore hawker center or vibrant fresh food display
- Warm, inviting atmosphere showing local food culture
- Placement: Full-width hero section at top of Food Rescue page
- Treatment: Subtle overlay gradient for text readability

**Food Item Photos:**
- Each rescued food listing card requires appetizing food photography
- Square or 4:3 aspect ratio
- Placement: Top of each marketplace card
- Quality: High-resolution, well-lit product shots

**Vendor Logos/Photos:**
- Vendor profile images showing storefront or logo
- Circular treatment: rounded-full
- Size: 80px to 120px diameter
- Placement: Vendor profile sections

**Canteen/Stall Images:**
- Optional supporting imagery for canteen cards
- Placement: Background or small thumbnail
- Treatment: Subtle, doesn't overpower queue information

---

## Accessibility & Responsive Design
- All interactive elements min-height: h-12 (48px touch target)
- Form labels always visible and associated with inputs
- Semantic HTML structure with proper heading hierarchy
- Skip navigation link for keyboard users
- Responsive breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px
- Mobile: stack all multi-column layouts to single column

---

## Animation (Minimal)
- Queue number updates: Simple fade transition
- Card hover: Transform scale(1.02) and shadow increase
- Tab transitions: Smooth underline slide
- Page transitions: Simple fade
- **Duration:** transition-all duration-200 ease-in-out