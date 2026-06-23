# Havanat - Technical Specification

## Dependencies

### Core
- `react` ^19.0.0 - UI framework
- `react-dom` ^19.0.0 - DOM renderer
- `react-router-dom` ^7.1.0 - Client-side routing (14 pages)
- `vite` ^6.0.0 - Build tool
- `@vitejs/plugin-react` ^4.3.0 - React Vite plugin

### Styling
- `tailwindcss` ^3.4.0 - Utility-first CSS
- `postcss` ^8.4.0 - CSS processing
- `autoprefixer` ^10.4.0 - Vendor prefixes
- `clsx` ^2.1.0 - Conditional class joining
- `tailwind-merge` ^2.6.0 - Tailwind class merging
- `class-variance-authority` ^0.7.0 - Component variant management

### Animation
- `gsap` ^3.12.0 - Core animation engine (ScrollTrigger, timelines)
- `lenis` ^1.1.0 - Smooth scroll with inertia
- `framer-motion` ^11.0.0 - React declarative animations (page transitions, UI micro-interactions)

### 3D / WebGL
- `three` ^0.170.0 - 3D engine for all WebGL effects
- `@react-three/fiber` ^8.17.0 - React renderer for Three.js
- `@react-three/drei` ^9.114.0 - R3F helpers (useTexture, useVideo, shaderMaterial)
- `@types/three` ^0.170.0 - Three.js TypeScript types

### State Management
- `zustand` ^5.0.0 - Lightweight state management (cart, auth, UI)
- `zustand/middleware` - persist middleware for localStorage

### UI Components
- `@radix-ui/react-dialog` ^1.1.0 - Accessible dialog/modal primitive (Chat Modal, Return Modal, Quick View)
- `@radix-ui/react-tabs` ^1.1.0 - Tab primitive (Product Details, Account)
- `@radix-ui/react-accordion` ^1.2.0 - Accordion primitive (Membership FAQ, Returns FAQ)
- `@radix-ui/react-select` ^2.1.0 - Select primitive (Shop sort, Checkout payment)
- `@radix-ui/react-slider` ^1.2.0 - Slider primitive (Price filter)
- `@radix-ui/react-toast` ^1.2.0 - Toast notifications
- `@radix-ui/react-tooltip` ^1.1.0 - Tooltip primitive
- `@radix-ui/react-dropdown-menu` ^2.1.0 - Dropdown menu primitive
- `@radix-ui/react-separator` ^1.1.0 - Separator/divider
- `@radix-ui/react-label` ^2.1.0 - Form label primitive
- `lucide-react` ^0.460.0 - Icon library (thin elegant line icons)

### Utilities
- `imagesloaded` ^5.0.0 - Image preloading for WebGL scenes
- `@types/imagesloaded` ^4.1.0 - TypeScript types

---

## Component Inventory

### Layout (Global)

| Component | Source | Notes |
|-----------|--------|-------|
| Navbar | Custom | Fixed header, transparent→solid on scroll via Lenis scroll listener. Hamburger menu, cart icon, bespoke CTA. |
| MobileMenu | Custom | Slide-in drawer from right on mobile. Full-screen overlay with nav links. |
| Footer | Custom | Minimal 4-column grid: Brand, Shop, Company, Support. Social icons. |
| CustomCursor | Custom | 2px white circle, inertia follow via rAF. Expands on hoverables. "Drag" indicator on carousels. |
| PageTransitionOverlay | Custom | Black diagonal wipe overlay for route changes via framer-motion AnimatePresence |
| SmoothScrollProvider | Custom | Lenis initialization, global scroll state provider |
| ToastProvider | Custom + Radix | Toast notification system for cart actions, form submissions |

### shadcn/ui Components (installed via CLI)

| Component | Usage |
|-----------|-------|
| Dialog | Chat Modal, Quick Product View, Return Initiation Modal |
| Tabs | Product Detail tabs, Account page tabs |
| Accordion | Membership FAQ, Returns & Exchange FAQ |
| Select | Shop sort dropdown, Checkout payment method |
| Slider | Price range filter |
| Input | All form inputs (newsletter, checkout, contact, login) |
| Button | All CTAs with CVA variants |
| Separator | Visual dividers |
| Label | Form labels |
| Card | Membership tier cards, product cards (styled heavily) |
| Sheet | Mobile filter sidebar on Shop page |
| Badge | Order status badges, "New" tags |
| Textarea | Contact form, Chat modal message |
| Tooltip | Icon button tooltips |
| Checkbox | Filter checkboxes |
| RadioGroup | Size selector, Payment method |

### Home Page Sections

