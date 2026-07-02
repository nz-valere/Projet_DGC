import type { components } from "./schema";

type Schemas = components["schemas"];

export type UserRole = Schemas["UserRole"];
export type UserResponse = Schemas["UserResponse"];
export type UserCreate = Schemas["UserCreate"];
export type UserUpdate = Schemas["UserUpdate"];

export type StudentResponse = Schemas["StudentResponse"];
export type StudentCreate = Schemas["StudentCreate"];
export type StudentUpdate = Schemas["StudentUpdate"];
export type StatutInscription = Schemas["StatutInscription"];
export type ActivateAccount = Schemas["ActivateAccount"];
export type ParentCreate = Schemas["ParentCreate"];
export type ParentResponse = Schemas["ParentResponse"];
export type DocumentResponse = Schemas["DocumentResponse"];
export type TypeDocument = Schemas["TypeDocument"];
export type StudentReject = Schemas["StudentReject"];
export type CanalNotification = Schemas["CanalNotification"];

export type ClasseResponse = Schemas["ClasseResponse"];
export type ClasseCreate = Schemas["ClasseCreate"];
export type ClasseUpdate = Schemas["ClasseUpdate"];
export type ClasseMatieres = Schemas["ClasseMatieres"];

export type SeanceResponse = Schemas["SeanceResponse"];
export type SeanceCreate = Schemas["SeanceCreate"];

export type LoginRequest = Schemas["LoginRequest"];
export type LoginResponse = Schemas["LoginResponse"];
export type TokenResponse = Schemas["TokenResponse"];
export type TempTokenRequest = Schemas["TempTokenRequest"];
export type TwoFactorSetupResponse = Schemas["TwoFactorSetupResponse"];
export type TwoFactorVerify = Schemas["TwoFactorVerify"];
export type PasswordResetRequest = Schemas["PasswordResetRequest"];
export type PasswordResetConfirm = Schemas["PasswordResetConfirm"];
export type MessageResponse = Schemas["MessageResponse"];

export type MatiereResponse = Schemas["MatiereResponse"];
export type MatiereDetailResponse = Schemas["MatiereDetailResponse"];
export type MatiereCreate = Schemas["MatiereCreate"];
export type MatiereUpdate = Schemas["MatiereUpdate"];
export type MatiereEnseignants = Schemas["MatiereEnseignants"];
export type EnseignantBrief = Schemas["EnseignantBrief"];

export type AttendanceResponse = Schemas["AttendanceResponse"];
export type AttendanceCreate = Schemas["AttendanceCreate"];
export type AttendanceCorrect = Schemas["AttendanceCorrect"];
export type StatutPresence = Schemas["StatutPresence"];

export type GradeResponse = Schemas["GradeResponse"];
export type GradeCreate = Schemas["GradeCreate"];
export type GradeUpdate = Schemas["GradeUpdate"];
export type GradeValidate = Schemas["GradeValidate"];
export type StatutNote = Schemas["StatutNote"];

export type PaymentResponse = Schemas["PaymentResponse"];
export type PaymentCreate = Schemas["PaymentCreate"];
export type PaymentCancel = Schemas["PaymentCancel"];
export type StatutPaiement = Schemas["StatutPaiement"];
export type ModePaiement = Schemas["ModePaiement"];

export type DisciplineResponse = Schemas["DisciplineResponse"];
export type DisciplineCreate = Schemas["DisciplineCreate"];
export type DisciplineValidate = Schemas["DisciplineValidate"];
export type GraviteSanction = Schemas["GraviteSanction"];
export type StatutValidation = Schemas["StatutValidation"];

export type NotificationResponse = Schemas["NotificationResponse"];
export type NotificationCreate = Schemas["NotificationCreate"];
export type CanalEnvoi = Schemas["CanalEnvoi"];
export type StatutEnvoi = Schemas["StatutEnvoi"];
