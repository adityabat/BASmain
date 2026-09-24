const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asString(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (asString(payload.company, 200)) {
    return json(200, { ok: true });
  }

  const name = asString(payload.name, 200);
  const email = asString(payload.email, 320);
  const phone = asString(payload.phone, 50);
  const message = asString(payload.message, 4000);

  if (!name || !isEmail(email) || !phone || !message) {
    return json(400, { error: "Please provide a name, email, phone, and message." });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "delivered@resend.dev";
  const toEmail = Deno.env.get("TO_EMAIL") ?? "adityaba70@gmail.com";

  if (!apiKey) {
    console.error("send-enquiry missing RESEND_API_KEY");
    return json(500, { error: "Email is not configured." });
  }

  const text = [
    "New appointment enquiry from BAS Agentic",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    "",
    message,
  ].join("\n");

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `BAS Agentic <${fromEmail}>`,
      to: [toEmail],
      reply_to: email,
      subject: `Appointment enquiry from ${name}`,
      text,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    console.error("Resend error:", resendRes.status, detail);
    return json(502, { error: "Could not send the enquiry. Please try again." });
  }

  return json(200, { ok: true });
});
