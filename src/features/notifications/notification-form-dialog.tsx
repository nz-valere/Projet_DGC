import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUsers } from "@/features/users/api";
import { CANAL_ENVOI, ROLE_LABELS } from "@/lib/labels";
import { useCreateNotification } from "./api";

const schema = z.object({
  destinataire_id: z.string().min(1, "Le destinataire est requis."),
  canal: z.enum(["SMS", "WHATSAPP", "EMAIL"], { required_error: "Le canal est requis." }),
  message: z.string().trim().min(1, "Le message est requis.").max(1000, "1000 caractères maximum."),
});

type Values = z.infer<typeof schema>;

interface NotificationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationFormDialog({ open, onOpenChange }: NotificationFormDialogProps) {
  const createNotification = useCreateNotification();
  const usersQuery = useUsers();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { destinataire_id: "", canal: "EMAIL", message: "" },
  });

  React.useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const users = usersQuery.data ?? [];
  const message = form.watch("message");

  const onSubmit = form.handleSubmit(async (values) => {
    await createNotification.mutateAsync({
      destinataire_id: values.destinataire_id,
      canal: values.canal,
      message: values.message.trim(),
    });
    onOpenChange(false);
  });

  const pending = createNotification.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Envoyer une notification"
      description="L'envoi part en arrière-plan ; en cas d'échec, un canal de secours peut prendre le relais."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="destinataire_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destinataire</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={usersQuery.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={usersQuery.isPending ? "Chargement…" : "Sélectionner"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nom || u.prenom ? `${(u.nom ?? "").toUpperCase()} ${u.prenom ?? ""} — ` : ""}
                        {u.email} ({ROLE_LABELS[u.role]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="canal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canal d'envoi</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CANAL_ENVOI).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="ex. Rappel : la réunion parents-professeurs a lieu vendredi à 17 h."
                    {...field}
                  />
                </FormControl>
                <FormDescription>{message.length} / 1000 caractères.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              Envoyer
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
