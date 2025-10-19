# OpenCourse – Self-Hosted Single-Course Platform

**OpenCourse** is a lightweight, open-source platform that lets content creators **build, host, and sell a single course**. Optimized for hackathons or small creators, it provides a minimal, self-hosted alternative to platforms like Teachable.

---

## **Tagline**
**Build, host, and sell your own course.**

---

## **Features**

### Instructor
- Login via **Clerk**  
- Create a single course: title, description, thumbnail, price  
- Add/edit lessons: title, text content, Mux video (`playback_id`)  
- Reorder lessons  
- Preview lessons  

### Student
- Login via **Clerk**  
- Pay for course via **Stripe Checkout**  
- Access lessons once payment is complete  
- Track progress:  
  - Current lesson highlight  
  - Completed lessons ✅  
  - Progress bar  
  - Auto-complete lessons when video ends  

### Self-Hosted & Open-Source
- Single-course deployment → simple & easy to demo  
- Instructor auto-login via `.env` email  
- Minimal setup: Astro frontend, Appwrite DB, Clerk auth, Mux video, Stripe payments  

---

## **Tech Stack**

| Layer             | Technology                     |
|------------------|--------------------------------|
| Frontend         | Astro + Tailwind CSS           |
| Authentication   | Clerk                         |
| Database / Storage| Appwrite                      |
| Video Hosting    | Mux                            |
| Payments         | Stripe                         |

---

## **Getting Started**

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/opencourse.git
cd opencourse
npm install


### 2. Environment Variables

PUBLIC_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
CLERK_SECRET_KEY==<your_clerk_secret_key>

APPWRITE_ENDPOINT=<your_appwrite_endpoint>
APPWRITE_PROJECT_ID=<your_appwrite_project_id>
APPWRITE_API_KEY=<your_appwrite_api_key>

STRIPE_PUBLIC_KEY=<your_stripe_public_key>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

MUX_TOKEN_ID=<your_mux_token_id>
MUX_TOKEN_SECRET=<your_mux_token_secret>

INSTRUCTOR_EMAIL=<your_email@example.com>

PUBLIC_URL=http://localhost:3000

INSTRUCTOR_EMAIL auto-redirects the instructor to the dashboard after login.

### Appwrite Collections

Courses: title, description, price
Lessons: course_id, title, description, playback_id, order
Students: email, paid, current_lesson_id, progress (array), transaction_id

## API Routes
Instructor / Course Management
/api/course/create-course – create a course (instructor only)
/api/course/add-lesson – add lesson to course
/api/course/mark-complete – Mark Lesson as complete (public)
/api/lesson/update lesson –  update lesson

###Stripe Payment

/api/stripe/checkout – create Stripe Checkout session for student
/api/stripe/webhook – webhook to mark student as paid, store transaction_id, initialize progress

## Student Flow
                  +-----------------+
                  |   User Login    |
                  |  via Clerk      |
                  +-----------------+
                            |
                            v
              +--------------------------+
              | Is email = INSTRUCTOR?  |
              +--------------------------+
              | Yes                      | No
              v                          v
     +---------------------+     +----------------------+
     | Instructor Dashboard |     | Student Course Page |
     | - Edit course       |     | - Check payment     |
     | - Add/edit lessons  |     | - Paid?             |
     | - Preview course    |     +----------------------+
     +---------------------+                |
                                           Yes / No
                                          /     \
                                +---------------------+
                                | Paid                |
                                | - Show first lesson |
                                | - Track progress    |
                                | - Highlight current |
                                | - Auto-complete     |
                                | - Show progress bar |
                                +---------------------+
                                          |
                                          v
                                +---------------------+
                                | all lessons      |
                                |                  |
                                | unlocked         |
                                |                   |
                                +---------------------+
## Frontend Structure
/src/pages
  /student.astro        # Student view
  /instructor/
      [id].astro      # update lesson by id
      lessons.astro   # all lessons info
      index.astro     # Instructor dashboard
  /login.astro        # Clerk login
  /index.astro          # home page
  /course.astro       #course page
/src/pages/api
  
  /stripe/checkout.ts
  /stripe/webhook.ts
/src/components
  Hero.astro
  HowItWorks.astro
  Navbar.astro
  Footer.astro
  LessonList.astro      # sidebar with all the lessons
  LessonPlayer          # component that load the lesson with mux player
  starwind              # starwind ui components
/src/lib
  appwrite.ts           # Appwrite helpers
  stripe.ts             # Stripe helpers

## More frontend customization

Change the index.astro to fit your style.
Hero, HowItWorks, Features are the components used, customized them or just rewrite the index.astro file