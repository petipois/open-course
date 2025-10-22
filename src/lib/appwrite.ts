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

// ============= COURSE FUNCTIONS =============

export async function createCourse(data: any) {
    try {
        const course = await tables.createRow({
            databaseId: COURSE_DATABASE,
            tableId: 'courses',
            rowId: ID.unique(),
            data: data
        });
        return course;
    } catch (error) {
        console.error("Error creating course:", error);
        throw error;
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

export async function uploadCourseImage(file: File) {
    try {
        // Upload the file to Appwrite storage
        const uploaded = await storage.createFile(
            COURSE_BUCKET,
            ID.unique(),
            file
        );

        // Get a public URL to view the file
        const view = storage.getFileView(COURSE_BUCKET, uploaded.$id);
        
        return view;
    } catch (err) {
        console.error("Error uploading course image:", err);
        throw err;
    }
}

// ============= LESSON FUNCTIONS =============

export async function getLessons(courseID: string) {
    try {
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "lessons",
            queries: [Query.equal("courseID", courseID)]
        });

        if (result.total > 0) {
            return result.rows; // return all the lessons related to the course
        }

        return []; // return empty array instead of null for consistency
    } catch (error) {
        console.error("Error fetching lessons:", error);
        return [];
    }
}

export async function getLessonbyID(lessonID: string) {
    try {
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "lessons",
            queries: [Query.equal("$id", lessonID)] // Use $id for row ID
        });

        if (result.total > 0) {
            return result.rows[0];
        }

        return null;
    } catch (error) {
        console.error("Error fetching lesson:", error);
        return null;
    }
}

export async function addLesson(data: any) {
    try {
        const lesson = await tables.createRow({
            databaseId: COURSE_DATABASE,
            tableId: 'lessons',
            rowId: ID.unique(),
            data: data
        });
        return lesson;
    } catch (error) {
        console.error("Error adding lesson:", error);
        throw error;
    }
}

export async function updateLesson(lessonID: string, data: any) {
    try {
        const result = await tables.updateRow({
            databaseId: COURSE_DATABASE,
            tableId: "lessons",
            rowId: lessonID,
            data
        });

        return result;
    } catch (error) {
        console.error(`Error updating lesson ${lessonID}:`, error);
        throw error;
    }
}

export async function deleteLesson(lessonID: string) {
    try {
        const result = await tables.deleteRow({
            databaseId: COURSE_DATABASE,
            tableId: "lessons",
            rowId: lessonID
        });

        return result;
    } catch (error) {
        console.error("Error deleting lesson:", error);
        throw error;
    }
}

// ============= PROGRESS FUNCTIONS =============

export async function markLessonComplete(userID: string, courseID: string, lessonID: string) {
    try {
        // Check if already completed
        const existing = await getLessonProgress(userID, lessonID);
        if (existing && existing.length > 0) {
            console.log("Lesson already marked complete");
            return existing[0];
        }

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
        return [];
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

// ============= STUDENT FUNCTIONS =============

export async function studentExists(userID: string): Promise<boolean> {
    try {
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "students",
            queries: [Query.equal("userID", userID)]
        });
        return result.rows.length > 0;
    } catch (error) {
        console.error("Error checking if student exists:", error);
        return false;
    }
}

export async function addStudent(data: any) {
    try {
        const result = await tables.createRow({
            databaseId: COURSE_DATABASE,
            tableId: "students",
            rowId: ID.unique(),
            data: data
        });

        return result;
    } catch (error) {
        console.error("Error adding student:", error);
        throw error;
    }
}

export async function getStudent(userID: string) {
    try {
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "students",
            queries: [Query.equal("userID", userID)]
        });
        
        if (result.total > 0) {
            return result.rows[0];
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching student:", error);
        return null;
    }
}

export async function studentHasPaid(userID: string): Promise<boolean> {
    try {
        const student = await getStudent(userID);
        
        if (!student) {
            return false;
        }
        
        return student.transaction_id != null && student.transaction_id !== "";
    } catch (error) {
        console.error("Error checking payment status:", error);
        return false;
    }
}

export async function updateStudent(userID: string, data: any) {
    try {
        // First, find the student by userID
        const result = await tables.listRows({
            databaseId: COURSE_DATABASE,
            tableId: "students",
            queries: [Query.equal("userID", userID)]
        });

        if (result.total === 0) {
            throw new Error(`Student with userID ${userID} not found`);
        }

        const student = result.rows[0];

        // Update using the row's $id
        const updated = await tables.updateRow({
            databaseId: COURSE_DATABASE,
            tableId: "students",
            rowId: student.$id,
            data: data
        });

        return updated;
    } catch (error) {
        console.error(`Error updating student ${userID}:`, error);
        throw error;
    }
}