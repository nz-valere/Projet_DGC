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

export function ResetPasswordPage() {
  const { confirmPasswordReset } = useAuth();
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
      const message = await confirmPasswordReset(token, password);
      toast.success(message || "Mot de passe réinitialisé. Vous pouvez vous connecter.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error, "Réinitialisation impossible."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      description={
        token
          ? "Choisissez votre nouveau mot de passe."
          : "Ce lien de réinitialisation est invalide ou incomplet."
      }
    >
      {token ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password">Nouveau mot de passe</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              placeholder="6 caractères minimum"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-confirm">Confirmer le mot de passe</Label>
            <Input
              id="reset-confirm"
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
            Réinitialiser
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le lien est incomplet ou a expiré. Relancez une demande depuis l'écran de connexion.
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link to="/login">Retour à la connexion</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
