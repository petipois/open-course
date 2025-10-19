import type { APIRoute } from "astro";
import { markLessonComplete } from "@/lib/appwrite";

export const POST: APIRoute = async ({ request,url }) => {
    try {
        const data = await request.formData();
        const user_id = data.get("userID") as string;
        const course_id = data.get("courseID") as string;
        const lesson_id = data.get("lessonID") as string;
        if (!user_id || !lesson_id || !course_id) {
            return new Response(JSON.stringify({ error: "Missing fields: " + user_id, lesson_id, course_id }), { status: 400 });
        }

        const progress = await markLessonComplete(user_id, course_id, lesson_id);
        // Construct absolute URL using the request's origin
        const redirectUrl = new URL(`/course`, url.origin);

        return Response.redirect(redirectUrl.toString(), 303); //reload the lessons page
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ success: false, error: "Failed to mark complete" }), {
            status: 500,
        });
    }
};
