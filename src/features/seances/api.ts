import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { SeanceCreate } from "@/api/types";

const LIST_LIMIT = 1000;

export const seanceKeys = {
  all: ["seances"] as const,
  list: () => [...seanceKeys.all, "list"] as const,
};

export function useSeances(enabled = true) {
  return useQuery({
    queryKey: seanceKeys.list(),
    enabled,
    queryFn: async () =>
      unwrap(await api.GET("/seances/", { params: { query: { limit: LIST_LIMIT } } })),
  });
}

export function useCreateSeance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: SeanceCreate) => unwrap(await api.POST("/seances/", { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: seanceKeys.all });
      toast.success("Séance planifiée.");
    },
  });
}
