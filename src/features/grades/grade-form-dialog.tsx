import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardPlus, Loader2, Save } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { GradeResponse } from "@/api/types";
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
import { useClasseMatieres, useClasses } from "@/features/classes/api";
import { useStudents } from "@/features/students/api";
import { useUsers } from "@/features/users/api";
import { SEMESTRE_LABELS, TYPE_EVALUATION_LABELS } from "@/lib/labels";
import { academicYearOptions, currentAcademicYear } from "@/lib/utils";
import { useCreateGrade, useUpdateGrade } from "./api";

const createSchema = z
  .object({
    classe_id: z.string().min(1, "La classe est requise."),
    student_id: z.string().min(1, "L'étudiant est requis."),
    matiere_id: z.string().min(1, "La matière est requise."),
    enseignant_id: z.string().min(1, "L'enseignant est requis."),
    valeur: z.coerce.number({ invalid_type_error: "Note invalide." }).min(0, "Note invalide."),
    bareme: z.coerce.number({ invalid_type_error: "Barème invalide." }).min(1, "Barème invalide."),
    appreciation: z.string().optional(),
    annee_academique: z
      .string()
      .regex(/^\d{4}-\d{4}$/, "Format attendu : AAAA-AAAA (ex. 2025-2026)."),
    semestre: z.enum(["S1", "S2"], { required_error: "Le semestre est requis." }),
    type_evaluation: z.enum(["CC", "PROJET", "EXAMEN_FINAL"], {
      required_error: "Le type d'évaluation est requis.",
    }),
  })
  .refine((values) => values.valeur <= values.bareme, {
    message: "La note dépasse le barème.",
    path: ["valeur"],
  });

const editSchema = z.object({
  valeur: z.coerce.number({ invalid_type_error: "Note invalide." }).min(0, "Note invalide."),
  appreciation: z.string().optional(),
  motif_modification: z.string().trim().min(1, "Le motif est requis (traçabilité)."),
});

type CreateValues = z.input<typeof createSchema>;
type EditValues = z.input<typeof editSchema>;

interface GradeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si fournie : mode édition (motif obligatoire). Sinon : saisie. */
  grade?: GradeResponse;
}

export function GradeFormDialog({ open, onOpenChange, grade }: GradeFormDialogProps) {
  return grade ? (
    <GradeEditForm key={grade.id} open={open} onOpenChange={onOpenChange} grade={grade} />
  ) : (
    <GradeCreateForm open={open} onOpenChange={onOpenChange} />
  );
}

function GradeCreateForm({
  open,
  onOpenChange,
}: Pick<GradeFormDialogProps, "open" | "onOpenChange">) {
  const user = useCurrentUser();
  const isEnseignant = user.role === "ENSEIGNANT";
  const createGrade = useCreateGrade();

  const classesQuery = useClasses();
  const studentsQuery = useStudents();
  const enseignantsQuery = useUsers(isEnseignant ? undefined : "ENSEIGNANT");

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      classe_id: "",
      student_id: "",
      matiere_id: "",
      enseignant_id: isEnseignant ? user.id : "",
      valeur: "" as unknown as number,
      bareme: 20,
      appreciation: "",
      annee_academique: currentAcademicYear(),
      semestre: "S1",
      type_evaluation: "CC",
    },
  });

  React.useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const classeId = form.watch("classe_id");
  const matieresQuery = useClasseMatieres(classeId);

  const classes = classesQuery.data ?? [];
  const students = React.useMemo(
    () => (studentsQuery.data ?? []).filter((s) => s.classe_id === classeId),
    [studentsQuery.data, classeId],
  );
  const matieres = matieresQuery.data ?? [];
  const enseignants = enseignantsQuery.data ?? [];

  const onSubmit = form.handleSubmit(async (values) => {
    await createGrade.mutateAsync({
      student_id: values.student_id,
      matiere_id: values.matiere_id,
      enseignant_id: values.enseignant_id,
      valeur: Number(values.valeur),
      bareme: Number(values.bareme),
      appreciation: values.appreciation?.trim() || null,
      annee_academique: values.annee_academique,
      semestre: values.semestre,
      type_evaluation: values.type_evaluation,
    });
    onOpenChange(false);
  });

  const pending = createGrade.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Saisir une note"
      description="La note est créée « en attente » puis validée et publiée par la direction."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="classe_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classe</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("student_id", "");
                      form.setValue("matiere_id", "");
                    }}
                    disabled={classesQuery.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((classe) => (
                        <SelectItem key={classe.id} value={classe.id}>
                          {classe.nom} — {classe.filiere || "—"}
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
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Étudiant</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!classeId || studentsQuery.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={!classeId ? "Choisissez d'abord une classe" : "Sélectionner"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.nom.toUpperCase()} {student.prenom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {classeId && !studentsQuery.isPending && students.length === 0 ? (
                    <FormDescription>Aucun étudiant dans cette classe.</FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="matiere_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matière</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!classeId || matieresQuery.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={!classeId ? "Choisissez d'abord une classe" : "Sélectionner"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {matieres.map((entry) => (
                      <SelectItem key={entry.matiere.id} value={entry.matiere.id}>
                        {entry.matiere.nom} — coef. {entry.coefficient}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {classeId && !matieresQuery.isPending && matieres.length === 0 ? (
                  <FormDescription>
                    Aucune matière au programme de cette classe — gérez-les dans « Classes ».
                  </FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="annee_academique"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Année académique</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {academicYearOptions().map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
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
              name="semestre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semestre</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SEMESTRE_LABELS).map(([value, label]) => (
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
              name="type_evaluation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Évaluation</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TYPE_EVALUATION_LABELS).map(([value, label]) => (
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
          </div>

          {!isEnseignant ? (
            <FormField
              control={form.control}
              name="enseignant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enseignant</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={enseignantsQuery.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {enseignants.map((enseignant) => (
                        <SelectItem key={enseignant.id} value={enseignant.id}>
                          {enseignant.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="valeur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.25" min="0" placeholder="ex. 14.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bareme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barème</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" min="1" {...field} />
                  </FormControl>
                  <FormDescription>Sur 20 par défaut.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="appreciation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appréciation</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="ex. Bon trimestre, poursuivez…" {...field} />
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
              {pending ? <Loader2 className="animate-spin" /> : <ClipboardPlus />}
              Saisir la note
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}

function GradeEditForm({
  open,
  onOpenChange,
  grade,
}: Required<GradeFormDialogProps>) {
  const updateGrade = useUpdateGrade(grade.id);

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      valeur: grade.valeur,
      appreciation: grade.appreciation ?? "",
      motif_modification: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateGrade.mutateAsync({
      valeur: Number(values.valeur),
      appreciation: values.appreciation?.trim() || null,
      motif_modification: values.motif_modification.trim(),
    });
    onOpenChange(false);
  });

  const pending = updateGrade.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Modifier la note"
      description={`Note actuelle : ${grade.valeur} / ${grade.bareme}. Toute modification est tracée avec son motif.`}
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="valeur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouvelle note (sur {grade.bareme})</FormLabel>
                <FormControl>
                  <Input type="number" step="0.25" min="0" max={grade.bareme} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appreciation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appréciation</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motif_modification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motif de la modification</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="ex. Erreur de report, réclamation acceptée…"
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
