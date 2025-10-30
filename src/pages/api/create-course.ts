import type { APIRoute } from "astro";
import Stripe from "stripe";
import { createCourse } from "@/lib/appwrite";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const form = await request.formData();
    const costValue = parseInt(form.get("course_price") as string || "0", 10);
    const title = form.get("course_title")?.toString();
    const description = form.get("course_description")?.toString();
    const creator = form.get("creator_id")?.toString();
    const thumbnail = form.get("thumbnail_url") as string;

    if (!title || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Step 1: Create Stripe product
    const product = await stripe.products.create({
      name: title,
      description: description,
      images: thumbnail ? [thumbnail] : [],
    });

    //  Step 2: Create Stripe price
    const price = await stripe.prices.create({
      unit_amount: isNaN(costValue) ? 0 : costValue,
      currency: "eur",
      product: product.id,
    });

    //  Step 3: Store everything in Appwrite
    const result = await createCourse({
      title,
      description,
      creatorID: creator,
      lessons: [],
      students: [],
      cost: isNaN(costValue) ? 0 : costValue,
      thumbnail: thumbnail,
      stripeProductId: product.id,
      stripePriceId: price.id,
    });

    if (result) {
      console.log("✅ Course created with Stripe IDs:", result);
      const redirectUrl = new URL(`/instructor/`, url.origin);
      return Response.redirect(redirectUrl.toString(), 303);
    }

    return new Response(
      JSON.stringify({ error: "Failed to create course" }),
      { status: 500 }
    );

  } catch (err) {
    console.error("Error creating course:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500 }
    );
  }
};
