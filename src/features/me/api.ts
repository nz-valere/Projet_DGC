import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_URL, ApiError, api, getAuthToken, unwrap } from "@/api/client";
import type { TypeDocument } from "@/api/types";

export const meKeys = {
  all: ["me"] as const,
  profile: () => [...meKeys.all, "profile"] as const,
  grades: () => [...meKeys.all, "grades"] as const,
  attendance: () => [...meKeys.all, "attendance"] as const,
  payments: () => [...meKeys.all, "payments"] as const,
  disciplines: () => [...meKeys.all, "disciplines"] as const,
  documents: () => [...meKeys.all, "documents"] as const,
};

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: meKeys.profile(),
    enabled,
    queryFn: async () => unwrap(await api.GET("/me/profile", {})),
  });
}

export function useMyGrades() {
  return useQuery({
    queryKey: meKeys.grades(),
    queryFn: async () => unwrap(await api.GET("/me/grades", {})),
  });
}

export function useMyAttendance() {
  return useQuery({
    queryKey: meKeys.attendance(),
    queryFn: async () => unwrap(await api.GET("/me/attendance", {})),
  });
}

export function useMyPayments() {
  return useQuery({
    queryKey: meKeys.payments(),
    queryFn: async () => unwrap(await api.GET("/me/payments", {})),
  });
}

export function useMyDisciplines() {
  return useQuery({
    queryKey: meKeys.disciplines(),
    queryFn: async () => unwrap(await api.GET("/me/disciplines", {})),
  });
}

export function useMyDocuments() {
  return useQuery({
    queryKey: meKeys.documents(),
    queryFn: async () => unwrap(await api.GET("/me/documents", {})),
  });
}

/** Upload multipart : géré par fetch direct (le client typé ne sérialise pas les fichiers). */
export function useUploadMyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ typeDocument, file }: { typeDocument: TypeDocument; file: File }) => {
      const form = new FormData();
      form.append("type_document", typeDocument);
      form.append("file", file);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/me/documents`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!response.ok) {
        let message = "Échec de l'envoi du document.";
        try {
          const parsed = (await response.json()) as { detail?: unknown };
          if (typeof parsed.detail === "string") message = parsed.detail;
        } catch {
          // corps non-JSON : message générique
        }
        throw new ApiError(response.status, message);
      }
      return response.json().catch(() => null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meKeys.documents() });
      toast.success("Document envoyé.");
    },
  });
}
