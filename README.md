# Buildbyte: coming soon page (Cloudflare Worker + static assets + D1)

1. `npm install`
2. `npx wrangler d1 create buildbyte-db` → paste the `database_id` into `wrangler.jsonc`
3. `npm run db:init` (local) and `npm run db:init:remote`
4. `npm run dev` to test, `npm run deploy` to ship
5. Domain: add buildbyte.buzz to Cloudflare, then uncomment `routes` in `wrangler.jsonc` and redeploy.

View signups: `npx wrangler d1 execute buildbyte-db --remote --command "SELECT * FROM waitlist"`
