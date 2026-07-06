import { zodResolver } from "@hookform/resolvers/zod";
import { HandCoins, Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormDialog } from "@/components/shared/form-dialog";
import { EnumBadge } from "@/components/shared/status-badge";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStudents } from "@/features/students/api";
import { MODE_PAIEMENT, STATUT_PAIEMENT } from "@/lib/labels";
import { formatMoney } from "@/lib/utils";
import { useCreatePayment } from "./api";

const schema = z.object({
  student_id: z.string().min(1, "L'étudiant est requis."),
  montant: z.coerce
    .number({ invalid_type_error: "Montant invalide." })
    .positive("Le montant doit être positif."),
  montant_attendu: z.coerce
    .number({ invalid_type_error: "Montant invalide." })
    .positive("Le montant attendu doit être positif."),
  mode_paiement: z.enum(["ESPECES", "CHEQUE", "VIREMENT", "MOBILE_MONEY"], {
    required_error: "Le mode de paiement est requis.",
  }),
  notes: z.string().optional(),
});

type Values = z.input<typeof schema>;

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentFormDialog({ open, onOpenChange }: PaymentFormDialogProps) {
  const createPayment = useCreatePayment();
  const studentsQuery = useStudents();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: "",
      montant: "" as unknown as number,
      montant_attendu: "" as unknown as number,
      mode_paiement: "ESPECES",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  // Aperçu du statut calculé côté backend : < attendu → EN_ATTENTE,
  // = attendu → CONFIRME, > attendu → EXCEDENTAIRE.
  const montant = Number(form.watch("montant"));
  const attendu = Number(form.watch("montant_attendu"));
  const preview =
    Number.isFinite(montant) && Number.isFinite(attendu) && montant > 0 && attendu > 0
      ? montant > attendu
        ? ("EXCEDENTAIRE" as const)
        : montant === attendu
          ? ("CONFIRME" as const)
          : ("EN_ATTENTE" as const)
      : null;

  const students = React.useMemo(
    () => (studentsQuery.data ?? []).filter((s) => s.statut === "INSCRIT"),
    [studentsQuery.data],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    await createPayment.mutateAsync({
      student_id: values.student_id,
      montant: Number(values.montant),
      montant_attendu: Number(values.montant_attendu),
      mode_paiement: values.mode_paiement,
      notes: values.notes?.trim() || null,
    });
    onOpenChange(false);
  });

  const pending = createPayment.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Enregistrer un encaissement"
      description="Le numéro de reçu et la référence sont générés automatiquement."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="student_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Étudiant</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={studentsQuery.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={studentsQuery.isPending ? "Chargement…" : "Sélectionner"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.nom.toUpperCase()} {student.prenom} — {student.matricule}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Seuls les étudiants inscrits sont proposés.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="montant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant versé (FCFA)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="500" placeholder="ex. 150000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="montant_attendu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant attendu (FCFA)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="500" placeholder="ex. 150000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {preview ? (
            <div
              className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
              role="status"
            >
              <span className="text-muted-foreground">
                {formatMoney(montant)} sur {formatMoney(attendu)} — statut à l'enregistrement :
              </span>
              <EnumBadge map={STATUT_PAIEMENT} value={preview} />
            </div>
          ) : null}

          <FormField
            control={form.control}
            name="mode_paiement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mode de paiement</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(MODE_PAIEMENT).map(([value, label]) => (
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
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="ex. 2e tranche de scolarité…" {...field} />
                </FormControl>
                <FormDescription>Facultatif.</FormDescription>
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
              {pending ? <Loader2 className="animate-spin" /> : <HandCoins />}
              Encaisser
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
