import { KeyRound, Loader2 } from "lucide-react";
import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { extractErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./auth-shell";
import { useAuth } from "./auth-context";

export function ActivatePage() {
  const { activateAccount } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = token !== "" && password.length >= 6 && password === confirm;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await activateAccount(token, password);
      toast.success("Compte activé. Bienvenue !");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error, "Activation impossible."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Activation du compte"
      description={
        token
          ? "Choisissez votre mot de passe pour activer votre compte étudiant."
          : "Ce lien d'activation est invalide ou incomplet."
      }
    >
      {token ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activate-password">Mot de passe</Label>
            <Input
              id="activate-password"
              type="password"
              autoComplete="new-password"
              placeholder="6 caractères minimum"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activate-confirm">Confirmer le mot de passe</Label>
            <Input
              id="activate-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {mismatch ? (
              <p className="text-sm text-destructive">Les mots de passe ne correspondent pas.</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !canSubmit}>
            {submitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
            Activer mon compte
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le lien d'activation est incomplet ou a expiré. Rapprochez-vous du secrétariat pour en
            obtenir un nouveau.
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link to="/login">Retour à la connexion</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
