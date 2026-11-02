interface Env { DB: D1Database; ASSETS: Fetcher }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/waitlist") {
      if (req.method !== "POST") return json({ error: "Use POST." }, 405);
      const { email } = (await req.json().catch(() => ({}))) as { email?: string };
      const clean = (email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean) || clean.length > 254)
        return json({ error: "Enter a valid email address." }, 400);
      await env.DB.prepare("INSERT OR IGNORE INTO waitlist (email) VALUES (?)").bind(clean).run();
      return json({ ok: true });
    }

    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
