import type { UserRole } from "@/types/admin";
import { COMPANY } from "@/constants/company";
import { getFirebaseAdminServices } from "./firebaseAdmin";

export interface ApiUser {
  uid: string;
  email: string;
  role: UserRole;
  memberId: string;
}

export async function requireApiUser(request: Request, allowedRoles: UserRole[]): Promise<ApiUser> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new Error("UNAUTHENTICATED");

  const { adminAuth, adminDb } = getFirebaseAdminServices();
  const decoded = await adminAuth.verifyIdToken(token);
  const email = String(decoded.email ?? "").toLowerCase();
  if (!email) throw new Error("UNAUTHENTICATED");

  const org = adminDb.collection("organizations").doc(COMPANY.organizationId);
  const [securitySnapshot, accessSnapshot] = await Promise.all([
    org.collection("settings").doc("security").get(),
    org.collection("access").doc(email).get(),
  ]);

  const strictAccess = securitySnapshot.data()?.strictAccess === true;
  const access = accessSnapshot.data();
  const role = (access?.role ?? (strictAccess ? "" : "admin")) as UserRole | "";
  const active = access?.active !== false;

  if (!role || !active || !allowedRoles.includes(role)) throw new Error("FORBIDDEN");

  return {
    uid: decoded.uid,
    email,
    role,
    memberId: String(access?.memberId ?? ""),
  };
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "UNAUTHENTICATED") return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  return Response.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
}
