import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib/query-client";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AuthInitializer } from "@/components/common/AuthInitializer";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SocketProvider } from "@/providers/SocketProvider";

export function AppProviders({ children }) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthInitializer>
              <SocketProvider>{children}</SocketProvider>
            </AuthInitializer>
            <Toaster position="top-right" />
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
