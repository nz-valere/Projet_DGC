import { zodResolver } from "@hookform/resolvers/zod";
import { Gavel, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/auth-context";
import { useStudents } from "@/features/students/api";
import { GRAVITE_SANCTION } from "@/lib/labels";
import { useCreateDiscipline } from "./api";

const schema = z.object({
  student_id: z.string().min(1, "L'étudiant est requis."),
  nature: z.string().trim().min(1, "La nature de l'incident est requise."),
  gravite: z.enum(["AVERTISSEMENT", "BLAME", "EXCLUSION_TEMP", "EXCLUSION_DEF"], {
    required_error: "La gravité est requise.",
  }),
  sanction: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface DisciplineFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DisciplineFormDialog({ open, onOpenChange }: DisciplineFormDialogProps) {
  const user = useCurrentUser();
  const createDiscipline = useCreateDiscipline();
  const studentsQuery = useStudents();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { student_id: "", nature: "", gravite: "AVERTISSEMENT", sanction: "" },
  });

  React.useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const gravite = form.watch("gravite");
  const isExclusion = gravite === "EXCLUSION_TEMP" || gravite === "EXCLUSION_DEF";

  const students = studentsQuery.data ?? [];

  const onSubmit = form.handleSubmit(async (values) => {
    await createDiscipline.mutateAsync({
      student_id: values.student_id,
      nature: values.nature.trim(),
      gravite: values.gravite,
      sanction: values.sanction?.trim() || null,
      cree_par: user.id,
    });
    onOpenChange(false);
  });

  const pending = createDiscipline.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Nouvelle fiche d'incident"
      description="La sanction est créée « en attente » puis validée selon sa gravité."
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nature de l'incident</FormLabel>
                <FormControl>
                  <Input placeholder="ex. Absences répétées, tricherie à l'examen…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gravite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gravité</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(GRAVITE_SANCTION).map(([value, style]) => (
                      <SelectItem key={value} value={value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isExclusion ? (
                  <FormDescription className="text-amber-700">
                    Une exclusion doit être validée par la DIRECTION ; sa validation suspend le
                    compte de l'étudiant.
                  </FormDescription>
                ) : (
                  <FormDescription>
                    Avertissement et blâme sont validés par l'administration.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sanction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sanction proposée</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="ex. Exclusion de 3 jours, travail d'intérêt général…"
                    {...field}
                  />
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
              {pending ? <Loader2 className="animate-spin" /> : <Gavel />}
              Créer la fiche
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
