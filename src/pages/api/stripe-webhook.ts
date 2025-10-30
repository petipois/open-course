import type { APIRoute } from "astro";
import Stripe from "stripe";
import { updateStudent } from '@/lib/appwrite';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-09-30.clover" });

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("Missing Stripe signature header");
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // ⚡ Production: verify signature
    event = stripe.webhooks.constructEvent(payload, sig, import.meta.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook Error", { status: 400 });
  }

  console.log("Webhook received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userID = session.metadata?.userID;

    if (!userID) {
      console.warn("No userID found in session metadata");
    } else {
      try {
        await updateStudent(userID, {
          transaction_id: session.id, // Use session ID, not signature
        });
        console.log(`Transaction ID updated for user: ${userID}, session: ${session.id}`);
      } catch (err) {
        console.error(`Failed to update transaction ID for user ${userID}:`, err);
      }
    }
  }

  

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};