import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PRO_PRICE_DATA = {
  currency: "aud",
  unit_amount: 2900,
  recurring: { interval: "month" as const },
  product_data: {
    name: "BAS Agentic Pro",
    description: "Unlimited document uploads and transcript extractions",
  },
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getUser(authHeader: string) {
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    },
  });
  if (!res.ok) return null;
  return await res.json() as { id: string; email?: string };
}

async function getCustomerId(userId: string) {
  const url = new URL(`${Deno.env.get("SUPABASE_URL")}/rest/v1/stripe_customers`);
  url.searchParams.set("select", "customer_id");
  url.searchParams.set("user_id", `eq.${userId}`);
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) return null;
  const rows = await res.json() as Array<{ customer_id?: string }>;
  return rows[0]?.customer_id ?? null;
}

async function resolveLineItem(stripe: Stripe, requestedPriceId?: string) {
  const fallback = {
    item: { price_data: PRO_PRICE_DATA, quantity: 1 },
    source: "price_data",
  };
  if (!requestedPriceId) return fallback;
  try {
    const price = await stripe.prices.retrieve(requestedPriceId);
    if (price.active) {
      return { item: { price: requestedPriceId, quantity: 1 }, source: "requested_price" };
    }
    const productId = typeof price.product === "string" ? price.product : price.product?.id;
    if (productId) {
      const active = await stripe.prices.list({
        product: productId,
        active: true,
        type: "recurring",
        limit: 1,
      });
      if (active.data[0]) {
        return { item: { price: active.data[0].id, quantity: 1 }, source: "active_product_price" };
      }
    }
  } catch (err) {
    console.error("stripe-checkout price lookup failed:", err);
  }
  return fallback;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Missing authorization header" });

    const user = await getUser(authHeader);
    if (!user?.id) return json(401, { error: "Unauthorized" });

    const body = await req.json().catch(() => ({})) as {
      successUrl?: string;
      cancelUrl?: string;
      priceId?: string;
    };
    const successUrl = body.successUrl ?? req.headers.get("origin") ?? "https://example.com";
    const cancelUrl = body.cancelUrl ?? successUrl;
    const requestedPriceId = body.priceId ?? Deno.env.get("STRIPE_PRICE_ID");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2024-04-10",
    });

    const { item, source } = await resolveLineItem(stripe, requestedPriceId);
    const existingCustomerId = await getCustomerId(user.id);

    const sessionParams: Record<string, unknown> = {
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [item],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      metadata: { user_id: user.id, price_source: source },
    };
    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else if (user.email) {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Stripe.Checkout.SessionCreateParams,
    );

    return json(200, { url: session.url, priceSource: source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("stripe-checkout error:", err);
    return json(500, { error: message });
  }
});
