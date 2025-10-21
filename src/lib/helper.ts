
import { getCourse, studentExists, studentHasPaid } from "@/lib/appwrite";
const INSTRUCTOR_EMAIL = import.meta.env.INSTRUCTOR_EMAIL;
export function instructorCheck(email: string) {
    if (email == INSTRUCTOR_EMAIL) {
        return true;
    }
    return false

}

export async function courseExists() {
    const course = await getCourse();
    if (course)
        return true
    else
        return false;
}

export async function showCourseDetails() {
    const course = await getCourse();
    return course;
}

export async function studentIsInDB(userID: any) {
    const alreadyStudent = await studentExists(userID);
    return alreadyStudent;
}
export async function hasStudentPaid(userID: any) {
    const result = await studentHasPaid(userID)
    return result
}