| Component | Source | Notes |
|-----------|--------|-------|
| HeroSection | Custom + R3F | Contains InfiniteFabricPlane canvas + typography overlay |
| InfiniteFabricPlane | Custom (design.md) | WebGL FFD shader effect on fabric video |
| IntroSection | Custom | Asymmetric split layout, sticky text left, Video 2 right |
| TextSelectionEffect | Custom | Cursor-drag text highlight effect (inverse color reveal) |
| ProductsShowcase | Custom + R3F | Contains RotatingCircularCarousel + floating text |
| RotatingCircularCarousel | Custom (design.md) | Three.js multi-ring rotating image carousel |
| CollectionBand | Custom | Horizontal scrolling typography + thumbnail strip |
| MembershipCards | Custom | Sticky 3-tier cards (Regular/Deluxe/Elite) with blur backdrop |
| CommunityReviews | Custom | Grid layout + WebGL horizontal accordion |
| WebGLAccordion | Custom | Horizontal expanding image accordion with review text reveal |

### Shop Page

| Component | Source | Notes |
|-----------|--------|-------|
| ShopHero | Custom + R3F | Contains CurvedInfiniteCarousel |
| CurvedInfiniteCarousel | Custom (design.md) | Three.js CatmullRom curve scrolling image carousel |
| FilterSidebar | Custom + Radix Sheet | Category, Size, Color, Price, Fit filters. Collapsible on mobile via Sheet. |
| ProductGrid | Custom | 2-column grid, strict alignment |
| ProductCard | Custom | 0px radius, square thumb. Hover: scale 1.05x + "Add to Cart" overlay. |
| Pagination | Custom | Page number buttons |

### Product Detail Page

| Component | Source | Notes |
|-----------|--------|-------|
| ProductGallery | Custom | Thumbnail strip + main image. Hover zoom via CSS transform. |
| SizeSelector | Custom + Radix RadioGroup | S/M/L/XL/XXL buttons |
| QuantitySelector | Custom | - / number / + controls |
| ProductTabs | Custom + Radix Tabs | Description, Size Guide, Shipping & Returns, Care Instructions |
| RelatedProducts | Custom | Horizontal scroll row of 4 ProductCards |

### Cart Page

| Component | Source | Notes |
|-----------|--------|-------|
| CartItem | Custom | Thumbnail, name, size, qty selector, price, remove button |
| CartSummary | Custom | Subtotal, delivery fee, total, checkout CTA |

### Checkout Page

| Component | Source | Notes |
|-----------|--------|-------|
| CheckoutForm | Custom | Shipping: Name, Phone, Email, Address, City, State |
| PaymentSelector | Custom + Radix RadioGroup | Card, Transfer, Pay on Delivery (disabled) |
| OrderSummary | Custom | Recap of cart items + totals |
| SuccessModal | Custom | Mock order confirmation overlay |

### Membership Page

| Component | Source | Notes |
|-----------|--------|-------|
| MembershipHero | Custom | Large editorial header |
| TierCards | Custom | 3 cards: Standard (free), Deluxe, Elite |
| FeatureComparison | Custom | Comparison table with check/x marks |
| MembershipFAQ | Custom + Radix Accordion | FAQ accordion |

### Custom Suit Request Page

| Component | Source | Notes |
|-----------|--------|-------|
| CustomSuitCTA | Custom | "Design Your Signature Piece" hero section |
| ChatModal | Custom + Radix Dialog | Floating chat interface: message, file upload (drag & drop), contact info, send button |

### Chat Modal (Reusable)

| Component | Source | Notes |
|-----------|--------|-------|
| ChatInterface | Custom | Message history, input field, file upload zone, send button |
| FileUploadZone | Custom | Drag & drop area, displays selected file name |

### Account/Profile Page

| Component | Source | Notes |
|-----------|--------|-------|
| AccountTabs | Custom + Radix Tabs | Orders, Membership, Addresses, Wishlist, Settings |
| OrderHistory | Custom | List of orders with status badges (Pending, Shipped, Delivered) |
| AddressManager | Custom | List of saved addresses, add/edit/remove |
| WishlistGrid | Custom | ProductCard grid for wishlisted items |
| SettingsForm | Custom | Name, email, password change form |

### Login/Signup Page

| Component | Source | Notes |
|-----------|--------|-------|
| AuthForm | Custom | Centered minimal form. Toggle between login/signup. |
| SocialAuthButtons | Custom | Google and Apple buttons (mock only, no real OAuth) |

### About Page

| Component | Source | Notes |
|-----------|--------|-------|
| AboutHero | Custom | Full-width editorial header image |
| BrandStory | Custom | Long-form text with full-width image breaks |
| FounderSection | Custom | Founder story with portrait |
| ValuesGrid | Custom | 3-4 brand values in grid |

### Returns & Exchange Page

