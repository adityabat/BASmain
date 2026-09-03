import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-04-10",
  });

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id ?? session.client_reference_id;
    const customerId = session.customer as string;

    // 1. Upsert stripe_customers
    if (userId && customerId) {
      const { error: custErr } = await supabase
        .from("stripe_customers")
        .upsert(
          { user_id: userId, customer_id: customerId, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (custErr) console.error("stripe_customers upsert error:", custErr);
    }

    // 2. Insert stripe_orders
    const { error: orderErr } = await supabase
      .from("stripe_orders")
      .insert({
        checkout_session_id: session.id,
        payment_intent_id: (session.payment_intent as string) ?? session.id,
        customer_id: customerId ?? "",
        amount_subtotal: session.amount_subtotal ?? 0,
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        payment_status: session.payment_status,
        status: "completed",
      });
    if (orderErr) console.error("stripe_orders insert error:", orderErr);

    // 3. Upsert stripe_subscriptions (retrieve full sub from Stripe for details)
    const subscriptionId = session.subscription as string | null;
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["default_payment_method"],
        });
        const pm = sub.default_payment_method as Stripe.PaymentMethod | null;
        const price = sub.items.data[0]?.price;

        const { error: subErr } = await supabase
          .from("stripe_subscriptions")
          .upsert(
            {
              customer_id: customerId,
              subscription_id: sub.id,
              price_id: price?.id ?? null,
              current_period_start: sub.current_period_start,
              current_period_end: sub.current_period_end,
              cancel_at_period_end: sub.cancel_at_period_end,
              payment_method_brand: pm?.card?.brand ?? null,
              payment_method_last4: pm?.card?.last4 ?? null,
              status: sub.status,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "customer_id" }
          );
        if (subErr) console.error("stripe_subscriptions upsert error:", subErr);
      } catch (err) {
        console.error("Failed to retrieve subscription:", err);
      }
    }

    // 4. Upgrade user_plans to pro
    if (userId) {
      const { error: planErr } = await supabase
        .from("user_plans")
        .upsert(
          { user_id: userId, plan: "pro", updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (planErr) console.error("user_plans upsert error:", planErr);
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const pm = sub.default_payment_method as Stripe.PaymentMethod | null;
    const price = sub.items.data[0]?.price;

    const { error: subErr } = await supabase
      .from("stripe_subscriptions")
      .upsert(
        {
          customer_id: sub.customer as string,
          subscription_id: sub.id,
          price_id: price?.id ?? null,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          payment_method_brand: pm?.card?.brand ?? null,
          payment_method_last4: pm?.card?.last4 ?? null,
          status: sub.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "customer_id" }
      );
    if (subErr) console.error("stripe_subscriptions update error:", subErr);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    await supabase
      .from("stripe_subscriptions")
      .update({ status: "canceled", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("customer_id", customerId);

    // Revert user to free plan via stripe_customers lookup
    const { data: custRow } = await supabase
      .from("stripe_customers")
      .select("user_id")
      .eq("customer_id", customerId)
      .maybeSingle();

    const userId = custRow?.user_id ?? sub.metadata?.user_id;
    if (userId) {
      await supabase
        .from("user_plans")
        .update({ plan: "free", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
