import type { APIRoute } from "astro";
import Stripe from "stripe";
import { studentExists, getCourse } from "@/lib/appwrite";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const customerEmail = formData.get("customerEmail") as string;
    const userID = formData.get("userID") as string;


    if (!customerEmail || !userID) {
      return new Response(
        JSON.stringify({ error: "Missing email or user ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔍 Check if student exists
    const exists = await studentExists(userID);
    if (!exists) {
      return new Response(
        JSON.stringify({ error: "Student not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🎓 Fetch course details
    const course = await getCourse();
    if (!course) {
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ⚡ Validate that the course has Stripe IDs
    if (!course.stripePriceId) {
      console.warn("No Stripe price ID found — creating one now.");

      // (Optional fallback) Create product + price if not stored yet
      const product = await stripe.products.create({
        name: course.title,
        description: course.description,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: course.cost,
        currency: "eur",
      });

      // 🔁 (Optionally update your Appwrite course to store IDs)
      // await updateCourseStripeInfo(course.$id, product.id, price.id);

      course.stripePriceId = price.id;
    }

    // 🧾 Create checkout session using stored Stripe price
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: course.stripePriceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        userID,
        courseId: course.$id,
      },
      payment_intent_data: {
        metadata: {
          userID,
          courseId: course.$id,
        },
      },
      success_url: `${import.meta.env.PUBLIC_BASE_URL}/course`,
      cancel_url: `${import.meta.env.PUBLIC_BASE_URL}/checkout?canceled=true`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
    });

    console.log(`✅ Checkout session created: ${session.id}`);

    return new Response(null, {
      status: 303,
      headers: { Location: session.url! },
    });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);

    let errorMessage = "An error occurred during checkout.";
    if (err.type === "StripeInvalidRequestError")
      errorMessage = "Invalid payment configuration.";
    else if (err.type === "StripeAPIError")
      errorMessage = "Payment service unavailable.";
    else if (err.type === "StripeConnectionError")
      errorMessage = "Network error — please retry.";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