| Component | Source | Notes |
|-----------|--------|-------|
| PolicyContent | Custom | Clean readable policy text |
| ReturnsFAQ | Custom + Radix Accordion | FAQ sections |
| ReturnModal | Custom + Radix Dialog | Initiate return form modal |

### Contact Page

| Component | Source | Notes |
|-----------|--------|-------|
| ContactForm | Custom | Name, email, subject, message |
| ContactInfo | Custom | Phone, email, Lagos address |
| StaticMap | Custom | Static Lagos map image (no live API) |

### 404 Page

| Component | Source | Notes |
|-----------|--------|-------|
| NotFound | Custom | Minimal on-brand 404 with return home link |

---

## Animation Implementation

| Animation | Library | Approach | Complexity |
|-----------|---------|----------|------------|
| InfiniteFabricPlane (FFD shader) | Three.js (raw) + GSAP | Custom WebGL: offscreen renderTarget, FFD vertex shader with cubicInOut deformation, GSAP tween loop for time uniform | **High** |
| RotatingCircularCarousel | Three.js (raw) | Dual concentric ring meshes with angle-based positioning, scroll-driven velocity rotation + cosine wave displacement | **High** |
| CurvedInfiniteCarousel | Three.js (raw) | CatmullRomCurve3 path, custom BufferGeometry from curve samples, vertex shader with sinusoidal deformation, scroll drives position | **High** |
| Text Selection Highlight Effect | Vanilla JS + CSS | Mouse drag event tracking, dynamically injected highlight spans with inverted color scheme | **Medium** |
| WebGL Horizontal Accordion | Three.js + GSAP | Image planes in row, GSAP timeline for width expansion/contraction on click, revealing text content | **Medium** |
| Page Transition (Diagonal Wipe) | Framer Motion | AnimatePresence on route change, black overlay with skewX transform animating across viewport | **Medium** |
| Navbar Scroll State | Lenis + CSS | Lenis scroll callback toggles transparent/solid class based on scroll position threshold | **Low** |
| Custom Cursor | rAF + CSS | requestAnimationFrame loop interpolating position toward mouse, CSS transitions for size/state changes | **Low** |
| Product Card Hover | CSS | transform: scale(1.05) on image, opacity fade-in for overlay button | **Low** |
| Horizontal Scroll Typography Band | GSAP ScrollTrigger | ScrollTrigger with scrub, translateX animation on giant text and thumbnail strip | **Medium** |
| Sticky Membership Cards | CSS position: sticky + backdrop-filter | Native sticky positioning, backdrop-filter: blur() on card backgrounds | **Low** |
| Mobile Menu Slide | Framer Motion | AnimatePresence, slide-in from right with opacity fade on backdrop | **Low** |
| Chat Modal Open/Close | Framer Motion | Scale + opacity spring animation | **Low** |
| Toast Notifications | Framer Motion + Radix | AnimatePresence, slide-in from bottom-right with auto-dismiss timer | **Low** |
| Image Gallery Hover Zoom | CSS | overflow: hidden container, transform: scale(1.5) on hover with transform-origin following mouse position | **Low** |
| Scroll-Triggered Fade-Ins | GSAP ScrollTrigger | Batch reveal: opacity 0→1 + translateY(30px)→0 on scroll into view | **Low** |
| Cart Item Add/Remove | Framer Motion | AnimatePresence, height collapse animation for remove | **Low** |
| Accordion Expand/Collapse | Radix + CSS | height animation via Radix Accordion primitive | **Low** |

---

## State & Logic Plan

### Global Store Architecture (Zustand)

**1. Cart Store** (`useCartStore`)
- **State**: `items: CartItem[]`, `isOpen: boolean`
- **Actions**: `addItem(product, size, qty)`, `removeItem(id)`, `updateQuantity(id, qty)`, `clearCart()`, `toggleCart()`, `openCart()`, `closeCart()`
- **Computed**: `totalItems`, `subtotal`, `total`
- **Persistence**: localStorage via persist middleware - cart survives page refresh
- **Currency**: All prices stored in kobo (integer), displayed as ₦ with `formatNaira(amount)` utility

**2. Auth Store** (`useAuthStore`)
- **State**: `user: User | null`, `isAuthenticated: boolean`, `membershipTier: 'standard' | 'deluxe' | 'elite'`
- **Actions**: `login(email, password)` → mock validation, `signup(data)` → mock create, `logout()`, `upgradeTier(tier)`
- **Persistence**: localStorage for user session
- **Mock Users**: Pre-defined mock users with different membership tiers for testing

**3. UI Store** (`useUIStore`)
- **State**: `isMobileMenuOpen`, `activeModal: 'chat' | 'return' | 'quickView' | null`, `toastQueue: Toast[]`, `isPageTransitioning`
- **Actions**: `openModal(type)`, `closeModal()`, `showToast(message, type)`, `dismissToast(id)`

