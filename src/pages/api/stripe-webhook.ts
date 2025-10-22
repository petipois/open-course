import type { APIRoute } from "astro";
import Stripe from "stripe";
import { updateStudent } from '@/lib/appwrite';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-09-30.clover" });

export const POST: APIRoute = async ({ request }) => {
  // 1️⃣ Get the raw request body
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("Missing stripe-signature header");
    return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
  }

  let event: Stripe.Event;

  // 2️⃣ Verify the webhook signature
  try {
    event = stripe.webhooks.constructEvent(payload, sig, import.meta.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 });
  }

  console.log("📥 Webhook received:", event.type);

  // 3️⃣ Handle the different event types
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userID = session.metadata?.userID;
      const transactionId = session.payment_intent as string;

      if (userID && transactionId) {
        try {
          await updateStudent(userID, {
            transaction_id: transactionId,
            paymentDate: new Date().toISOString(),
            amount: session.amount_total,
            currency: session.currency,
            paymentStatus: "paid",
          });
          console.log(`✅ Student ${userID} updated with transaction ${transactionId}`);
        } catch (err) {
          console.error("Error updating student:", err);
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userID = paymentIntent.metadata?.userID;
      if (userID) {
        try {
          await updateStudent(userID, {
            paymentStatus: "failed",
            lastPaymentAttempt: new Date().toISOString(),
          });
          console.log(`⚠️ Payment failed for user: ${userID}`);
        } catch (err) {
          console.error("Error updating failed payment status:", err);
        }
      }
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userID = paymentIntent.metadata?.userID;
      if (userID) console.log(`✅ Payment succeeded for user: ${userID}`);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userID = session.metadata?.userID;
      if (userID) console.log(`⏱️ Checkout session expired for user: ${userID}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // 4️⃣ Always return 200 to acknowledge receipt
  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
