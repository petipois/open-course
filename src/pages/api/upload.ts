import type { APIRoute } from "astro";
import { uploadCourseImage } from "@/lib/appwrite";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call your helper function — it should handle the Appwrite storage upload.
    const imageUrl = await uploadCourseImage(file);

    return new Response(
      JSON.stringify({ url: imageUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Upload failed:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Upload failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
