# design.md

## Design Direction

This product is an internal business system for Guardiola Bridal, covering Product Lifecycle Management, inventory, materials, orders, CRM, and retailer resources.

The interface should feel like modern operational software with the visual DNA of Guardiola Bridal: contemporary fashion house, editorial restraint, warm minimalism, craftsmanship, and quiet luxury.

It should not feel like a generic SaaS dashboard, but it should also avoid becoming decorative or impractical. The goal is a balanced system: efficient for daily work, but refined enough to feel connected to the brand.

## Brand References

Guardiola Bridal’s public site presents the brand through collections, editorial imagery, refined typography, and language around made-to-measure, hand-crafted gowns, timeless aesthetics, sculpted bodices, layered textiles, and Mexican craftsmanship. The internal software should borrow this atmosphere without copying the website literally. ([GUARDIOLA BRIDAL](https://guardiolabridal.com/))

Core visual ideas:

- Contemporary bridal atelier
- Editorial but functional
- Warm ivory and soft neutrals
- Minimal, confident layouts
- Quiet luxury over decoration
- Precision, craftsmanship, and care
- Fashion house, not wedding cliché

## Design Principles

### 1. Editorial restraint

Important screens may use spacious layouts, elegant headings, and quiet hierarchy. Operational areas like tables, forms, and inventory views must remain dense enough to be useful.

Use editorial styling for:

- Page headers
- Empty states
- Product detail pages
- Collection/resource pages
- Key summary cards
- Important workflow moments

Avoid editorial excess in:

- Tables
- Forms
- Filters
- Inventory grids
- Order management screens

### 2. Warm minimalism

The UI should feel soft, calm, and premium. Prefer ivory, stone, bone, warm gray, muted taupe, and soft black.

Avoid:

- Pure white as the dominant feeling
- Harsh black borders
- Bright wedding pink
- Purple SaaS gradients
- Overly rounded playful components
- Loud shadows
- Generic blue enterprise UI

### 3. Operational clarity

This is daily-use internal software. Every interface must prioritize legibility, scanability, and speed.

Tables, forms, dialogs, and navigation should be boring in the best way: predictable, clean, and fast.

### 4. Brand without cosplay

Do not turn the app into a bridal website. No excessive florals, lace textures, romantic ornaments, script fonts, or decorative dividers.

The brand should appear through proportion, spacing, color, typography, and tone.

## Color System

Use a light-only theme.

Recommended color personality:

- Background: warm ivory
- Surface: soft white / bone
- Muted surface: stone / sand
- Border: light warm gray
- Text: soft black / charcoal
- Muted text: taupe gray
- Accent: deep espresso, muted champagne, or warm taupe
- Destructive: muted oxblood or restrained red
- Success: muted olive
- Warning: muted ochre

The system should feel warm, not sterile.

### Color usage rules

- Main backgrounds should be warm and soft.
- Cards should be subtly distinct from the background.
- Borders should be thin and quiet.
- Accent color should be used sparingly.
- Status colors should be elegant, never neon.
- Use contrast responsibly for accessibility.

## Typography

Use a two-font strategy.

### Editorial font

Use for:

- Main page titles
- Product names
- Collection names
- Hero-style headers
- Important empty states
- Resource portal feature headers

The editorial font should feel refined, fashion-oriented, and contemporary. It may be serif or high-contrast, but it must remain readable.

### UI font

Use for:

- Tables
- Forms
- Navigation
- Buttons
- Labels
- Tooltips
- Badges
- Dialog content
- Operational text

The UI font should be highly readable, neutral, and modern.

### Typography rules

- Page titles may feel editorial.
- Body text must feel practical.
- Labels should be precise and compact.
- Do not use all caps everywhere.
- Use letter spacing carefully, mainly for small labels or section markers.
- Avoid script fonts entirely.

## Layout

The app should use a persistent sidebar layout with a calm, structured content area.

### General page structure

Each screen should generally follow this structure:

1. Page header
2. Optional description or metadata
3. Primary actions
4. Main content area
5. Secondary panels, tables, cards, or forms

### Page headers

Page headers should carry the editorial feel.

They may include:

- Eyebrow label
- Large title
- Short description
- Primary action
- Optional metadata badges

Example hierarchy:

- Eyebrow: `Inventory`
- Title: `Materials`
- Description: `Track fabrics, trims, vendors, availability, and sourcing decisions.`

### Density

Use three density modes mentally:

- Editorial: generous spacing for landing/resource/product overview pages
- Balanced: default app pages
- Dense: tables, inventory, order lists, CRM views

Most screens should use balanced density.

## Components

This system currently uses:

- Badge
- Button
- Card
- Checkbox
- Dialog
- Dropdown Menu
- Form
- Input
- Label
- Select
- Separator
- Sheet
- Sidebar
- Skeleton
- Table
- Textarea
- Tooltip

## Component Guidelines

### Button

Buttons should feel precise and understated.

Use:

- Primary for one main action per section
- Secondary for supportive actions
- Ghost for navigation or low-emphasis actions
- Destructive only for irreversible actions

Avoid:

- Too many filled buttons
- Loud colors
- Oversized pill shapes
- Icon-only buttons without tooltips

### Card

Cards should feel like calm surfaces, not floating blocks.

Use cards for:

- Product summaries
- Material snapshots
- Order status
- CRM summaries
- Resource portal modules
- Empty states

Cards should use subtle borders and minimal shadow, if any.

### Badge

Badges are for status, category, priority, and lifecycle state.

Badge tone should be muted and elegant.

Examples:

- Draft
- In Production
- Waiting Materials
- Ready to Ship
- Low Stock
- Retail
- Showroom
- Archived

Avoid loud badge colors.

### Table

Tables are core to the system and must be extremely usable.

Table rules:

- Prioritize scanability.
- Keep row height practical.
- Use muted dividers.
- Align numbers and quantities clearly.
- Use badges for important statuses.
- Use dropdown menus for row actions.
- Avoid making tables overly editorial.
- Sticky headers may be used when helpful.
- Empty tables should have refined empty states.

### Form

Forms should feel structured and calm.

Use:

- Clear labels
- Short helper text when needed
- Logical grouping
- Section separators for long forms
- Dialogs for quick edits
- Full pages or sheets for complex creation flows

Avoid:

- Placeholder-only labels
- Overly long forms inside small dialogs
- Unclear required fields

### Dialog

Use dialogs for focused decisions or small edits.

Good uses:

- Confirm delete
- Quick edit
- Add small item
- Change status
- Assign owner

Bad uses:

- Full product creation
- Long BOM editing
- Complex order flows

### Sheet

Use sheets for contextual workflows that support the current screen.

Good uses:

- View material details from a table
- Edit order metadata
- Review customer/contact profile
- Inspect product/BOM information

Sheets should feel practical, not dramatic.

### Sidebar

The sidebar should be persistent, calm, and brand-aligned.

Recommended sections:

- Home
- Products
- Materials
- Inventory
- BOMs
- Orders
- CRM
- Retail Portal
- Vendors
- Reports
- Settings

Sidebar behavior:

- Highlight the active section.
- Keep labels clear.
- Avoid excessive nesting.
- Use icons only if they improve scanning.
- Do not make the sidebar visually heavy.

### Skeleton

Skeletons should be subtle and warm-toned.

Avoid flashy shimmer effects.

### Tooltip

Tooltips should be short and useful.

Use them for:

- Icon-only actions
- Abbreviations
- Risky actions
- Operational clarifications

## Status Language

Use clear operational language.

Good:

- `Waiting on fabric`
- `Ready for cutting`
- `In production`
- `Needs review`
- `Ready to ship`
- `Archived`

Avoid vague labels:

- `Active`
- `Pending`
- `Processing`
- `Done`

Unless the context makes them very clear.

## Voice and Microcopy

The system voice should be calm, precise, and confident.

It should not sound cute, overly luxurious, or robotic.

Good:

- `No materials found.`
- `Create the first material to start building BOMs.`
- `This order is missing required measurements.`
- `Low stock may affect upcoming production.`

Avoid:

- `Oopsie!`
- `Something magical went wrong.`
- `Your bridal journey begins here.`
- `Unlock your dreams.`

This is internal software. Keep it elegant, not cheesy.

## Visual Anti-Patterns

Do not use:

- Bright pink bridal styling
- Decorative lace backgrounds
- Script fonts
- Heavy gradients
- Harsh pure black and pure white contrast
- Generic blue SaaS defaults
- Excessive shadows
- Overly playful rounded components
- Cluttered dashboards
- Random icon decoration
- Marketing copy inside operational workflows

## Implementation Guidance for Codex

When creating new screens or components:

1. Prefer existing shadcn components.
2. Use the defined visual direction before inventing new styles.
3. Keep operational flows efficient.
4. Use editorial treatment only where hierarchy benefits from it.
5. Maintain light-only styling.
6. Use warm neutral surfaces and quiet borders.
7. Keep tables practical and readable.
8. Avoid decorative bridal clichés.
9. Prioritize consistency over novelty.
10. When in doubt, choose calm, precise, and refined.

## Target Feeling

The app should feel like a private operating system for a contemporary bridal fashion house.

Not Shopify.
Not Notion.
Not a wedding blog.
Not an enterprise ERP from 2009.

A calm, sharp, editorial operations system for Guardiola Bridal.
