import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader2 } from "lucide-react";
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
import { useClasses } from "@/features/classes/api";
import { useMatieres } from "@/features/matieres/api";
import { useSeances } from "@/features/seances/api";
import { useStudents } from "@/features/students/api";
import { STATUT_PRESENCE } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { useCreateAttendance } from "./api";

const schema = z.object({
  seance_id: z.string().min(1, "La séance est requise."),
  student_id: z.string().min(1, "L'étudiant est requis."),
  statut: z.enum(["PRESENT", "ABSENT", "RETARD", "JUSTIFIE", "EXCLU", "PERMISSION"], {
    required_error: "Le statut est requis.",
  }),
  motif: z.string().optional(),
  justificatif: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface AttendanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceFormDialog({ open, onOpenChange }: AttendanceFormDialogProps) {
  const createAttendance = useCreateAttendance();
  const seancesQuery = useSeances(open);
  const studentsQuery = useStudents();
  const classesQuery = useClasses();
  const matieresQuery = useMatieres();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      seance_id: "",
      student_id: "",
      statut: "PRESENT",
      motif: "",
      justificatif: "",
    },
  });

  React.useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const classeById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classesQuery.data ?? []) map.set(c.id, c.nom);
    return map;
  }, [classesQuery.data]);

  const matiereById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matieresQuery.data ?? []) map.set(m.id, m.nom);
    return map;
  }, [matieresQuery.data]);

  const seances = React.useMemo(
    () =>
      // Les plus récentes d'abord : la saisie concerne la séance du jour.
      [...(seancesQuery.data ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [seancesQuery.data],
  );

  const seanceId = form.watch("seance_id");
  const seance = seances.find((s) => s.id === seanceId);

  const students = React.useMemo(
    () => (studentsQuery.data ?? []).filter((s) => s.classe_id === seance?.classe_id),
    [studentsQuery.data, seance?.classe_id],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    if (!seance) return;
    await createAttendance.mutateAsync({
      student_id: values.student_id,
      seance_id: values.seance_id,
      statut: values.statut,
      date: seance.date,
      motif: values.motif?.trim() || null,
      justificatif: values.justificatif?.trim() || null,
    });
    onOpenChange(false);
  });

  const pending = createAttendance.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Saisir une présence"
      description="Relevé par séance — la date est celle de la séance sélectionnée."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="seance_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Séance</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("student_id", "");
                  }}
                  disabled={seancesQuery.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={seancesQuery.isPending ? "Chargement…" : "Sélectionner"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {seances.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {formatDate(s.date)} · {s.heure_debut}–{s.heure_fin} —{" "}
                        {classeById.get(s.classe_id) ?? "—"} · {matiereById.get(s.matiere_id) ?? "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!seancesQuery.isPending && seances.length === 0 ? (
                  <FormDescription>
                    Aucune séance planifiée — créez-la d'abord dans « Séances ».
                  </FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Étudiant</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!seanceId || studentsQuery.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={!seanceId ? "Choisissez d'abord une séance" : "Sélectionner"}
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
                  {seanceId && !studentsQuery.isPending && students.length === 0 ? (
                    <FormDescription>Aucun étudiant dans la classe de cette séance.</FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="statut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
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
          </div>

          <FormField
            control={form.control}
            name="motif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motif</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="ex. Rendez-vous médical…" {...field} />
                </FormControl>
                <FormDescription>Facultatif — recommandé hors « Présent ».</FormDescription>
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
                <FormDescription>Facultatif — référence de la pièce fournie.</FormDescription>
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
              {pending ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
