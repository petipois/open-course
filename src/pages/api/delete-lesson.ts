import type { APIRoute } from "astro";
import { deleteLesson } from "@/lib/appwrite";

export const POST: APIRoute = async ({ request, url }) => {
    try {
        const formData = await request.formData();
        const lessonID = formData.get("lessonID") as string;

        if (!lessonID) {
            return new Response(
                JSON.stringify({ error: "No id provided" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const result = await deleteLesson(lessonID)
        if (result) {

            console.log(result)


        }
        const redirectUrl = new URL(`/instructor/`, url.origin);

        return Response.redirect(redirectUrl.toString(), 303); //reload the lessons page


    } catch (err: any) {
        console.error("Upload failed:", err);
        return new Response(
            JSON.stringify({ error: err.message || "Upload failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
