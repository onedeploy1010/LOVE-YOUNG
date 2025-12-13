# LOVEYOUNG Design Guidelines
Premium Bird's Nest & Fish Maw E-commerce Website

## Design Approach
**Reference-Based**: Drawing inspiration from luxury food e-commerce (premium tea brands, high-end supplement sites) and Asian wellness brands. Focus on clean elegance, trust-building, and product showcase excellence with mobile-first responsive design.

## Core Design Principles
1. **Premium Simplicity**: Clean, uncluttered layouts that convey luxury and trust
2. **Product-Centric**: Hero imagery and product photography drive the experience
3. **Mobile-First**: Touch-optimized interfaces with generous tap targets
4. **Cultural Authenticity**: Respect for Chinese wellness traditions through refined aesthetics

## Typography
- **Primary Font**: Noto Sans SC (Google Fonts) - excellent Chinese character rendering
- **Secondary/Accent**: Playfair Display for English headings - adds elegance
- **Hierarchy**:
  - H1: 3xl/4xl (mobile/desktop), font-bold
  - H2: 2xl/3xl, font-semibold
  - H3: xl/2xl, font-medium
  - Body: base/lg, font-normal
  - Small/Meta: sm, font-light

## Layout System
**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24, 32 for consistency
- Mobile: py-12 to py-16 for sections
- Desktop: py-20 to py-32 for sections
- Component spacing: gap-6, gap-8 primarily
- Container: max-w-7xl with px-4 md:px-6 lg:px-8

## Landing Page Structure

### Hero Section (80vh minimum)
Large background hero image showcasing premium bird's nest product in elegant presentation with soft focus background
- Centered headline and subheadline
- Two prominent CTAs: "浏览产品" (Browse Products) + WhatsApp consultation button with blur background overlay
- Trust indicators below CTAs: "100% 天然" "每日鲜炖" "冷链配送"

### Product Showcase (3-column grid on desktop, 1-column mobile)
High-quality product photography cards with:
- Image (4:3 aspect ratio)
- Product name in Chinese
- Short description (2-3 lines)
- Price range
- "查看详情" button

### Benefits Section (2-column split: image left, content right)
Professional lifestyle/product preparation photography
- Icon-free benefit list with bold headings
- Emphasize freshness, quality, traditional preparation methods

### How to Order Section
Visual step-by-step guide (3 steps horizontal on desktop, vertical on mobile):
1. WhatsApp咨询 (with WhatsApp icon)
2. Meta店铺下单 (with shopping icon)
3. 冷链送达 (with delivery icon)
Each step: large icon, heading, description

### Social Proof Section
Customer testimonials (2-3 column grid):
- Profile image placeholder
- Quote in Chinese
- Customer name and purchase type

### Contact/CTA Footer Banner
Full-width section with product photography background:
- Large heading: "立即订购新鲜燕窝"
- Dual CTA buttons: Meta店铺 + WhatsApp联系
- Business hours and delivery info below

## Component Library

### Navigation
- Sticky header on scroll
- Mobile: Hamburger menu with slide-out drawer
- Desktop: Horizontal menu with logo left, links center, CTA buttons right
- WhatsApp floating action button (fixed bottom-right on mobile)

### Buttons
- Primary: Rounded-lg, px-8 py-3, font-medium, text-base
- Secondary: Same size, outline style
- Icon buttons: Rounded-full, p-3, with icon-only
- Blur background for buttons on images

### Product Cards
- Rounded-xl with subtle shadow
- Image with aspect-ratio-4/3 object-cover
- Padding p-6 for content area
- Hover: Gentle lift effect (translate-y-1 transition)

### Forms (Contact/Newsletter)
- Rounded-lg inputs with border
- Generous padding: py-3 px-4
- Focus: Ring treatment
- Mobile: Full-width inputs
- Desktop: Inline layout where appropriate

## Images Strategy

### Required Images:
1. **Hero**: Premium bird's nest in elegant bowl/presentation, soft-focused luxury setting
2. **Product Photos**: 3-4 high-quality product shots (bird's nest, fish maw, prepared dishes)
3. **Lifestyle**: Person enjoying the product or preparation process
4. **Process**: Traditional preparation or sourcing imagery
5. **Testimonial Avatars**: Customer photo placeholders

### Image Treatment:
- High resolution, professionally styled
- Consistent aesthetic: clean, premium, wellness-focused
- Rounded corners: rounded-xl for product images, rounded-2xl for hero
- Aspect ratios: 4:3 for products, 16:9 for lifestyle, 1:1 for testimonials

## Mobile Optimization
- Touch targets: Minimum 44x44px (p-3 for icon buttons)
- Generous whitespace: Double mobile spacing for better scrolling
- Sticky WhatsApp floating button (bottom-right, z-50)
- Collapsible sections for long content
- Single column layouts exclusively on mobile
- Larger font sizes for readability (text-base minimum)

## Integration Elements

### WhatsApp Integration
- Floating action button: Green (#25D366 equivalent), rounded-full, shadow-lg
- Click-to-chat links throughout with WhatsApp icon
- Auto-reply indicator: "自动回复24小时内响应"

### Meta Shop Integration
- Prominent "Meta店铺" buttons with shopping bag icon
- Visual indication of external link
- "在Meta店铺下单" call-to-action sections

## Animations
Use sparingly:
- Smooth scroll behavior
- Gentle fade-in on scroll for product cards
- Hover lift on cards (translate + shadow)
- No distracting animations

This creates a premium, trustworthy, mobile-optimized experience that showcases LOVEYOUNG's high-quality bird's nest and fish maw products while facilitating easy ordering through WhatsApp and Meta shop.