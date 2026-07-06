import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { PaymentCancel, PaymentCreate } from "@/api/types";
import { studentKeys } from "@/features/students/api";

/** L'API ne renvoie pas de total : on charge large et on filtre côté client. */
const LIST_LIMIT = 5000;

export const paymentKeys = {
  all: ["payments"] as const,
  list: () => [...paymentKeys.all, "list"] as const,
};

export function usePayments(enabled = true) {
  return useQuery({
    queryKey: paymentKeys.list(),
    enabled,
    queryFn: async () =>
      unwrap(await api.GET("/payments/", { params: { query: { limit: LIST_LIMIT } } })),
  });
}

/** Invalide la liste globale ET les onglets « Paiements » des fiches étudiants. */
function useInvalidatePayments() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    void queryClient.invalidateQueries({ queryKey: studentKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  };
}

export function useCreatePayment() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: async (body: PaymentCreate) => unwrap(await api.POST("/payments/", { body })),
    onSuccess: (payment) => {
      invalidate();
      toast.success(`Encaissement enregistré — reçu n° ${payment.numero_recu}.`);
    },
  });
}

export function useCancelPayment(paymentId: string) {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: async (body: PaymentCancel) =>
      unwrap(
        await api.POST("/payments/{payment_id}/cancel", {
          params: { path: { payment_id: paymentId } },
          body,
        }),
      ),
    onSuccess: () => {
      invalidate();
      toast.success("Paiement annulé (motif conservé pour l'audit).");
    },
  });
}
