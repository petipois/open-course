import type { APIRoute } from "astro";
import Stripe from "stripe";
import { studentExists, getCourse } from '@/lib/appwrite';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});
const PRICE_ID =  import.meta.env.STRIPE_PRICE_ID;
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const customerEmail = formData.get("customerEmail") as string;
    const userID = formData.get("userID") as string;
    // Validate inputs
    if (!customerEmail || !userID) {
      return new Response(
        JSON.stringify({ error: "Email and user ID are required" + userID + customerEmail }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

  

    // Check if student exists
    const exists = await studentExists(userID);
    if (!exists) {
      console.error(`Student not found: ${userID}`);
      return new Response(
        JSON.stringify({ error: "Student not found" }), 
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get course details
    const course = await getCourse();
    if (!course) {
      console.error("No course available");
      return new Response(
        JSON.stringify({ error: "Course not found" }), 
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validate course pricing (Stripe minimum is 50 cents)
    if (!course.cost || course.cost < 50) {
      console.error("Invalid course cost:", course.cost);
      return new Response(
        JSON.stringify({ error: "Invalid course pricing configuration" }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }


    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: { 
        userID: userID, // Store userID for webhook
        courseId: course.$id,
      },
      // Store userID in payment_intent metadata as well for additional tracking
      payment_intent_data: {
        metadata: {
          userID: userID,
          courseId: course.$id,
        },
      },
      success_url: `${import.meta.env.PUBLIC_BASE_URL}/course`,
      cancel_url: `${import.meta.env.PUBLIC_BASE_URL}/checkout?canceled=true`,
      // Session expires after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    });

    console.log(`✓ Checkout session created: ${session.id}`);

    if (!session.url) {
      console.error("No checkout URL returned from Stripe");
      return new Response(
        JSON.stringify({ error: "Failed to create checkout session" }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Redirect to Stripe Checkout
    return new Response(null, {
      status: 303,
      headers: { Location: session.url },
    });

  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    
    // Provide user-friendly error messages
    let errorMessage = "An error occurred during checkout";
    
    if (err.type === "StripeInvalidRequestError") {
      errorMessage = "Invalid payment configuration. Please contact support.";
    } else if (err.type === "StripeAPIError") {
      errorMessage = "Payment service temporarily unavailable. Please try again.";
    } else if (err.type === "StripeConnectionError") {
      errorMessage = "Network error. Please check your connection and try again.";
    }

    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
