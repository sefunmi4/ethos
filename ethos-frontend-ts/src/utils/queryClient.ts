import { QueryClient } from '@tanstack/react-query';

/**
 * 🔁 Global instance of React Query's QueryClient.
 * 
 * This client manages caching, background updates,
 * and retries for all queries in the app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Limit retries
      refetchOnWindowFocus: false, // Prevent refetching on tab switch
      staleTime: 1000 * 60, // Data is fresh for 1 min
    },
  },
});