import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { PaymentResponse } from "@/api/types";
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
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/auth-context";
import { formatMoney } from "@/lib/utils";
import { useCancelPayment } from "./api";

const schema = z.object({
  motif_annulation: z.string().trim().min(1, "Le motif d'annulation est requis (traçabilité)."),
});

type Values = z.infer<typeof schema>;

interface PaymentCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentResponse;
  /** Libellé « NOM Prénom » de l'étudiant concerné, si connu. */
  studentName?: string;
}

export function PaymentCancelDialog({
  open,
  onOpenChange,
  payment,
  studentName,
}: PaymentCancelDialogProps) {
  const user = useCurrentUser();
  const cancelPayment = useCancelPayment(payment.id);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { motif_annulation: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await cancelPayment.mutateAsync({
      motif_annulation: values.motif_annulation.trim(),
      annule_par: user.id,
    });
    onOpenChange(false);
  });

  const pending = cancelPayment.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title={`Annuler le reçu n° ${payment.numero_recu}`}
      description={`${formatMoney(payment.montant)}${studentName ? ` — ${studentName}` : ""}. L'annulation est définitive et tracée.`}
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="motif_annulation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motif de l'annulation</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="ex. Erreur de saisie du montant, double encaissement…"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Obligatoire — conservé dans l'historique d'audit.</FormDescription>
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
              Retour
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Ban />}
              Annuler le paiement
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
