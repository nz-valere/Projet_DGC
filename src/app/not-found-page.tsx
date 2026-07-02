import { SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={SearchX}
        title="Page introuvable"
        description="L'adresse demandée n'existe pas ou a été déplacée."
        action={
          <Button asChild>
            <Link to="/">Retour au tableau de bord</Link>
          </Button>
        }
        className="border-none"
      />
    </div>
  );
}
