import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server'
// Only protect specific routes, exclude API routes
const isProtectedRoute = createRouteMatcher([
   '/instructor(.*)',
    '/profile(.*)',
])

// Allow API routes and public routes
const isPublicRoute = createRouteMatcher([
  '/course(.*)', // Allow public routes
  '/', 
])

export const onRequest = clerkMiddleware((auth, context) => {
  const { redirectToSignIn, userId } = auth()
  // Skip authentication for public routes (including API routes)
  if (isPublicRoute(context.request)) {
    return
  }
  
  // Require authentication for protected routes
  if (!userId && isProtectedRoute(context.request)) {
    return redirectToSignIn()
  }
})