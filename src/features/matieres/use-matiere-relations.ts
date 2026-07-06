import { useQueries } from "@tanstack/react-query";
import * as React from "react";
import { api, unwrap } from "@/api/client";
import type { ClasseResponse, StudentResponse } from "@/api/types";
import { classeKeys, useClasses } from "@/features/classes/api";
import { useStudents } from "@/features/students/api";

interface MatiereRelations {
  /** Classes où cette matière est enseignée. */
  teachingClasses: ClasseResponse[];
  /** Étudiants inscrits dans ces classes (donc concernés par la matière). */
  students: StudentResponse[];
  isLoading: boolean;
}

/**
 * Aucune relation directe matière → étudiants en base : on la reconstruit.
 * Matière → classes qui l'enseignent (/classes/{id}/matieres) → étudiants de ces classes.
 */
export function useMatiereRelations(matiereId: string): MatiereRelations {
  const classesQuery = useClasses();
  const studentsQuery = useStudents();
  const classes = React.useMemo(() => classesQuery.data ?? [], [classesQuery.data]);

  // Une requête « matières de la classe » par classe, en parallèle (cache partagé).
  const matieresResults = useQueries({
    queries: classes.map((classe) => ({
      queryKey: classeKeys.matieres(classe.id),
      queryFn: async () =>
        unwrap(
          await api.GET("/classes/{classe_id}/matieres", {
            params: { path: { classe_id: classe.id } },
          }),
        ),
      enabled: matiereId !== "" && classes.length > 0,
    })),
  });

  return React.useMemo(() => {
    const teachingClassIds = new Set<string>();
    classes.forEach((classe, index) => {
      const matieres = matieresResults[index]?.data ?? [];
      if (matieres.some((m) => m.matiere.id === matiereId)) teachingClassIds.add(classe.id);
    });

    const teachingClasses = classes.filter((c) => teachingClassIds.has(c.id));
    const students = (studentsQuery.data ?? []).filter(
      (s) => s.classe_id !== null && s.classe_id !== undefined && teachingClassIds.has(s.classe_id),
    );

    const isLoading =
      classesQuery.isPending ||
      studentsQuery.isPending ||
      matieresResults.some((r) => r.isPending && r.fetchStatus !== "idle");

    return { teachingClasses, students, isLoading };
  }, [classes, matieresResults, studentsQuery.data, classesQuery.isPending, studentsQuery.isPending]);
}
