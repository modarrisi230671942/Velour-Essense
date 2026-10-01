# Velour Essence - Full Site Documentation

A complete reference to every feature, screen, and system in the Velour Essence site. It covers `index.html` (the entire front-end app) and `backend.js` (the data layer), plus the Supabase SQL files that back them.

---

## 0. How to read this document

Every feature below carries a status so you can see at a glance what really works.

| Status | Meaning |
|---|---|
| ✅ **Functional** | Works end-to-end as described. |
| 🧪 **Simulated / demo** | Works as a demonstration of the flow, but is not connected to a real external service (or uses a stand-in value). |
| ⚠️ **Partial / known issue** | Works, but with a limitation or quirk you should know about (details given). |
| ❌ **Not functional** | The UI exists but does nothing real. |

**How statuses were determined:** the app was run in a headless browser against the local IndexedDB database and every screen and flow was exercised (browsing, filtering, searching, blending, quiz, cart, vouchers, registration, OTP, checkout, order tracking, wishlist, reviews, returns, VIP modal, all footer pages, accessibility settings on desktop and mobile widths). Two things depend on the live network and your own service accounts and could **not** be confirmed in that environment: the **Supabase cloud database** and **real EmailJS email delivery** (both are marked "needs live check" below). Test one real order and one real sign-in on your deployed site to confirm them.

### Feature status at a glance

| Area | Feature | Status |
|---|---|---|
| Chrome | Promo bar, header nav, cart badge, mobile menu, footer, toasts | ✅ |
| Chrome | Accessibility button (next to cart) with colour-vision + text-size slider | ✅ |
| Home | Hero carousel, tier cards, mood grid, guarantee callout | ✅ |
| Home | **About Us** section with one dropdown per company page | ✅ |
| Studio | Blend sliders, presets, size selector, live bottle, pyramid | ✅ |
| Studio | Save formula / load / reorder | ✅ |
| Studio | Personalize (engraved bottle) | ✅ |
| Studio | Scent Matcher quiz | ✅ |
| House | 9 products, filters, live search, wishlist, reviews | ✅ |
| Discovery | 2 kits with voucher callout, wishlist | ✅ |
| Cart | Quantity stepper, remove, delivery form, order summary | ✅ |
| Cart | Voucher codes | ⚠️ (see §8) |
| Cart | Payment methods (PayFast / PayFlex / Apple Pay) | 🧪 cosmetic only |
| Checkout | Place order → database → tracker | ✅ |
| Checkout | Order confirmation email | ✅ needs live check |
| Tracker | 4-stage order status from the real order record | ✅ |
| Tracker | "Track My Order Live" courier map | 🧪 |
| Account | Register / sign in (valid email required) | ✅ |
| Account | OTP verification step | 🧪 fixed code `0000` (see §10) |
| Account | Profile, orders, wishlist, saved formulas, sign out | ✅ |
| Account | "Order Received" button | ⚠️ (see §10.2) |
| Returns | Book a return, `returns` row, status sync | ✅ |
| VIP | Subscribe modal, generated voucher, auto-apply | ✅ |
| Footer pages | 10 content pages, dynamically dated legal pages | ✅ |
| Forms | Contact Us form, Wholesale Enquiry form | ❌ show a thank-you toast only |
| Social | Instagram / Facebook / TikTok / Pinterest buttons | ⚠️ open each platform's homepage |
| Data | IndexedDB offline fallback | ✅ |
| Data | Supabase cloud database + realtime | ✅ needs live check |

---

## 1. What this is

Velour Essence is a single-page fragrance e-commerce site built as **one self-contained HTML file** (`index.html`) plus **one data-layer script** (`backend.js`). There is no build step, no framework, and no server-rendered pages — the whole thing is vanilla JavaScript rendering strings of HTML into a `<main id="main">` element based on a global `state` object.

**Brand concept:** a Cape Town-based custom-perfumery atelier ("affordable luxury") selling three kinds of products:
1. A **House Collection** of 9 ready-made signature scents
2. A **Studio** where customers blend their own top/heart/base ratios
3. **Discovery Kits** — sample packs whose price comes back as a voucher

**Currency:** South African Rand (R). **Fulfilment story:** every order is "custom-mixed" in Cape Town, with a multi-stage formulation pipeline visible in the Lab Tracker.

