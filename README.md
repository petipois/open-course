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

PUBLIC_CLERK_FRONTEND_API=<your_clerk_frontend_api>
APPWRITE_ENDPOINT=<your_appwrite_endpoint>
APPWRITE_PROJECT_ID=<your_appwrite_project_id>
APPWRITE_API_KEY=<your_appwrite_api_key>
STRIPE_PUBLIC_KEY=<your_stripe_public_key>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
MUX_TOKEN_ID=<your_mux_token_id>
MUX_TOKEN_SECRET=<your_mux_token_secret>
COURSE_ID=<your_single_course_id>
INSTRUCTOR_EMAIL=<your_email@example.com>
PUBLIC_BASE_URL=http://localhost:3000
THEME_COLOR_PRIMARY=#6b5b95
THEME_COLOR_SECONDARY=#feb236

INSTRUCTOR_EMAIL auto-redirects the instructor to the dashboard after login.

### Appwrite Collections

Courses: title, description, thumbnail_url, price
Lessons: course_id, title, text_content, playback_id, order
Students: email, paid, current_lesson_id, progress (array), transaction_id
Add yourself as a student with paid: true and role: instructor to enable dashboard access.
## API Routes
Instructor / Course Management
/api/course/create – create a course (instructor only)
/api/course/update – update course details
/api/course/get – fetch course info (public)
/api/lesson/create – add lesson to course
/api/lesson/update – update lesson
/api/lesson/get – list lessons for a course

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
                                | Remaining lessons   |
                                | sequentially        |
                                | unlocked as         |
                                | completed           |
                                +---------------------+
## Frontend Structure
/src/pages
  /student.astro        # Student view
  /instructor.astro     # Instructor dashboard
  /sign-in.astro        # Clerk login
/src/pages/api
  /course/create.ts
  /course/update.ts
  /lesson/create.ts
  /lesson/update.ts
  /lesson/get.ts
  /stripe/checkout.ts
  /stripe/webhook.ts
/src/components
  ClerkProvider.astro
  LessonCard.astro
  ProgressBar.astro
/src/lib
  appwrite.ts           # Appwrite helpers
  mux.ts                # Mux helpers
  stripe.ts             # Stripe helpers

### Theme Customization

THEME_COLOR_PRIMARY=#6b5b95
THEME_COLOR_SECONDARY=#feb236
