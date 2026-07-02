import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarPlus } from "lucide-react";
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
import { useClasseMatieres, useClasses } from "@/features/classes/api";
import { useUsers } from "@/features/users/api";
import { useCreateSeance } from "./api";

const schema = z.object({
  classe_id: z.string().min(1, "La classe est requise."),
  matiere_id: z.string().min(1, "La matière est requise."),
  enseignant_id: z.string().min(1, "L'enseignant est requis."),
  date: z.string().min(1, "La date est requise."),
  heure_debut: z.string().min(1, "Heure de début requise."),
  heure_fin: z.string().min(1, "Heure de fin requise."),
  salle: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface SeanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeanceFormDialog({ open, onOpenChange }: SeanceFormDialogProps) {
  const createSeance = useCreateSeance();
  const classesQuery = useClasses();
  const enseignantsQuery = useUsers("ENSEIGNANT");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      classe_id: "",
      matiere_id: "",
      enseignant_id: "",
      date: "",
      heure_debut: "",
      heure_fin: "",
      salle: "",
    },
  });

  const classeId = form.watch("classe_id");
  const matieresQuery = useClasseMatieres(classeId);

  const classes = classesQuery.data ?? [];
  const matieres = matieresQuery.data ?? [];
  const enseignants = enseignantsQuery.data ?? [];

  const onSubmit = form.handleSubmit(async (values) => {
    await createSeance.mutateAsync({ ...values, salle: values.salle?.trim() || null });
    form.reset();
    onOpenChange(false);
  });

  const pending = createSeance.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) form.reset();
        onOpenChange(next);
      }}
      title="Planifier une séance"
      description="Associe une matière, une classe et un enseignant à un créneau."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
                    form.setValue("matiere_id", "");
                  }}
                  disabled={classesQuery.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une classe" />
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
                        placeholder={
                          !classeId
                            ? "Choisissez d'abord une classe"
                            : matieresQuery.isPending
                              ? "Chargement…"
                              : "Sélectionner une matière"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {matieres.map((matiere) => (
                      <SelectItem key={matiere.id} value={matiere.id}>
                        {matiere.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {classeId && !matieresQuery.isPending && matieres.length === 0 ? (
                  <FormDescription>
                    Aucune matière affectée à cette classe — gérez-les dans « Classes ».
                  </FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />

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
                      <SelectValue placeholder="Sélectionner un enseignant" />
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

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="heure_debut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Début</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heure_fin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fin</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salle</FormLabel>
                  <FormControl>
                    <Input placeholder="ex. B204" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
              Planifier
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