---

## 2. Architecture & tech stack

| Layer | Technology |
|---|---|
| UI rendering | Vanilla JS, template-literal HTML strings re-injected into `#main` on every state change (`renderScreen()`) |
| Styling | A single `<style>` block using CSS custom properties (`:root` variables) for the brand palette |
| Fonts | Google Fonts — Cinzel (headings/wordmark) + Plus Jakarta Sans (body) |
| Database | **Supabase** (hosted Postgres + realtime) as primary, with a **full IndexedDB fallback** so the app still works offline / when Supabase is unreachable |
| Email | **EmailJS** (client-side email sending, no backend needed) — order confirmations and OTP codes |
| Maps | An embedded OpenStreetMap iframe (no API key) for the "live courier tracking" stand-in |
| Graphics | Hand-written inline SVG (perfume bottles, mood icons, brand crest, accessibility icon) — no chart/graphics library |

**No React, no bundler, no npm build.** `index.html` loads three scripts via `<script src>` tags (Supabase JS SDK and EmailJS SDK from a CDN, and the local `backend.js`), then one large inline `<script>` block containing all app logic. `index.html` is about 3,750 lines; `backend.js` is about 770.

> There is **no text-to-speech**. It was removed from the site entirely.

### Dual-database design (the key architectural idea)

Every data method in `backend.js` (`getProducts`, `createOrder`, `login`, etc.) follows the same pattern:

```
1. If Supabase is configured and reachable → try the Supabase call first.
2. On any failure, or if Supabase isn't reachable → fall back to IndexedDB
   (a local browser database), which is seeded with the same demo data
   the first time the app runs.
3. Successful Supabase writes are also mirrored into IndexedDB, so the
   local cache stays warm.
```

`backend.js` ships with a Supabase project URL and publishable key in `SUPABASE_CONFIG` (they can be overridden via `localStorage` keys `velour_supabase_url` / `velour_supabase_key`). If the Supabase SDK can't load or the project can't be reached, the site runs entirely on IndexedDB, so opening `index.html` with no network still works — browsing, accounts, cart, checkout, reviews, wishlist and returns all function locally.

**Realtime (Supabase only):** `setupRealtimeSubscriptions` listens for changes to the `orders` and `reviews` tables and, when one arrives, shows a toast and re-renders the current screen — e.g. an order status edited elsewhere appears live in the customer's Lab Tracker. In IndexedDB-only mode there is no cross-tab/cross-device realtime.

⚠️ **One thing to know:** if a Supabase write fails, the app silently falls back to saving locally, and the customer still sees a normal success message. That order then exists only in that browser until synced.

---

## 3. Global site chrome (present on every page)

