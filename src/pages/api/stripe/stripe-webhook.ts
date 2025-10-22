import type { APIRoute } from "astro";
import Stripe from "stripe";
import { updateStudent } from '@/lib/appwrite';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, { 
  apiVersion: "2025-09-30.clover" 
});

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");
  
  if (!sig) {
    console.error("Missing stripe-signature header");
    return new Response(
      JSON.stringify({ error: "Missing signature" }), 
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      import.meta.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }), 
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  console.log(`📥 Received webhook event: ${event.type}`);

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userID = session.metadata?.userID;
    const transactionId = session.payment_intent as string;

    console.log(`Processing completed checkout for user: ${userID}`);

    // Validate required data
    if (!userID) {
      console.error("⚠️ No userID found in session metadata");
      return new Response(
        JSON.stringify({ received: true }), 
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (!transactionId) {
      console.error("⚠️ No payment_intent found in session");
      return new Response(
        JSON.stringify({ received: true }), 
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Update student record with payment info
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
      console.error("❌ Error updating student:", err);
      // Still return 200 to prevent Stripe from retrying
      // Log the error for manual investigation
    }
  }

  // Handle failed payments
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userID = paymentIntent.metadata?.userID;

    if (userID) {
      console.log(`⚠️ Payment failed for user: ${userID}`);
      
      try {
        await updateStudent(userID, {
          paymentStatus: "failed",
          lastPaymentAttempt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error updating failed payment status:", err);
      }
    }
  }

  // Handle successful payments (separate from checkout completion)
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userID = paymentIntent.metadata?.userID;

    if (userID) {
      console.log(`✅ Payment succeeded for user: ${userID}`);
    }
  }

  // Handle expired checkout sessions
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userID = session.metadata?.userID;

    if (userID) {
      console.log(`⏱️ Checkout session expired for user: ${userID}`);
    }
  }

  // Return 200 to acknowledge receipt
  return new Response(
    JSON.stringify({ received: true }), 
    { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
};