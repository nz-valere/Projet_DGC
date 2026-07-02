import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, UserPlus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ClasseResponse, StudentResponse } from "@/api/types";
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
import { useClasses } from "@/features/classes/api";
import { useCreateStudent, useUpdateStudent } from "./api";

const NO_FILIERE = "- -";

const baseFields = {
  nom: z.string().trim().min(1, "Le nom est requis."),
  prenom: z.string().trim().min(1, "Le prénom est requis."),
  classe_id: z.string().trim().min(1, "La classe est requise."),
  annee_academique: z
    .string()
    .trim()
    .min(1, "L'année académique est requise.")
    .regex(/^\d{4}-\d{4}$/, "Format attendu : 2025-2026."),
  notes_inscription: z.string().optional(),
};

const createSchema = z.object({
  ...baseFields,
  email: z.string().trim().min(1, "L'adresse e-mail est requise.").email("Adresse e-mail invalide."),
});

const editSchema = z.object(baseFields);

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si fourni : mode édition. Sinon : nouvelle inscription. */
  student?: StudentResponse;
}

export function StudentFormDialog({ open, onOpenChange, student }: StudentFormDialogProps) {
  return student ? (
    <StudentEditForm key={student.id} open={open} onOpenChange={onOpenChange} student={student} />
  ) : (
    <StudentCreateForm open={open} onOpenChange={onOpenChange} />
  );
}

/**
 * Sélecteur de classe + récapitulatif (filière / année déduites de la classe).
 * La filière n'a pas d'existence propre : elle vient de la classe choisie.
 */
function ClasseField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const classesQuery = useClasses();
  const classes = classesQuery.data ?? [];
  const selected = classes.find((c) => c.id === value);

  return (
    <FormItem>
      <FormLabel>Classe</FormLabel>
      <Select value={value} onValueChange={onChange} disabled={classesQuery.isPending}>
        <FormControl>
          <SelectTrigger>
            <SelectValue
              placeholder={classesQuery.isPending ? "Chargement…" : "Sélectionner une classe"}
            />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {classes.map((classe) => (
            <SelectItem key={classe.id} value={classe.id}>
              {classeLabel(classe)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>
        {selected
          ? `Filière : ${selected.filiere || NO_FILIERE}${selected.niveau ? ` · Niveau : ${selected.niveau}` : ""}`
          : classes.length === 0 && !classesQuery.isPending
            ? "Aucune classe — créez-en une dans « Classes »."
            : "La filière est déduite de la classe."}
      </FormDescription>
      <FormMessage />
    </FormItem>
  );
}

function classeLabel(classe: ClasseResponse): string {
  const filiere = classe.filiere ? ` — ${classe.filiere}` : "";
  const niveau = classe.niveau ? ` (${classe.niveau})` : "";
  return `${classe.nom}${filiere}${niveau}`;
}

function StudentCreateForm({
  open,
  onOpenChange,
}: Pick<StudentFormDialogProps, "open" | "onOpenChange">) {
  const createStudent = useCreateStudent();

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      classe_id: "",
      annee_academique: "",
      notes_inscription: "",
    },
  });

  React.useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await createStudent.mutateAsync({
      ...values,
      notes_inscription: values.notes_inscription?.trim() || null,
    });
    onOpenChange(false);
  });

  const pending = createStudent.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Nouvelle demande d'inscription"
      description="L'étudiant recevra un e-mail d'activation pour définir son mot de passe et activer son compte."
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
                    <Input placeholder="ex. Nzodjo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="ex. Valère" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse e-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="etudiant@exemple.com" {...field} />
                </FormControl>
                <FormDescription>
                  Le lien d'activation y sera envoyé. L'étudiant choisira lui-même son mot de passe.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="classe_id"
              render={({ field }) => <ClasseField value={field.value} onChange={field.onChange} />}
            />
            <FormField
              control={form.control}
              name="annee_academique"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Année académique</FormLabel>
                  <FormControl>
                    <Input placeholder="2025-2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes_inscription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes d'inscription</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Pièces manquantes, observations…"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Facultatif — visible uniquement par le personnel.</FormDescription>
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
              {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
              Créer la demande
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}

function StudentEditForm({
  open,
  onOpenChange,
  student,
}: Required<StudentFormDialogProps>) {
  const updateStudent = useUpdateStudent(student.id);

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nom: student.nom,
      prenom: student.prenom,
      classe_id: student.classe_id ?? "",
      annee_academique: student.annee_academique,
      notes_inscription: student.notes_inscription ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateStudent.mutateAsync({
      ...values,
      notes_inscription: values.notes_inscription?.trim() || null,
    });
    onOpenChange(false);
  });

  const pending = updateStudent.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title={`Modifier — ${student.prenom} ${student.nom}`}
      description={`Matricule ${student.matricule}`}
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="classe_id"
              render={({ field }) => <ClasseField value={field.value} onChange={field.onChange} />}
            />
            <FormField
              control={form.control}
              name="annee_academique"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Année académique</FormLabel>
                  <FormControl>
                    <Input placeholder="2025-2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes_inscription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes d'inscription</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
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
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
