import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { CANAL_NOTIFICATION } from "@/lib/labels";
import { useAddStudentParent } from "./api";

const LIENS = ["Père", "Mère", "Tuteur", "Tutrice", "Autre"] as const;

const schema = z.object({
  email: z.string().trim().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
  lien_parente: z.string().min(1, "Le lien de parenté est requis."),
  telephone: z.string().trim().min(1, "Le téléphone est requis."),
  preferences_notification: z.enum(["SMS", "WHATSAPP", "EMAIL", "TOUS"]),
});

type Values = z.infer<typeof schema>;

interface ParentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

export function ParentFormDialog({ open, onOpenChange, studentId }: ParentFormDialogProps) {
  const addParent = useAddStudentParent(studentId);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      lien_parente: "",
      telephone: "",
      preferences_notification: "EMAIL",
    },
  });

  React.useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await addParent.mutateAsync(values);
    onOpenChange(false);
  });

  const pending = addParent.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Ajouter un parent / tuteur"
      description="Il recevra les notifications liées à la scolarité de l'étudiant."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse e-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="parent@exemple.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="lien_parente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien de parenté</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LIENS.map((lien) => (
                        <SelectItem key={lien} value={lien}>
                          {lien}
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
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+237…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="preferences_notification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canal de notification préféré</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CANAL_NOTIFICATION).map(([value, label]) => (
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
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </FormDialog>
  );
}
