import { createBrowserRouter } from "react-router-dom";
import { NotFoundPage } from "@/app/not-found-page";
import { ActivatePage } from "@/features/auth/activate-page";
import { AttendanceListPage } from "@/features/attendance/attendance-list-page";
import { RequireAuth, RequireRole } from "@/features/auth/guards";
import { LoginPage } from "@/features/auth/login-page";
import { ResetPasswordPage } from "@/features/auth/reset-password-page";
import { BulletinsPage } from "@/features/bulletins/bulletins-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { ClassesListPage } from "@/features/classes/classes-list-page";
import { GradesListPage } from "@/features/grades/grades-list-page";
import { MatiereDetailPage } from "@/features/matieres/matiere-detail-page";
import { MatieresListPage } from "@/features/matieres/matieres-list-page";
import { DisciplinesListPage } from "@/features/disciplines/disciplines-list-page";
import { MySpacePage } from "@/features/me/my-space-page";
import { NotificationsListPage } from "@/features/notifications/notifications-list-page";
import { PaymentsListPage } from "@/features/payments/payments-list-page";
import { PersonnelDetailPage } from "@/features/personnel/personnel-detail-page";
import { PersonnelListPage } from "@/features/personnel/personnel-list-page";
import { SeancesListPage } from "@/features/seances/seances-list-page";
import { StudentDetailPage } from "@/features/students/student-detail-page";
import { StudentsListPage } from "@/features/students/students-list-page";
import { AppLayout } from "@/layout/app-layout";
import { MODULE_ROLES } from "@/layout/nav";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/activer", element: <ActivatePage /> },
  { path: "/activate", element: <ActivatePage /> },
  { path: "/reinitialiser", element: <ResetPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    handle: { crumb: "Accueil" },
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: "mon-espace",
        handle: { crumb: "Mon espace" },
        element: (
          <RequireRole allow={MODULE_ROLES.monEspace}>
            <MySpacePage />
          </RequireRole>
        ),
      },
      {
        path: "etudiants",
        handle: { crumb: "Étudiants" },
        children: [
          {
            index: true,
            element: (
              <RequireRole allow={MODULE_ROLES.etudiants}>
                <StudentsListPage />
              </RequireRole>
            ),
          },
          {
            path: ":studentId",
            handle: { crumb: "Fiche étudiant" },
            element: (
              <RequireRole allow={MODULE_ROLES.etudiants}>
                <StudentDetailPage />
              </RequireRole>
            ),
          },
        ],
      },
      {
        path: "classes",
        handle: { crumb: "Classes" },
        element: (
          <RequireRole allow={MODULE_ROLES.classes}>
            <ClassesListPage />
          </RequireRole>
        ),
      },
      {
        path: "seances",
        handle: { crumb: "Séances" },
        element: (
          <RequireRole allow={MODULE_ROLES.seances}>
            <SeancesListPage />
          </RequireRole>
        ),
      },
      {
        path: "presences",
        handle: { crumb: "Présences" },
        element: (
          <RequireRole allow={MODULE_ROLES.presences}>
            <AttendanceListPage />
          </RequireRole>
        ),
      },
      {
        path: "notes",
        handle: { crumb: "Notes" },
        element: (
          <RequireRole allow={MODULE_ROLES.notes}>
            <GradesListPage />
          </RequireRole>
        ),
      },
      {
        path: "bulletins",
        handle: { crumb: "Bulletins" },
        element: (
          <RequireRole allow={MODULE_ROLES.bulletins}>
            <BulletinsPage />
          </RequireRole>
        ),
      },
      {
        path: "paiements",
        handle: { crumb: "Paiements" },
        element: (
          <RequireRole allow={MODULE_ROLES.paiements}>
            <PaymentsListPage />
          </RequireRole>
        ),
      },
      {
        path: "sanctions",
        handle: { crumb: "Sanctions" },
        element: (
          <RequireRole allow={MODULE_ROLES.sanctions}>
            <DisciplinesListPage />
          </RequireRole>
        ),
      },
      {
        path: "notifications",
        handle: { crumb: "Notifications" },
        element: (
          <RequireRole allow={MODULE_ROLES.notifications}>
            <NotificationsListPage />
          </RequireRole>
        ),
      },
      {
        path: "matieres",
        handle: { crumb: "Matières" },
        children: [
          {
            index: true,
            element: (
              <RequireRole allow={MODULE_ROLES.matieres}>
                <MatieresListPage />
              </RequireRole>
            ),
          },
          {
            path: ":matiereId",
            handle: { crumb: "Fiche matière" },
            element: (
              <RequireRole allow={MODULE_ROLES.matieres}>
                <MatiereDetailPage />
              </RequireRole>
            ),
          },
        ],
      },
      {
        path: "personnel",
        handle: { crumb: "Personnel" },
        children: [
          {
            index: true,
            element: (
              <RequireRole allow={MODULE_ROLES.personnel}>
                <PersonnelListPage />
              </RequireRole>
            ),
          },
          {
            path: ":userId",
            handle: { crumb: "Fiche personnel" },
            element: (
              <RequireRole allow={MODULE_ROLES.personnel}>
                <PersonnelDetailPage />
              </RequireRole>
            ),
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
