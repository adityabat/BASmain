import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function serviceHeaders() {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
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
  url.searchParams.set("deleted_at", "is.null");
  const res = await fetch(url, { headers: serviceHeaders() });
  if (!res.ok) return null;
  const rows = await res.json() as Array<{ customer_id?: string }>;
  return rows[0]?.customer_id ?? null;
}

async function syncSubscriptionRow(customerId: string, sub: Stripe.Subscription) {
  const url = new URL(`${Deno.env.get("SUPABASE_URL")}/rest/v1/stripe_subscriptions`);
  url.searchParams.set("customer_id", `eq.${customerId}`);
  await fetch(url, {
    method: "PATCH",
    headers: { ...serviceHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({
      subscription_id: sub.id,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      status: sub.status,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function findLiveSubscription(stripe: Stripe, customerId: string) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  return subs.data.find((s) =>
    s.status === "active" || s.status === "trialing" || s.status === "past_due"
  ) ?? null;
}

function payload(sub: Stripe.Subscription) {
  return {
    subscriptionId: sub.id,
    status: sub.status,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    currentPeriodEnd: sub.current_period_end,
  };
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

    const body = await req.json().catch(() => ({})) as { action?: string };
    const action = body.action === "resume" ? "resume" : "cancel";

    const customerId = await getCustomerId(user.id);
    if (!customerId) return json(404, { error: "No billing account found" });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2024-04-10",
    });

    const existing = await findLiveSubscription(stripe, customerId);
    if (!existing) return json(404, { error: "No active subscription found" });

    const shouldCancel = action === "cancel";
    if (existing.cancel_at_period_end === shouldCancel) {
      return json(200, payload(existing));
    }

    const sub = await stripe.subscriptions.update(existing.id, {
      cancel_at_period_end: shouldCancel,
    });

    await syncSubscriptionRow(customerId, sub);
    return json(200, payload(sub));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("stripe-cancel error:", err);
    return json(500, { error: message });
  }
});