- **Promo bar** — a dismissible top banner ("Free 2ml sample… 100% refund!") with a "Get 15% Off VIP Voucher" button. Dismissal is remembered for the browser session (`sessionStorage`).
- **Header** — brand crest, wordmark, a pill-style nav (`Home / Studio / House / Discovery / Account`), an **Accessibility button** and a **cart icon** (with a live item-count badge) on the right, and a hamburger menu on mobile. A **Lab Tracker** pill appears in the nav only while you are viewing an order's tracker.
- **Accessibility button** — a bold stick-figure icon directly left of the cart. It opens a dropdown panel (see Section 12). The panel closes on an outside click, the ✕ button, or the Escape key.
- **Footer** (every screen) — brand mark, social buttons (Instagram / Facebook / TikTok / Pinterest — each opens that platform's homepage, not a Velour Essence profile), a **Customer Care** column (My Account, Track My Order, Shipping & Returns, FAQs, Contact Us), and a legal row (Privacy Policy / Terms of Service / Accessibility). The former "Company" column was moved into the Home page's **About Us** section.
- **Floating VIP button** — appears only while inside the Studio flow (Blend / Personalize / Match), opening the 15% voucher popup.
- **Toast notifications** — a shared `toast(msg, ms)` helper used for confirmations and errors, auto-dismissing.
- **Mobile nav** — a dropdown panel version of the main nav, closes on outside click or Escape.
- **Cookie-consent banner** — shown until the visitor chooses Accept or Reject (stored in `localStorage` as `velour_cookie_consent`). **Rejecting cookies still lets people browse, but blocks sign-in and registration** (they are prompted to accept first).

---

## 4. Home page

- **Hero section** with a rotating **bottle carousel** (`HERO_SHOWCASE`): 4 featured scents (Golden Aura, Velour Noir, Citrus Bloom, Havana Nights), each with its own SVG liquid-colour gradient. Prev/next controls update a caption with the tag/name/description of the centred bottle. ✅
- **Guarantee callout** — explains the two ways to "try before you buy" (Discovery Kit refunded as a voucher, or a full bottle's included 2ml sample). ✅
- **"Choose a size" tier cards** — 30ml / 50ml / 100ml at R300 / R400 / R500. The 50ml card ("Flagship Bottle") is visually highlighted with a gold border; there is **no "Most Popular" text label**. Clicking any card opens the Studio. ✅
- **"Shop by mood" mood grid** — three large icon cards (House Collection / The Studio / Discovery Kits) linking into each flow. The icons are bold, solid-fill SVGs in 76px circles, designed to stay readable for low-vision users. ✅
- **About Us** (replaces the old on-page accessibility section) — a "Company" heading with four collapsible dropdowns: **Our Story, Sustainability, Careers, Wholesale Enquiries**. Each dropdown shows that page's intro line and content; open/closed state is remembered while you stay on the site. ✅ The Wholesale dropdown contains an enquiry form that does not actually send anything (see Section 15).

---

## 5. The Studio — custom fragrance blending

Reached via the `Studio` nav tab, which has 3 sub-tabs: **Blend / Personalize / Match**.

### 5.1 Blend (`state.screen === 'studio'`) ✅
- Three **sliders** (10–60% each) for **Top / Heart / Base** accord percentages, each with a live numeric readout.
- Four **one-click presets** (`STUDIO_PRESETS`): Velvet Oud (Woody), Golden Sunset (Amber), Capri Breeze (Fresh), Bourbon Vanilla (Gourmand) — each sets all three sliders at once.
- A **size selector** (30ml / 50ml / 100ml) that changes both price and the liquid fill level in the bottle preview.
- A **"Volatility Curve & Olfactory Progression" pyramid** — three bar-fills mirroring the slider percentages, labelled with perfumery timing (0–30 mins / 30 mins–4 hrs / 4–16 hrs drydown).
- A **live SVG bottle preview** whose liquid colour is a real-time blend of three accord colours according to the slider ratios, and whose fill height changes with bottle size.
- **"Save Formula"** — prompts for a name and stores the top/heart/base/size/price combination (`VelourDB.saveFormula`). It works whether or not you are signed in; saved blends appear in Account → Profile for signed-in users.
- **"Add Custom Bottle to Cart"** — adds the current blend at the size-based price. **Requires being signed in** (guests get the "Login Required" modal).
- **Saved Formulations list** — shown once the user has any, each with "Load" (restores it into the sliders) and "Order R{price}" (adds it to the cart).

### 5.2 Personalize (`state.screen === 'personalize'`) ✅
- Engraving/label editor: a "Fragrance Title" (max 22 chars, auto-uppercased) and a "Subtitle / Year / Dedicated To" (max 32 chars), both updating live on an SVG bottle-label preview.
- "Add Engraved Bottle" adds a fixed R450 custom-engraved 50ml bottle to the cart (sign-in required).

### 5.3 Match — the Scent Matcher quiz (`state.screen === 'matcher'`) ✅
- A **3-question quiz** with a segmented progress bar: mood atmosphere, when you wear fragrance, and a reference scent you already like.
- On completion it shows **two distinct recommended products side by side**:
  - **Primary match** — from the "reference scent" answer (`MATCH_RESULTS`), mapping real-world comparisons (Tom Ford Oud Wood, Baccarat Rouge 540, Chanel Chance, Tom Ford Tobacco Vanille) to the four original House scents.
  - **Secondary match** — from the "mood" answer (`SECONDARY_MATCH_RESULTS`), always drawn from the four newer House additions (Emerald Vetiver, Rose Élysée, Coastal Neroli, Spiced Chai), so the two recommendations are never the same product.
- Each result card has "Add to Cart" and "Fine-Tune in Studio" (loads that scent's top/heart/base ratios into the Blend sliders).
- A **"↻ Restart Quiz"** button resets the quiz.

---

## 6. House Collection (`state.screen === 'house'`) ✅

**9 ready-made fragrances:** Velour Noir, Golden Aura, Citrus Bloom, Santorini Sunset, Havana Nights, Emerald Vetiver, Rose Élysée, Coastal Neroli, Spiced Chai.

- **Filter pills**: All Scents / 🌲 Woody & Smokey / ✨ Amber & Floral / 🍊 Fresh Citrus / 🥃 Gourmand & Spiced — match keywords against each product's `accord_vibe` field.
- **Live search box** — matches against name, "if you like" reference, and top notes (it does not search heart/base notes). The box keeps focus while you type.
- Each **product card** shows: name, scent-family tag, an "If you like: [comparable brand]" line, longevity (⏱️) and sillage (💨) stats, the full top/heart/base notes, price, and an **"Add to Cart"** button (every bottle includes a free 2ml sample, noted in the cart line item).
- **Wishlist heart** (♥/♡) on every card — saved per user via `VelourDB.addToWishlist` / `removeFromWishlist`, visible in Account → Profile → My Wishlist. Requires sign-in (guests get the "Login Required" modal).
- **Reviews on every card**: review count and star rating, the first 2 reviews inline, and a collapsible **"Write a Review"** form (name optional, star rating 3–5, comment required) that posts via `VelourDB.addReview` and appears immediately. Writing a review does **not** require sign-in.

---

## 7. Discovery Kits (`state.screen === 'discovery'`) ✅

Two sample-pack products (House Discovery Set R180, Atelier Custom Sample Pack R220), each marketed with a **voucher callout** ("Includes R180/R220 voucher inside! (Kit becomes FREE)"). Same wishlist-heart and add-to-cart behaviour as the House Collection. The voucher itself is marketing copy tied to the voucher system in Section 8 (see the note there).

---

## 8. Cart & Checkout (`state.screen === 'cart'`)

A single combined cart + checkout page (no multi-step flow). **Adding anything to the cart requires being signed in.**

- **Item list** ✅ with a quantity stepper (+/−) and remove (×) per line; subtotal and total update live.
- **Delivery Details** form ✅: name, email, street address, city — kept in `state.checkout` and pre-filled from the signed-in account (reset if the signed-in account changes).
- **Payment method selector** 🧪 — PayFast/Ozow (card, debit, instant EFT), PayFlex (shows the calculated 4-instalment amount), Apple Pay / Google Pay. **No real payment is taken** — this is a demo checkout; the choice is simply recorded on the order.
- **Voucher/promo code box** ⚠️ — validated via `VelourDB.validateVoucher`:
  - `VELOUR15` / `VIP15` → 15% off.
  - Any code that **starts with `VELOUR-` and ends with `OFF`** (e.g. `VELOUR-50OFF`) → a flat R amount equal to the digits in the code (R50 if no digits), capped at the subtotal. *This pattern is not checked against a list, so any code of that shape is accepted* — including codes generated for VIP subscribers, which therefore apply as a flat R amount when typed in manually.
  - `FREESHIP` → accepted and shows a "free express shipping" message, but changes no price (courier delivery is already free).
  - Codes saved in the `subscribers` table that do not match the `VELOUR-…OFF` pattern → 15% off.
  - Anything else → "Invalid or expired voucher code."
  - **Known quirk:** the discount amount is calculated when the voucher is applied and is **not recalculated** if you then change quantities (it is cleared only when the cart is emptied). Re-apply the voucher after editing the cart.
- **Order summary** ✅ — subtotal, discount line (if any), "Courier Delivery: FREE", and total.
- **"Confirm & Place Order"** ✅ — requires being signed in (otherwise the "Login Required" modal opens); validates that name and address are filled; on success:
  1. Creates the order via `VelourDB.createOrder` (auto-generates a code like `VE-4821`; status starts as `received`).
  2. Clears the cart and any applied voucher.
  3. Sends an **order confirmation email** via EmailJS (Section 14).
  4. Redirects straight into the Lab Tracker for that order.
  - Order codes are `VE-` plus four random digits, so two orders can occasionally receive the same code.

---

## 9. Lab Tracker (`state.screen === 'tracker'`)

A 4-stage order-status pipeline styled as a "formulation lab" feed ✅:

1. **Order Confirmed & Formulation Queued** (`received`)
2. **Formulating Master Oils in Lab** (`formulating`)
3. **Bottling & Quality Control** (`bottling`)
4. **Dispatched / Delivered** (`dispatched` → `delivered`)

- Shows the customer's most recent order by default, or a specific order when opened from Account → Orders. An **admin** (`role === 'admin'`) sees *all* orders, not just their own.
- Full order detail: customer name, delivery destination, payment method, placed date/time, itemised batch contents, total.
- **"Track My Order Live (Beta)" button** 🧪 — a **simulated courier-tracking demo**:
  - It starts a client-side timer that advances the *displayed* status every 3–5 seconds up to `dispatched` (it never shows `delivered`; that only ever comes from the real order record).
  - Once the simulated status reaches `dispatched`, an **embedded OpenStreetMap iframe** appears centred on a fixed Claremont, Cape Town coordinate as an "approximate courier location" — it is not real GPS.
  - It never writes to the database or changes the order's real status, and it pauses if you navigate away and resumes when you return to the tracker.
  - The map requires internet access (it is an OpenStreetMap embed).

---

## 10. Account (`state.screen === 'account'`)

### 10.1 Signed-out state — Sign In / Register / Verify

**A valid email address is required for both signing in and registering.** The email must be well-formed (`name@domain.tld` — for example `a@b` or `not-an-email` are rejected with a message). Registration additionally requires a full name and password (phone is optional), and an email that already has an account is rejected. Sign-in requires an email and password matching an existing account. Cookies must be accepted first (Section 3).

- **Sign In** tab: email + password → `VelourDB.login`.
- **Register** tab: full name, email, phone, password → `VelourDB.register`. The account is created at this step, before the code is entered.
- **Both flows then require a One-Time-Password (OTP) step** before a session is established:
  1. Credentials are checked (or the account is created) and a "pending user" is returned; nothing is signed in yet.
  2. A 4-digit code is emailed via EmailJS (`sendLoginOtpEmail` — the same function and template for both login and registration).
  3. The screen swaps to a "Verification Code" input; navigating elsewhere on the site is blocked until the code is entered.
  4. Entering the correct code calls `VelourDB.completeLogin`, which establishes the real session. Wording adapts ("Verify Your New Account" vs "Enter Your Login Code").
  5. A "Resend Code" link re-sends the email.
- 🧪 **Important caveat — the OTP is a demo stand-in.** The code is the fixed value `0000` (`LOGIN_OTP_CODE`) for everyone, and if the email cannot be sent the app displays the code on screen so the demo can continue. This means the flow and the email are real, but **the email address is not proven to belong to the person signing in**: requiring a *validly formatted* email does not verify it is deliverable or owned by the user. A production version would generate a random, expiring code server-side.
- ⚠️ **Passwords are stored as plain text** in the `password_hash` column — acceptable for a demo, not for production.

### 10.2 Signed-in state ✅
- **Profile tab**: welcome header with role badge, a stats strip (orders placed, total spent, wishlist item count, registration date), a **Saved Custom Formulations** panel (Load / Order buttons), and a **My Wishlist** panel (Add to Cart / Remove per item).
- **Orders tab**: every past order as a card with order code, status pill, date, total, and:
  - **"Track Status"** → opens the Lab Tracker for that order.
  - **"Order Received" / "✓ Order Received"** ⚠️ → lets the customer confirm receipt (`handleMarkReceived`, sets status to `delivered`). *Quirk:* the button is still offered on an order whose return has been requested, and clicking it overwrites the `return_requested` status.
  - **"Have an issue? Book a Return"** → opens the Return Request modal (Section 11), or shows a disabled "Return Requested" indicator if one is already in progress.
  - A **"View Return Policy"** button linking to the Shipping & Returns page.
- **Sign Out** button (clears the session).

A built-in **admin account** exists in the seed data: `admin@velouressence.co.za` / `admin123`. Its `admin` role only changes what the Lab Tracker shows (all orders); there is no separate admin dashboard.

---

## 11. Returns ✅

- **"Book a Return" modal**: reason dropdown (Changed my mind / Fragrance not as described / Item arrived damaged / Wrong item received / Other) + an optional details box, plus a link to the Return Policy.
- Submitting calls `VelourDB.createReturnRequest`, which:
  - Inserts a row into a dedicated **`returns`** table (order id, order code, customer name/email, reason, details, status) — in Supabase if reachable, or the local `returns` IndexedDB store otherwise.
  - Flips the parent order's status to `return_requested` (in Supabase this is also enforced by a Postgres trigger).
  - The order then shows a "Return Requested" pill in Account → Orders and the Lab Tracker, and the return button becomes a disabled indicator.
- The SQL for this table (with RLS policy and sync trigger) lives in `supabase_returns_table.sql`.

---

## 12. Accessibility features

Both settings live in the **Accessibility panel**, opened from the **accessibility button beside the cart** in the header (available on every page). Each choice is remembered per browser via `localStorage`.

### 12.1 Colour Vision Settings ✅
Five modes (Standard / Protanopia / Deuteranopia / Tritanopia / Monochromacy), applied as a CSS `filter` on the whole page (`applyColorVisionMode`). Protanopia, Deuteranopia and Tritanopia use SVG colour-matrix filters; Monochromacy uses a CSS greyscale filter.

### 12.2 Text Size slider ✅
A **slider** from **Smallest** (left) to **Biggest** (right):
- Range **85% – 150%** in 5% steps; **100% is the default**. A live "Current size" percentage is shown and a **Reset** link returns to 100%.
- The whole site resizes live as you drag, using CSS `zoom` on `<html>` (with a `transform: scale()` fallback for browsers without `zoom`, e.g. older Firefox).
- The choice is saved on release (and on keyboard steps) under `velour_text_size`. Sizes saved by the older 3-button control (Normal / Large / Extra Large) are carried over as 100% / 115% / 130%.
- The panel keeps a constant on-screen size while the page scales so the slider stays steady under the cursor. At the largest sizes on phones the logo emblem is hidden and the header re-flows so the buttons never cover the brand name.

The panel also links to the Contact Us page for reporting accessibility problems. The full public-facing **Accessibility Statement** is the footer page described in Section 15.

---

## 13. VIP / Newsletter subscription ✅

- **"Get 15% Off VIP Voucher"** (promo bar) and **"VIP Specials"** (floating button, Studio pages only) open the same subscribe modal.
- The email must be a valid address (`name@domain.tld`). `VelourDB.subscribeNewsletter` then generates a random voucher code (`VELOUR-{10–99}OFF`) and stores it against that email (Supabase `subscribers` table, upserted by email, or IndexedDB fallback).
- The modal reveals the code and **auto-applies a 15% discount** to the cart (15% of the current subtotal, or R60 if the cart is empty at that moment). See the voucher quirks in Section 8 — the same code typed manually later is read as a flat R amount instead.
- 🧪 The modal also contains a **"🎲 Simulate New Subscribe"** button (`simulateNewUserSubscribe`) that fills in a random realistic-looking name/email and runs the same flow. It is a demo/testing helper and is visible to everyone; remove it before a public launch.

---

## 14. Email system (EmailJS)

Two EmailJS template configurations are wired in (both currently use the same EmailJS service id, with separate templates):

1. **Order confirmation email** (`sendOrderConfirmationEmail`) ✅ *needs live check* — fires right after an order is placed. Includes order code, itemised contents, total, status, and date. It degrades gracefully: if EmailJS fails to load, isn't configured, or no recipient address is found, the order still completes and the customer sees a toast explaining that the email specifically didn't go out.
2. **OTP verification email** (`sendLoginOtpEmail`) 🧪 — used for both Sign In and Register (Section 10.1). The email contains the fixed code `0000`.

Both are entirely client-side (no backend needed), so they work from a static file — but they need internet access and valid EmailJS credentials/templates to deliver.

---

## 15. Footer / company / legal pages (`FOOTER_PAGES`)

Ten content pages rendered with a consistent header/eyebrow/title pattern. The footer links to the Customer Care and legal pages; the four **Company** pages are shown on the Home page inside **About Us** (their standalone routes still exist in code but nothing links to them).

| Page | Reachable from | Status / highlights |
|---|---|---|
| Shipping & Returns | Footer, Account | ✅ Formulation + transit timeframes, 14-day 100% refund guarantee |
| FAQs | Footer | ✅ 5 common questions (formulation, delivery, returns, longevity, and more) |
| Contact Us | Footer | ❌ Shows contact details and a form (name/email/message) — **the form does not send or store anything**; the button only shows a thank-you toast |
| Our Story | Home → About Us | ✅ Brand origin narrative |
| Sustainability | Home → About Us | ✅ Made-to-order/low-waste positioning |
| Careers | Home → About Us | ✅ "No roles listed, but reach out" messaging |
| Wholesale Enquiries | Home → About Us | ❌ Business-name + email form — **does not send or store anything**; shows a thank-you toast only |
| Privacy Policy | Footer | ✅ Dated dynamically to the current month/year |
| Terms of Service | Footer | ✅ Dynamically dated |
| Accessibility Statement | Footer | ✅ WCAG 2.1 AA aspiration, known limitations, feedback channel |

---

## 16. Data model - what's actually stored

### Supabase tables (primary, when reachable)
| Table | Purpose |
|---|---|
| `products` | House Collection + Discovery Kit items (notes, pricing, stock, rating, longevity, sillage, `accord_vibe` for filtering) |
| `orders` | Every placed order — customer/delivery info, payment method, items (JSON), status, voucher used |
| `returns` | Return requests, linked to `orders`, with a trigger that syncs the parent order's status |
| `users` | Accounts — email, password (**plain text** in the `password_hash` column — demo only), full name, phone, `role` (`customer` or `admin`) |
| `reviews` | Product reviews — name, rating, comment, verified flag, linked by `product_key` |
| `formulas` | Saved custom Studio blends |
| `subscribers` | VIP signups with their generated discount code |
| `wishlist` | Per-user saved products |

### IndexedDB (local fallback, always present)
A mirrored local database (`VelourEssenceDB`, version 3) with the same 8 object stores, auto-seeded the first time the app runs with: **11 products** (the 9 House Collection fragrances + 2 Discovery Kits), **1 admin user**, and **8 starter reviews**. The whole site is testable completely offline.

---

## 17. State management model

Everything the UI needs lives in one plain JS object, `state` (no framework or store library). Key fields: current `screen`, `cart`, Studio values (`studio.top/heart/base/size/price`), quiz progress/answers, checkout form fields, active order tracking info, wishlist, accessibility preferences (`cvdMode`, `textScale`), the open/closed About Us dropdowns (`aboutOpen`), voucher/discount amounts, and the auth/OTP flow state (`authMode`, `authAction`, `pendingLoginUser`, `otpEmail`).

Every interaction mutates `state` directly, then calls `renderScreen()` and/or `renderNav()` to re-render — there is no virtual DOM or diffing; `#main`'s `innerHTML` is replaced each time, with a CSS class toggle (`anim`) to retrigger a subtle fade-in.

---

## 18. Known limitations

- **Payment methods are cosmetic** — nothing integrates with a real gateway; "placing an order" just records it.
- **OTP is a demo** — the code is fixed at `0000`, and does not prove ownership of the email address (Section 10.1).
- **Passwords are stored in plain text**, and the seed admin login (`admin@velouressence.co.za` / `admin123`) is public in the code.
- **Voucher validation is loose** — any `VELOUR-…OFF` code is accepted as a flat discount, and an applied discount does not recalculate when cart quantities change (Section 8).
- **Courier tracking is simulated** — the status auto-advance and the map location are client-side stand-ins, not a real courier or GPS.
- **Contact Us and Wholesale forms do not send anything** (Section 15).
- **Silent offline fallback** — if a cloud save fails, data is saved locally and the user is still told it succeeded (Section 2).
- **"Order Received" can overwrite a requested return** (Section 10.2).
- **No admin dashboard** — the `admin` role only changes what the Lab Tracker shows; there is no order-management, inventory, or CMS interface.
- **Illustration colours are intentionally fixed** — scent bottle liquid colours and order-status pill colours don't change with the theme, since they represent product/status identity.
- **Brand names** (Tom Ford, Baccarat Rouge, Chanel, etc.) appear only as "if you like X, try this" comparison copy, not as licensed products.

---

## 19. File inventory

| File | What it is |
|---|---|
| `index.html` | The entire application — markup, CSS, and all client-side JS |
| `backend.js` | The `VelourDB` data-access layer (Supabase + IndexedDB dual-mode) |
| `README.md` | This document |

Everything is designed to be opened as a static file or deployed to any static host (GitHub Pages, Netlify, S3, etc.) with no server-side code required.
