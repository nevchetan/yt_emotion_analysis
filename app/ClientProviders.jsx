"use client";

import { SessionProvider } from "next-auth/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Client Providers Wrapper
 *
 * Wraps the app with:
 * - ErrorBoundary: Catches component errors
 * - SessionProvider: Provides NextAuth session context
 */
export default function ClientProviders({ children }) {
  return (
    <ErrorBoundary>
      <SessionProvider>{children}</SessionProvider>
    </ErrorBoundary>
  );
}
