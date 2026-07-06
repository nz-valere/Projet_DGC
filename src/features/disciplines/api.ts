import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { DisciplineCreate, DisciplineValidate } from "@/api/types";
import { studentKeys } from "@/features/students/api";

/** L'API ne renvoie pas de total : on charge large et on filtre côté client. */
const LIST_LIMIT = 2000;

export const disciplineKeys = {
  all: ["disciplines"] as const,
  list: () => [...disciplineKeys.all, "list"] as const,
};

export function useDisciplines(enabled = true) {
  return useQuery({
    queryKey: disciplineKeys.list(),
    enabled,
    queryFn: async () =>
      unwrap(await api.GET("/disciplines/", { params: { query: { limit: LIST_LIMIT } } })),
  });
}

/** Invalide la liste globale ET les onglets « Sanctions » des fiches étudiants. */
function useInvalidateDisciplines() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: disciplineKeys.all });
    void queryClient.invalidateQueries({ queryKey: studentKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  };
}

export function useCreateDiscipline() {
  const invalidate = useInvalidateDisciplines();
  return useMutation({
    mutationFn: async (body: DisciplineCreate) =>
      unwrap(await api.POST("/disciplines/", { body })),
    onSuccess: () => {
      invalidate();
      toast.success("Fiche d'incident créée — en attente de validation.");
    },
  });
}

export function useValidateDiscipline() {
  const invalidate = useInvalidateDisciplines();
  return useMutation({
    mutationFn: async ({
      disciplineId,
      ...body
    }: DisciplineValidate & { disciplineId: string }) =>
      unwrap(
        await api.POST("/disciplines/{discipline_id}/validate", {
          params: { path: { discipline_id: disciplineId } },
          body,
        }),
      ),
    onSuccess: (discipline) => {
      invalidate();
      toast.success(
        discipline.statut_validation === "REJETE"
          ? "Sanction rejetée."
          : discipline.compte_suspendu
            ? "Sanction validée — le compte de l'étudiant est suspendu."
            : "Sanction validée.",
      );
    },
  });
}
