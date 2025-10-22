// src/pages/api/checkout.ts
import type { APIRoute } from "astro";
import Stripe from "stripe";
import { studentExists, getCourse } from '@/lib/appwrite';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const customerEmail = formData.get("customerEmail") as string;
    const studentId = formData.get("studentId") as string;

    if (!customerEmail || !studentId) {
      return new Response(JSON.stringify({ error: "Email and student ID are required" }), { status: 400 });
    }

    const exists = await studentExists(studentId);
    if (!exists) {
      return new Response(JSON.stringify({ error: "Student not found" }), { status: 404 });
    }

    const course = await getCourse(); // returns course.cost in cents
    if (!course) {
      return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: course.cost,
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: { studentId }, // needed for webhook
      success_url: `${import.meta.env.PUBLIC_BASE_URL}/course?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${import.meta.env.PUBLIC_BASE_URL}/checkout`,
    });

    if (!session.url) {
      console.error("No session URL returned from Stripe:", session);
      return new Response(JSON.stringify({ error: "No Checkout URL returned" }), { status: 500 });
    }

    return new Response(null, {
      status: 303,
      headers: { Location: session.url! },
    });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
