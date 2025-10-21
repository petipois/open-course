import type { APIRoute } from "astro";
import Stripe from "stripe";
import { updateStudent } from '@/lib/appwrite';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-09-30.clover" });

export const POST: APIRoute = async ({ request }) => {
  // Use raw body for signature verification
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      import.meta.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle checkout session completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const studentId = session.metadata?.studentId;
    const courseId = session.metadata?.courseId;
    const transactionId = session.payment_intent as string;

    if (studentId && transactionId) {
      try {
        // Update student record in DB
        await updateStudent(studentId, {
          transactionId,
          paymentDate: new Date().toISOString(),
        });
        console.log(`Student ${studentId} updated with transaction ${transactionId}`);
      } catch (err) {
        console.error("Error updating student:", err);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
