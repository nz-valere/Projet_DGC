import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { AttendanceCorrect, AttendanceCreate } from "@/api/types";
import { studentKeys } from "@/features/students/api";

/** L'API ne renvoie pas de total : on charge large et on filtre côté client. */
const LIST_LIMIT = 5000;

export const attendanceKeys = {
  all: ["attendance"] as const,
  list: () => [...attendanceKeys.all, "list"] as const,
};

export function useAttendance(enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.list(),
    enabled,
    queryFn: async () =>
      unwrap(await api.GET("/attendance/", { params: { query: { limit: LIST_LIMIT } } })),
  });
}

/** Invalide la liste globale ET les onglets « Présences » des fiches étudiants. */
function useInvalidateAttendance() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    void queryClient.invalidateQueries({ queryKey: studentKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  };
}

export function useCreateAttendance() {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: async (body: AttendanceCreate) =>
      unwrap(await api.POST("/attendance/", { body })),
    onSuccess: () => {
      invalidate();
      toast.success("Présence enregistrée.");
    },
  });
}

export function useCorrectAttendance(attendanceId: string) {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: async (body: AttendanceCorrect) =>
      unwrap(
        await api.PUT("/attendance/{attendance_id}", {
          params: { path: { attendance_id: attendanceId } },
          body,
        }),
      ),
    onSuccess: () => {
      invalidate();
      toast.success("Présence corrigée (statut précédent conservé pour l'audit).");
    },
  });
}
