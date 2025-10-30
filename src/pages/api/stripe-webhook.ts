// src/pages/api/stripe-webhook.ts
import type { APIRoute } from "astro";
import Stripe from "stripe";
import { updateStudent } from "@/lib/appwrite";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  // Toggle bypass in local dev only. MUST NOT be true in production.
  const bypass = String(import.meta.env.STRIPE_WEBHOOK_BYPASS || "").toLowerCase() === "true";

  let event: Stripe.Event | null = null;

  if (bypass) {
    // === DEBUG BYPASS MODE ===
    console.warn("⚠️ STRIPE WEBHOOK VERIFICATION BYPASSED (DEBUG MODE). DO NOT USE IN PRODUCTION.");
    try {
      event = JSON.parse(payload) as Stripe.Event;
    } catch (err) {
      console.error("Failed to parse webhook JSON while in bypass mode:", err);
      return new Response("Invalid JSON payload", { status: 400 });
    }
  } else {
    // Normal verification path
    const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
      return new Response("Webhook secret not configured", { status: 500 });
    }
    if (!sig) {
      console.error("Missing stripe-signature header");
      return new Response("Missing signature", { status: 400 });
    }

    try {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err?.message ?? err);
      return new Response("Webhook Error", { status: 400 });
    }
  }

  if (!event) {
    return new Response("No event parsed", { status: 400 });
  }

  console.log("Webhook received:", event.type);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userID = session.metadata?.userID;

      if (!userID) {
        console.warn("No userID found in session metadata", { sessionId: session.id });
      } else {
        try {
          await updateStudent(userID, {
            transaction_id: session.id, // store session id or payment intent as you prefer
            paymentDate: new Date().toISOString(),
          });
          console.log(`✅ Student ${userID} updated, session ${session.id}`);
        } catch (err) {
          console.error("Error updating student in Appwrite:", err);
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userID = paymentIntent.metadata?.userID;
      if (userID) {
        try {

          console.log(`⚠️ Payment failed for user: ${userID}`);
        } catch (err) {
          console.error("Error updating failed payment in Appwrite:", err);
        }
      }
    }

    // handle other events you care about here...

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), { status: 500 });
  }
};
