import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { NotificationCreate } from "@/api/types";

/** L'API ne renvoie pas de total : on charge large et on filtre côté client. */
const LIST_LIMIT = 2000;

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(),
    enabled,
    // L'envoi est asynchrone côté backend : on rafraîchit pour voir les statuts évoluer.
    refetchInterval: 15_000,
    queryFn: async () =>
      unwrap(await api.GET("/notifications/", { params: { query: { limit: LIST_LIMIT } } })),
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: NotificationCreate) =>
      unwrap(await api.POST("/notifications/", { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success("Notification créée — envoi en cours.");
    },
  });
}

/** Renvoie une notification en attente ou en échec. */
export function useResendNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) =>
      unwrap(
        await api.POST("/notifications/{notification_id}/send", {
          params: { path: { notification_id: notificationId } },
        }),
      ),
    onSuccess: (notification) => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(
        notification.statut_envoi === "ENVOYE"
          ? "Notification envoyée."
          : "Renvoi tenté — consultez le statut.",
      );
    },
  });
}
