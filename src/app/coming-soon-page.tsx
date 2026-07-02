import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

/** Page provisoire le temps de construire chaque module, étape par étape. */
export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Module en construction"
        description="Cette interface arrive dans une prochaine étape du développement."
      />
    </div>
  );
}
