import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { MatiereResponse } from "@/api/types";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateMatiere, useUpdateMatiere } from "./api";

const schema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis."),
  code: z.string().trim().min(1, "Le code est requis."),
  coefficient: z.coerce.number().min(0.1, "Coefficient invalide.").max(20, "Coefficient trop élevé."),
  filiere: z.string().optional(),
  description: z.string().optional(),
});

type Values = z.input<typeof schema>;

interface MatiereFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matiere?: MatiereResponse;
}

export function MatiereFormDialog({ open, onOpenChange, matiere }: MatiereFormDialogProps) {
  const isEdit = matiere !== undefined;
  const createMatiere = useCreateMatiere();
  const updateMatiere = useUpdateMatiere(matiere?.id ?? "");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: matiere?.nom ?? "",
      code: matiere?.code ?? "",
      coefficient: matiere?.coefficient ?? 1,
      filiere: matiere?.filiere ?? "",
      description: matiere?.description ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        nom: matiere?.nom ?? "",
        code: matiere?.code ?? "",
        coefficient: matiere?.coefficient ?? 1,
        filiere: matiere?.filiere ?? "",
        description: matiere?.description ?? "",
      });
    }
  }, [open, matiere, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      nom: values.nom,
      code: values.code,
      coefficient: Number(values.coefficient),
      filiere: values.filiere?.trim() || null,
      description: values.description?.trim() || null,
    };
    if (isEdit) {
      await updateMatiere.mutateAsync(payload);
    } else {
      await createMatiere.mutateAsync(payload);
    }
    onOpenChange(false);
  });

  const pending = createMatiere.isPending || updateMatiere.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title={isEdit ? `Modifier — ${matiere.nom}` : "Nouvelle matière"}
      description="Le catalogue des matières ; affectez-les ensuite aux classes et aux enseignants."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="ex. Algorithmique" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="ex. ALGO1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="coefficient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coefficient</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" min="0.1" {...field} />
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
                  <FormDescription>Facultatif.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Objectifs, contenu…" {...field} />
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
              {isEdit ? "Enregistrer" : "Créer la matière"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
