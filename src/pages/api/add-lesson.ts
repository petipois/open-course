import type { APIRoute } from "astro";
import { addLesson } from "@/lib/appwrite";
import Mux from '@mux/mux-node';

const mux = new Mux({
    tokenId: import.meta.env.MUX_TOKEN_ID,
    tokenSecret: import.meta.env.MUX_TOKEN_SECRET,
});
export const POST: APIRoute = async ({ request, url }) => {
    try {
        const formData = await request.formData();
        const orderValue = parseInt(formData.get("lesson_number") as string || "0", 10);
        const lessonData = {
            title: formData.get('lesson_title') as string,
            description: formData.get('lesson_description') as string,
            courseID: formData.get('course_id') as string,
            order: isNaN(orderValue) ? 0 : orderValue
        };

        const video_asset_id = formData.get('video_asset_id') as string;

        if (!video_asset_id) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Video asset ID is required'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Handle both upload ID and asset ID
        let asset;
        let finalAssetId = video_asset_id;

        try {
            // Try as asset ID first
            asset = await mux.video.assets.retrieve(video_asset_id);
        } catch (error: any) {
            // If it fails, try as upload ID
            if (error.message?.includes('Upload ID')) {
                const upload = await mux.video.uploads.retrieve(video_asset_id);

                if (!upload.asset_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Video is still processing, please try again later'
                    }), { status: 202, headers: { 'Content-Type': 'application/json' } });
                }

                finalAssetId = upload.asset_id;
                asset = await mux.video.assets.retrieve(finalAssetId);
            } else {
                throw error;
            }
        }

        // Get the public playback URL if available
        const playbackId = asset.playback_ids?.[0]?.id;
        const duration = asset.duration?.toFixed();

        if (!playbackId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No playback ID available for this video'
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        const lesson = await addLesson({
            ...lessonData,
            videoID: playbackId
        })
       
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