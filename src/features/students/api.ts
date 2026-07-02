import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { ParentCreate, StudentCreate, StudentUpdate } from "@/api/types";

/** L'API ne renvoie pas de total : on charge large et on filtre/pagine côté client. */
const LIST_LIMIT = 1000;

export const studentKeys = {
  all: ["students"] as const,
  list: () => [...studentKeys.all, "list"] as const,
  detail: (id: string) => [...studentKeys.all, "detail", id] as const,
  grades: (id: string) => [...studentKeys.all, "grades", id] as const,
  attendance: (id: string) => [...studentKeys.all, "attendance", id] as const,
  payments: (id: string) => [...studentKeys.all, "payments", id] as const,
  disciplines: (id: string) => [...studentKeys.all, "disciplines", id] as const,
  parents: (id: string) => [...studentKeys.all, "parents", id] as const,
  documents: (id: string) => [...studentKeys.all, "documents", id] as const,
};

export function useStudents(enabled = true) {
  return useQuery({
    queryKey: studentKeys.list(),
    enabled,
    queryFn: async () =>
      unwrap(await api.GET("/students/", { params: { query: { limit: LIST_LIMIT } } })),
  });
}

export function useStudent(studentId: string) {
  return useQuery({
    queryKey: studentKeys.detail(studentId),
    queryFn: async () =>
      unwrap(
        await api.GET("/students/{student_id}", {
          params: { path: { student_id: studentId } },
        }),
      ),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: StudentCreate) => unwrap(await api.POST("/students/", { body })),
    onSuccess: (student) => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast.success(
        `Demande créée pour ${student.prenom} ${student.nom}. Un e-mail d'activation a été envoyé.`,
      );
    },
  });
}

export function useUpdateStudent(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: StudentUpdate) =>
      unwrap(
        await api.PUT("/students/{student_id}", {
          params: { path: { student_id: studentId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast.success("Dossier étudiant mis à jour.");
    },
  });
}

export function useValidateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) =>
      unwrap(
        await api.POST("/students/{student_id}/validate", {
          params: { path: { student_id: studentId } },
        }),
      ),
    onSuccess: (student) => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast.success(`Inscription validée — matricule ${student.matricule}.`);
    },
  });
}

export function useRejectStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, motif }: { studentId: string; motif: string }) =>
      unwrap(
        await api.POST("/students/{student_id}/reject", {
          params: { path: { student_id: studentId } },
          body: { motif },
        }),
      ),
    onSuccess: (student) => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast.success(`Demande de ${student.prenom} ${student.nom} rejetée.`);
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) =>
      unwrap(
        await api.DELETE("/students/{student_id}", {
          params: { path: { student_id: studentId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast.success("Dossier étudiant supprimé.");
    },
  });
}

export function useStudentGrades(studentId: string) {
  return useQuery({
    queryKey: studentKeys.grades(studentId),
    queryFn: async () =>
      unwrap(
        await api.GET("/grades/student/{student_id}", {
          params: { path: { student_id: studentId } },
        }),
      ),
  });
}

export function useStudentAttendance(studentId: string) {
  return useQuery({
    queryKey: studentKeys.attendance(studentId),
    queryFn: async () =>
      unwrap(
        await api.GET("/attendance/student/{student_id}", {
          params: { path: { student_id: studentId } },
        }),
      ),
  });
}

export function useStudentPayments(studentId: string) {
  return useQuery({
    queryKey: studentKeys.payments(studentId),
    queryFn: async () =>
      unwrap(
        await api.GET("/payments/student/{student_id}", {
          params: { path: { student_id: studentId } },
        }),
      ),
  });
}

export function useStudentParents(studentId: string) {
  return useQuery({
    queryKey: studentKeys.parents(studentId),
    enabled: studentId !== "",
    queryFn: async () =>
      unwrap(
        await api.GET("/students/{student_id}/parents", {
          params: { path: { student_id: studentId } },
        }),
      ),
  });
}

export function useAddStudentParent(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ParentCreate) =>
      unwrap(
        await api.POST("/students/{student_id}/parents", {
          params: { path: { student_id: studentId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.parents(studentId) });
      toast.success("Parent / tuteur ajouté.");
    },
  });
}

export function useStudentDocuments(studentId: string) {
  return useQuery({
    queryKey: studentKeys.documents(studentId),
    enabled: studentId !== "",
    queryFn: async () =>
      unwrap(
        await api.GET("/students/{student_id}/documents", {
          params: { path: { student_id: studentId } },
        }),
      ),
  });
}

export function useStudentDisciplines(studentId: string) {
  return useQuery({
    queryKey: studentKeys.disciplines(studentId),
    queryFn: async () =>
      unwrap(
        await api.GET("/disciplines/student/{student_id}", {
          params: { path: { student_id: studentId } },
        }),
      ),
  });
}
