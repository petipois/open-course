/// <reference types="astro/client" />

declare namespace Astro {
  interface Locals {
    user?: {
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      // Add any other user fields you store from Clerk
    } | null;
  }
}
