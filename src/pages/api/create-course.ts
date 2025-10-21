import type { APIRoute } from "astro";
import { createCourse } from "@/lib/appwrite";

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

    const result = await createCourse({
      title,
      description,
      creatorID: creator,
      lessons: [],
      students: [],
      cost: isNaN(costValue) ? 0 : costValue,
      thumbnail: thumbnail,
    });

    if (result) {

      console.log(result)
      const redirectUrl = new URL(`/instructor/`, url.origin);

      return Response.redirect(redirectUrl.toString(), 303); //reload the lessons page

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
