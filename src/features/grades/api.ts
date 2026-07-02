import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { GradeCreate, GradeUpdate, StatutNote } from "@/api/types";
import { studentKeys } from "@/features/students/api";

/** L'API ne renvoie pas de total : on charge large et on filtre côté client. */
const LIST_LIMIT = 2000;

export const gradeKeys = {
  all: ["grades"] as const,
  list: () => [...gradeKeys.all, "list"] as const,
};

/** Toutes les notes (filtrées ensuite par matière / classe / statut côté client). */
export function useGrades(enabled = true) {
  return useQuery({
    queryKey: gradeKeys.list(),
    enabled,
    queryFn: async () =>
      unwrap(await api.GET("/grades/", { params: { query: { limit: LIST_LIMIT } } })),
  });
}

/** Invalide les notes globales ET les onglets « Notes » des fiches étudiants. */
function useInvalidateGrades() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: gradeKeys.all });
    void queryClient.invalidateQueries({ queryKey: studentKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  };
}

export function useCreateGrade() {
  const invalidate = useInvalidateGrades();
  return useMutation({
    mutationFn: async (body: GradeCreate) => unwrap(await api.POST("/grades/", { body })),
    onSuccess: () => {
      invalidate();
      toast.success("Note saisie — en attente de validation.");
    },
  });
}

export function useUpdateGrade(gradeId: string) {
  const invalidate = useInvalidateGrades();
  return useMutation({
    mutationFn: async (body: GradeUpdate) =>
      unwrap(
        await api.PUT("/grades/{grade_id}", {
          params: { path: { grade_id: gradeId } },
          body,
        }),
      ),
    onSuccess: () => {
      invalidate();
      toast.success("Note modifiée (motif conservé pour l'audit).");
    },
  });
}

export function useValidateGrade() {
  const invalidate = useInvalidateGrades();
  return useMutation({
    mutationFn: async ({ gradeId, statut }: { gradeId: string; statut: StatutNote }) =>
      unwrap(
        await api.POST("/grades/{grade_id}/validate", {
          params: { path: { grade_id: gradeId } },
          body: { statut },
        }),
      ),
    onSuccess: (grade) => {
      invalidate();
      toast.success(grade.statut === "REJETE" ? "Note rejetée." : "Note validée.");
    },
  });
}

export function usePublishGrade() {
  const invalidate = useInvalidateGrades();
  return useMutation({
    mutationFn: async (gradeId: string) =>
      unwrap(
        await api.POST("/grades/{grade_id}/publish", {
          params: { path: { grade_id: gradeId } },
        }),
      ),
    onSuccess: () => {
      invalidate();
      toast.success("Note publiée — visible par l'étudiant.");
    },
  });
}
