import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { ClasseCreate, ClasseMatieres, ClasseUpdate } from "@/api/types";

/** L'API ne renvoie pas de total : on charge large et on filtre côté client. */
const LIST_LIMIT = 1000;

export const classeKeys = {
  all: ["classes"] as const,
  list: () => [...classeKeys.all, "list"] as const,
  detail: (id: string) => [...classeKeys.all, "detail", id] as const,
  students: (id: string) => [...classeKeys.all, "students", id] as const,
  matieres: (id: string) => [...classeKeys.all, "matieres", id] as const,
};

export function useClasses() {
  return useQuery({
    queryKey: classeKeys.list(),
    queryFn: async () =>
      unwrap(await api.GET("/classes/", { params: { query: { limit: LIST_LIMIT } } })),
  });
}

export function useClasse(classeId: string) {
  return useQuery({
    queryKey: classeKeys.detail(classeId),
    enabled: classeId !== "",
    queryFn: async () =>
      unwrap(
        await api.GET("/classes/{classe_id}", {
          params: { path: { classe_id: classeId } },
        }),
      ),
  });
}

export function useClasseMatieres(classeId: string) {
  return useQuery({
    queryKey: classeKeys.matieres(classeId),
    enabled: classeId !== "",
    queryFn: async () =>
      unwrap(
        await api.GET("/classes/{classe_id}/matieres", {
          params: { path: { classe_id: classeId } },
        }),
      ),
  });
}

export function useCreateClasse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ClasseCreate) => unwrap(await api.POST("/classes/", { body })),
    onSuccess: (classe) => {
      void queryClient.invalidateQueries({ queryKey: classeKeys.all });
      toast.success(`Classe « ${classe.nom} » créée.`);
    },
  });
}

export function useUpdateClasse(classeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ClasseUpdate) =>
      unwrap(
        await api.PUT("/classes/{classe_id}", {
          params: { path: { classe_id: classeId } },
          body,
        }),
      ),
    onSuccess: (classe) => {
      void queryClient.invalidateQueries({ queryKey: classeKeys.all });
      toast.success(`Classe « ${classe.nom} » mise à jour.`);
    },
  });
}

export function useDeleteClasse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classeId: string) =>
      unwrap(
        await api.DELETE("/classes/{classe_id}", {
          params: { path: { classe_id: classeId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classeKeys.all });
      toast.success("Classe supprimée.");
    },
  });
}

export function useSetClasseMatieres(classeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ClasseMatieres) =>
      unwrap(
        await api.PUT("/classes/{classe_id}/matieres", {
          params: { path: { classe_id: classeId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classeKeys.matieres(classeId) });
      toast.success("Matières de la classe mises à jour.");
    },
  });
}
