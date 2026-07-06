import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import type { Semestre } from "@/api/types";

export const bulletinKeys = {
  all: ["bulletins"] as const,
  classe: (classeId: string, annee: string, semestre: Semestre) =>
    [...bulletinKeys.all, "classe", classeId, annee, semestre] as const,
  student: (studentId: string, semestre: Semestre, annee: string | null) =>
    [...bulletinKeys.all, "student", studentId, semestre, annee] as const,
  me: (semestre: Semestre, annee: string | null) =>
    [...bulletinKeys.all, "me", semestre, annee] as const,
};

/** Bulletins de toute la classe, déjà triés par rang côté service. */
export function useClasseBulletins(classeId: string, annee: string, semestre: Semestre) {
  return useQuery({
    queryKey: bulletinKeys.classe(classeId, annee, semestre),
    enabled: classeId !== "" && annee !== "",
    queryFn: async () =>
      unwrap(
        await api.GET("/classes/{classe_id}/bulletins", {
          params: {
            path: { classe_id: classeId },
            query: { annee_academique: annee, semestre },
          },
        }),
      ),
  });
}

/** Bulletin d'un étudiant (année par défaut : sa promotion). */
export function useStudentBulletin(
  studentId: string,
  semestre: Semestre,
  annee: string | null = null,
) {
  return useQuery({
    queryKey: bulletinKeys.student(studentId, semestre, annee),
    enabled: studentId !== "",
    queryFn: async () =>
      unwrap(
        await api.GET("/students/{student_id}/bulletin", {
          params: {
            path: { student_id: studentId },
            query: annee ? { semestre, annee_academique: annee } : { semestre },
          },
        }),
      ),
  });
}

/** Bulletin de l'étudiant connecté (ou de l'enfant du parent connecté). */
export function useMyBulletin(semestre: Semestre, annee: string | null = null) {
  return useQuery({
    queryKey: bulletinKeys.me(semestre, annee),
    queryFn: async () =>
      unwrap(
        await api.GET("/me/bulletin", {
          params: {
            query: annee ? { semestre, annee_academique: annee } : { semestre },
          },
        }),
      ),
  });
}
