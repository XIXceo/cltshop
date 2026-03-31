# Clothes Shop (Demo)

Online clothing shop with:
- Customer registration + login
- Product browsing (sizes/colors + stock)
- Cart + demo checkout
- Admin dashboard (Products + Orders)

## Setup (local)

1. Create `.env` from `.env.example`
2. Install dependencies: `npm install`
3. Create DB + generate Prisma client:
   - `npm run prisma:migrate`
   - `npm run prisma:generate`
4. Seed categories + admin:
   - `npm run prisma:seed`
5. Run dev server: `npm run dev`

## Admin

Login with the seeded admin credentials (see `.env`).
- Products: `/admin/products`
- Orders: `/admin/orders`

## Notes

- Checkout is `demo` only (no real payments).
- Product images are managed by URL strings in the admin UI (fast + no storage service required).

