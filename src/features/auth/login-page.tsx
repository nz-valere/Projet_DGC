import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn, MailCheck, ShieldCheck } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { extractErrorMessage } from "@/api/client";
import type { UserRole } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/labels";
import { AUTH_MOCK_ENABLED } from "./adapter";
import { AuthShell } from "./auth-shell";
import { useAuth } from "./auth-context";
import type { TwoFaSetup } from "./types";

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

const mockSchema = z.object({
  role: z.enum(ROLES as [UserRole, ...UserRole[]], {
    required_error: "Choisissez un rôle.",
  }),
  email: z.string().email("Adresse e-mail invalide.").optional().or(z.literal("")),
  password: z.string().optional(),
});

const httpSchema = z.object({
  role: z.enum(ROLES as [UserRole, ...UserRole[]]).optional(),
  email: z.string().min(1, "L'adresse e-mail est requise.").email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

type LoginFormValues = z.infer<typeof httpSchema>;

/** Étape de l'écran de connexion. */
type Step =
  | { name: "credentials" }
  | { name: "twofa"; tempToken: string; setup: TwoFaSetup | null }
  | { name: "reset_request" };

export function LoginPage() {
  const { isAuthenticated, login, verifyTwoFa, setupTwoFa, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = React.useState(false);
  const [step, setStep] = React.useState<Step>({ name: "credentials" });
  const [code, setCode] = React.useState("");

  // Demande de réinitialisation du mot de passe (la confirmation se fait sur /reinitialiser).
  const [resetEmail, setResetEmail] = React.useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(AUTH_MOCK_ENABLED ? mockSchema : httpSchema),
    defaultValues: { role: AUTH_MOCK_ENABLED ? "ADMIN" : undefined, email: "", password: "" },
  });

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    try {
      const result = await login({
        email: values.email ?? "",
        password: values.password ?? "",
        role: values.role,
      });

      if (result.status === "authenticated") {
        navigate(from, { replace: true });
        return;
      }

      const setup =
        result.status === "twofa_setup_required" ? await setupTwoFa(result.tempToken) : null;
      setCode("");
      setStep({ name: "twofa", tempToken: result.tempToken, setup });
    } catch (error) {
      toast.error(extractErrorMessage(error, "Connexion impossible."));
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(event: React.FormEvent) {
    event.preventDefault();
    if (step.name !== "twofa") return;
    setSubmitting(true);
    try {
      await verifyTwoFa(step.tempToken, code.trim());
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error, "Code de vérification invalide."));
    } finally {
      setSubmitting(false);
    }
  }

  async function onRequestReset(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const message = await requestPasswordReset(resetEmail.trim());
      toast.success(
        message || "Si ce compte existe, un e-mail avec un lien de réinitialisation a été envoyé.",
      );
      setResetEmail("");
      setStep({ name: "credentials" });
    } catch (error) {
      toast.error(extractErrorMessage(error, "Demande impossible."));
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    step.name === "twofa"
      ? "Vérification en deux étapes"
      : step.name === "reset_request"
        ? "Mot de passe oublié"
        : "Connexion";

  const description =
    step.name === "twofa"
      ? "Saisissez le code généré par votre application d'authentification."
      : step.name === "reset_request"
        ? "Nous vous enverrons un lien de réinitialisation par e-mail."
        : AUTH_MOCK_ENABLED
          ? "Mode démonstration : choisissez un rôle pour explorer son interface."
          : "Connectez-vous avec votre compte DGA.";

  return (
    <AuthShell title={title} description={description}>
      {step.name === "twofa" ? (
            <form onSubmit={onVerify} className="space-y-4">
              {step.setup ? (
                <div className="space-y-2 rounded-md border bg-muted/50 p-3 text-sm">
                  <p className="font-medium">Activez votre application d'authentification</p>
                  <p className="text-muted-foreground">
                    Ajoutez ce compte dans Google Authenticator, Authy ou équivalent en saisissant
                    cette clé, puis entrez le code à 6 chiffres généré.
                  </p>
                  <code className="block break-all rounded bg-background px-2 py-1 font-mono text-xs">
                    {step.setup.secret}
                  </code>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Saisissez le code à 6 chiffres de votre application d'authentification.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="twofa-code">Code de vérification</Label>
                <Input
                  id="twofa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting || code.trim().length < 6}>
                {submitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                Vérifier
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={submitting}
                onClick={() => {
                  setCode("");
                  setStep({ name: "credentials" });
                }}
              >
                Retour
              </Button>
            </form>
          ) : step.name === "reset_request" ? (
            <form onSubmit={onRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Adresse e-mail du compte</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="prenom.nom@dga.com"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Un lien de réinitialisation vous sera envoyé par e-mail.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !resetEmail.trim()}>
                {submitting ? <Loader2 className="animate-spin" /> : <MailCheck />}
                Envoyer le lien
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={submitting}
                onClick={() => setStep({ name: "credentials" })}
              >
                Retour à la connexion
              </Button>
            </form>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {AUTH_MOCK_ENABLED ? (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rôle</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un rôle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse e-mail{AUTH_MOCK_ENABLED ? " (facultatif)" : ""}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="prenom.nom@dga.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!AUTH_MOCK_ENABLED ? (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : <LogIn />}
                  Se connecter
                </Button>

                {!AUTH_MOCK_ENABLED ? (
                  <button
                    type="button"
                    className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setStep({ name: "reset_request" })}
                  >
                    Mot de passe oublié ?
                  </button>
                ) : null}
              </form>
            </Form>
          )}
    </AuthShell>
  );
}
