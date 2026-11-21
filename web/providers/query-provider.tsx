"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create the QueryClient only once using lazy initialization.
  // This prevents creating a new query client on every render,
  // which would otherwise reset the query cache.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Define default settings for all queries in the application.
        defaultOptions: {
          queries: {
            // Data remains fresh for 30 seconds after being fetched.
            // Fresh data generally does not need an immediate refetch.
            staleTime: 30_000,

            // Inactive query data stays cached for 5 minutes
            // before it can be garbage-collected.
            gcTime: 5 * 60_000,

            // Retry a failed query one additional time.
            retry: 1,

            // Do not automatically refetch stale queries
            // when the browser window/tab regains focus.
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Provide the QueryClient to the entire component tree.
  // Any child component can now use React Query hooks
  // such as useQuery, useMutation, and useQueryClient.
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
