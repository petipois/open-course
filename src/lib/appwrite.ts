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

export async function markLessonComplete(userID: string, courseID: string, lessonID: string) {
    try {
        const progress = await tables.createRow({
            databaseId: COURSE_DATABASE,
            tableId: "progress",
            rowId: ID.unique(),
            data: {
                userID: userID,
                courseID: courseID,
                lessonID: lessonID,
                completed: true,
                completedAt: new Date().toISOString(),
                progressPercentage: 100
            },
        });
        return progress;
    } catch (err) {
        console.error("Error marking complete:", err);
        throw err;
    }
}

export async function getLessonProgress(userID: string, lessonID: string) {
    try {
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "progress",
            queries: [
                Query.equal("userID", userID),
                Query.equal("lessonID", lessonID),
            ],
        });
        return result.rows;
    } catch (err) {
        console.error("Error getting progress:", err);
    }
}

export async function getProgress(userId: string) {
    try {
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "progress",
            queries: [
                Query.equal("userID", userId),
            ],
        });

        // Return array of lesson IDs
        return result.rows.map(row => row.lessonID);
    } catch (error) {
        console.error("Error fetching progress:", error);
        return [];
    }
}

export async function updateLesson(lessonID: string, data: any) {
  try {
    // Fetch the row first to ensure it exists
    const row = await tables.getRow(COURSE_DATABASE, "lessons", lessonID);

    if (!row) {
      throw new Error(`Row ${lessonID} not found`);
    }

    // Update
    const result = await tables.updateRow({
      databaseId: COURSE_DATABASE,
      tableId: "lessons",
      rowId: lessonID,
      data
    });

    return result;
  } catch (error) {
    console.error(`Error updating lesson ${lessonID}:`, error);
    return null;
  }
}