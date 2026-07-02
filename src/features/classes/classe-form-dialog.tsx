import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ClasseResponse } from "@/api/types";
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
import { Input } from "@/components/ui/input";
import { useCreateClasse, useUpdateClasse } from "./api";

const schema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis."),
  filiere: z.string().trim().min(1, "La filière est requise."),
  niveau: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface ClasseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si fourni : mode édition. Sinon : création. */
  classe?: ClasseResponse;
}

export function ClasseFormDialog({ open, onOpenChange, classe }: ClasseFormDialogProps) {
  const isEdit = classe !== undefined;
  const createClasse = useCreateClasse();
  const updateClasse = useUpdateClasse(classe?.id ?? "");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: classe?.nom ?? "",
      filiere: classe?.filiere ?? "",
      niveau: classe?.niveau ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        nom: classe?.nom ?? "",
        filiere: classe?.filiere ?? "",
        niveau: classe?.niveau ?? "",
      });
    }
  }, [open, classe, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values, niveau: values.niveau?.trim() || null };
    if (isEdit) {
      await updateClasse.mutateAsync(payload);
    } else {
      await createClasse.mutateAsync(payload);
    }
    onOpenChange(false);
  });

  const pending = createClasse.isPending || updateClasse.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title={isEdit ? `Modifier — ${classe.nom}` : "Nouvelle classe"}
      description="Une classe porte sa filière et son année académique ; les étudiants en héritent."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="ex. L1-A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="filiere"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filière</FormLabel>
                  <FormControl>
                    <Input placeholder="ex. Informatique" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="niveau"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau</FormLabel>
                <FormControl>
                  <Input placeholder="ex. Licence 1" {...field} />
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
              {isEdit ? "Enregistrer" : "Créer la classe"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
