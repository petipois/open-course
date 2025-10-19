// src/lib/appwrite.ts
import { Client, Databases, Storage, ID, TablesDB, Query } from "appwrite";

// Initialize Appwrite client for server-side usage
const client = new Client()
    .setEndpoint(import.meta.env.APPWRITE_ENDPOINT!) // e.g. "https://cloud.appwrite.io/v1"
    .setProject(import.meta.env.APPWRITE_PROJECT_ID!) // Your project ID
const COURSE_DATABASE = import.meta.env.APPWRITE_DATABASE;
const COURSE_BUCKET = import.meta.env.APPWRITE_BUCKET_ID;
export const databases = new Databases(client);
export const tables = new TablesDB(client);
export const storage = new Storage(client);

export async function createCourse(data: any) {
    try {
        const course = tables.createRow({
            databaseId: COURSE_DATABASE,
            tableId: 'courses',
            rowId: ID.unique(),
            data: data
        });
        return course;
    } catch (error) {
        console.log(error)
    }
}
export async function getCourse() {
    try {
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "courses",
        });

        if (result.total > 0) {
            return result.rows[0]; // return the instructor's course
        }

        return null; // no course found
    } catch (error) {
        console.error("Error fetching course:", error);
        return null;
    }
}


export async function getLessons(courseID: any) {
    try {
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "lessons",
            queries: [Query.equal("courseID", courseID)]
        });

        if (result.total > 0) {
            return result.rows; // return all the lessons related to the course
        }

        return null; // no lessons found
    } catch (error) {
        console.error("Error fetching course:", error);
        return null;
    }
}
export async function getLessonbyID(lessonID: any) {
    try {
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "lessons",
            queries: [Query.equal("id", lessonID)]
        });

        return result; // return all the lessons related to the course

    } catch (error) {
        console.error("Error fetching course:", error);
        return null;
    }
}
export async function uploadCourseImage(file: File): Promise<string> {
    try {
        // 1️⃣ Upload the file to Appwrite storage
        const uploaded = await storage.createFile(
            COURSE_BUCKET,
            ID.unique(),
            file
        );

        // 2️⃣ Get a public URL to view the file
        const view = await storage.getFileView(COURSE_BUCKET, uploaded.$id);
        // 3️⃣ Return the public URL
        return view
    } catch (err) {
        console.error("Error uploading course image:", err);
        throw err;
    }
}

export async function addLesson(data: any) {
    try {
        const lesson = tables.createRow({
            databaseId: COURSE_DATABASE,
            tableId: 'lessons',
            rowId: ID.unique(),
            data: data
        });
        return lesson;
    } catch (error) {
        console.log(error)
    }
}