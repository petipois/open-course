import type { APIRoute } from "astro";
import { updateLesson } from "@/lib/appwrite";

export const POST: APIRoute = async ({ request, url }) => {
    try {
        const formData = await request.formData();
         const orderValue = parseInt(formData.get("lesson_number") as string || "0", 10);
        const lessonID = formData.get("lessonID") as string;
        const lessonData = {
            title: formData.get('lesson_title') as string,
            description: formData.get('lesson_description') as string,
            order: isNaN(orderValue) ? 0 : orderValue
        };



        const lesson = await updateLesson(lessonID, {
            ...lessonData,
        })
if(lesson)
    console.log(lesson)
        const redirectUrl = new URL(`/instructor/lessons/`, url.origin);

        return Response.redirect(redirectUrl.toString(), 303); //reload the lessons page


    } catch (error: any) {
        console.error('Error:', error);

        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Failed to process request'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};