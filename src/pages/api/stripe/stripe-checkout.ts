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

    // Check if student exists
    const exists = await studentExists(studentId);
    if (!exists) {
      return new Response(JSON.stringify({ error: "Student not found" }), { status: 404 });
    }

    // Fetch course details from database
    const course = await getCourse(); // your helper function
    if (!course) {
      return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
    }

    // Create Stripe Checkout session using course details
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", // or course.currency if stored
            product_data: {
              name: course.name,
              description: course.description,
            },
            unit_amount: course.price, // in cents
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: { studentId, courseId: course.$id },
      success_url: `${import.meta.env.PUBLIC_BASE_URL}/course`,
      cancel_url: `${import.meta.env.PUBLIC_BASE_URL}/`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