**4. Shop Store** (`useShopStore`)
- **State**: `filters: { category, size, color, priceRange, fit }`, `sortBy: string`, `currentPage: number`, `viewMode: 'grid' | 'list'`
- **Actions**: `setFilter(key, value)`, `clearFilters()`, `setSort(sort)`, `setPage(page)`
- **Computed**: `filteredProducts`, `totalPages`

**5. Product Store** (`useProductStore`)
- **State**: `products: Product[]`, `selectedProduct: Product | null`, `wishlist: number[]`
- **Actions**: `fetchProducts()` (mock), `selectProduct(id)`, `toggleWishlist(id)`
- **Persistence**: wishlist in localStorage

### Data Flow

```
Mock Data (config.js with USE_MOCK switch)
  → Product Store / Auth Store
    → Component local state for forms
      → API calls when USE_MOCK = false
```

### Mock Data Toggle
- **Config**: `src/config/index.ts` exports `USE_MOCK: boolean` (reads from import.meta.env.VITE_USE_MOCK)
- **API Layer**: `src/lib/api.ts` - all data fetching functions. When USE_MOCK is true, returns mock data with setTimeout to simulate network delay. When false, makes fetch calls to backend endpoints.
- **Comment Header**: Every mock file has `"Toggle USE_MOCK = false in config.js to switch to live API calls"`

### Routing (React Router v7)

| Route | Page Component | Lazy Loaded |
|-------|---------------|-------------|
| `/` | HomePage | Yes |
| `/shop` | ShopPage | Yes |
| `/shop/:slug` | ProductDetailPage | Yes |
| `/cart` | CartPage | Yes |
| `/checkout` | CheckoutPage | Yes (protected) |
| `/membership` | MembershipPage | Yes |
| `/custom-request` | CustomSuitPage | Yes |
| `/account` | AccountPage | Yes (protected) |
| `/login` | LoginPage | Yes |
| `/about` | AboutPage | Yes |
| `/returns` | ReturnsPage | Yes |
| `/contact` | ContactPage | Yes |
| `*` | NotFoundPage | No |

### Route Guards
- `/checkout`: Redirects to `/login` if not authenticated
- `/account`: Redirects to `/login` if not authenticated
- `/custom-request`: Shows login prompt overlay if not Elite member
- `/login`: Redirects to `/account` if already authenticated

### Form Handling
- All forms use controlled components with local React state
- Validation: Native HTML5 validation + simple manual checks
- Checkout form: On submit → show loading state → show SuccessModal (mock)
- Contact form: On submit → show toast "Message sent successfully" (mock)
- Chat modal: On submit → append to message history → show "Your request has been submitted" toast (mock)
- Login/Signup: On submit → validate → update auth store → redirect

### Currency Formatting
- `formatNaira(amount: number): string` - formats kobo amount to `₦250,000`
- All prices stored in kobo (multiply by 100) to avoid floating-point issues
- Membership prices: Standard = 0, Deluxe = 15000/month, Elite = 50000/month

---

## WebGL Implementation Notes

### Raw Three.js vs R3F Decision

The design.md specifies complex custom shaders (FFD, CatmullRom curves, custom BufferGeometry) that require precise control over the render loop, render targets, and shader uniforms. These effects will be implemented using **raw Three.js** inside React components via `useRef` + `useEffect` for the canvas initialization, NOT via @react-three/fiber. Rationale:
- FFD shader requires manual renderTarget management
- CurvedInfiniteCarousel requires custom BufferGeometry construction
- Full control over the animation/render loop is needed

R3F will be used for simpler declarative 3D scenes only (if any).

### Canvas Lifecycle
- Each WebGL section (Hero, ProductsShowcase, ShopHero) has its own canvas element
- Canvases are initialized on mount via IntersectionObserver (lazy init)
- Proper cleanup on unmount: dispose geometries, materials, textures, renderer
- Resize handling via ResizeObserver on container element

### Performance Budget
- Max 3 simultaneous WebGL contexts (Hero, Showcase, Shop)
- Shop page unmounts Home page canvases on navigation
- Texture sizes: max 1024px for carousel images
- Video: 720p max, muted + playsInline attributes

---

## Responsive Strategy

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Hero: Full-screen video with centered text stack (HAVANAT above tagline)
- Navbar: Hamburger menu replaces inline nav, bespoke CTA becomes icon
- Custom Cursor: Disabled on touch devices
- Product Grid: 1 column on mobile, 2 on tablet+
- Filter Sidebar: Radix Sheet slide-in from left on mobile
- WebGL Carousels: Reduced image count (8 instead of 15), simplified shaders
- Typography: Scale down hero text to 8vw on mobile
- Touch gestures: Swipe for horizontal carousel, tap for accordion expand