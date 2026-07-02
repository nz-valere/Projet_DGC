import { Loader2, XCircle } from "lucide-react";
import * as React from "react";
import type { StudentResponse } from "@/api/types";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRejectStudent } from "./api";

interface RejectStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentResponse | undefined;
}

export function RejectStudentDialog({ open, onOpenChange, student }: RejectStudentDialogProps) {
  const rejectStudent = useRejectStudent();
  const [motif, setMotif] = React.useState("");

  React.useEffect(() => {
    if (open) setMotif("");
  }, [open]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!student || !motif.trim()) return;
    rejectStudent.mutate(
      { studentId: student.id, motif: motif.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={rejectStudent.isPending ? () => undefined : onOpenChange}
      title="Rejeter la demande"
      description={
        student
          ? `La demande de ${student.prenom} ${student.nom} sera rejetée. Le motif lui sera communiqué.`
          : undefined
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reject-motif">Motif du rejet</Label>
          <Textarea
            id="reject-motif"
            rows={3}
            placeholder="ex. Dossier incomplet, pièces non conformes…"
            value={motif}
            onChange={(event) => setMotif(event.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={rejectStudent.isPending}
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={rejectStudent.isPending || !motif.trim()}
          >
            {rejectStudent.isPending ? <Loader2 className="animate-spin" /> : <XCircle />}
            Rejeter la demande
          </Button>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}
