import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, extractErrorMessage } from "./client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Inutile de réessayer sur une erreur métier (400/401/403/404/422)
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
  // Toute mutation en échec affiche le `detail` renvoyé par l'API
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  }),
});
