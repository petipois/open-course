import type { APIRoute } from "astro";
import { createCourse, uploadCourseImage } from "@/lib/appwrite";

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const title = form.get("course_title")?.toString();
    const description = form.get("course_description")?.toString();
    const creator = form.get("creator_id")?.toString();

    /* const thumbnailFile = form.get("thumbnail") as File | null;
     let thumbnailURL = "";
 
     if (thumbnailFile && thumbnailFile.size > 0) {
       thumbnailURL = await uploadCourseImage(thumbnailFile);
     }
 */
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
      //  thumbnail: thumbnailURL,
    });

    if (result) {
      // reload page
      return Response.redirect("/instructor")
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
