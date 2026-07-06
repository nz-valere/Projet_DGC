import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AttendanceResponse } from "@/api/types";
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
import { STATUT_PRESENCE } from "@/lib/labels";
import { useCorrectAttendance } from "./api";

const schema = z.object({
  statut: z.enum(["PRESENT", "ABSENT", "RETARD", "JUSTIFIE", "EXCLU", "PERMISSION"]),
  motif_correction: z.string().trim().min(1, "Le motif de correction est requis (traçabilité)."),
  justificatif: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface AttendanceCorrectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: AttendanceResponse;
  /** Libellé « NOM Prénom » de l'étudiant concerné, si connu. */
  studentName?: string;
}

export function AttendanceCorrectDialog({
  open,
  onOpenChange,
  attendance,
  studentName,
}: AttendanceCorrectDialogProps) {
  const correct = useCorrectAttendance(attendance.id);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      statut: attendance.statut,
      motif_correction: "",
      justificatif: attendance.justificatif ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await correct.mutateAsync({
      statut: values.statut,
      motif_correction: values.motif_correction.trim(),
      justificatif: values.justificatif?.trim() || null,
    });
    onOpenChange(false);
  });

  const pending = correct.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Corriger la présence"
      description={
        studentName
          ? `${studentName} — le statut précédent est conservé dans l'historique.`
          : "Le statut précédent est conservé dans l'historique."
      }
    >
      <div className="mb-4 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">Statut actuel :</span>
        <EnumBadge map={STATUT_PRESENCE} value={attendance.statut} />
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="statut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau statut</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(STATUT_PRESENCE).map(([value, style]) => (
                      <SelectItem key={value} value={value}>
                        {style.label}
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
            name="motif_correction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motif de la correction</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="ex. Justificatif fourni après coup…"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Obligatoire — conservé dans l'historique d'audit.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="justificatif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Justificatif</FormLabel>
                <FormControl>
                  <Input placeholder="ex. certificat médical du 12/05" {...field} />
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
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              Corriger
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
