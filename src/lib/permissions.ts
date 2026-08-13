import type { UserRole } from "@/types/admin";

export type Permission =
  | "view_dashboard"
  | "view_broker_ranking"
  | "view_lost_leads_pool"
  | "view_catalog"
  | "manage_catalog"
  | "view_leads"
  | "manage_all_leads"
  | "import_leads"
  | "view_finance"
  | "manage_finance"
  | "manage_team"
  | "manage_integrations"
  | "view_audit"
  | "manage_security";

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  admin: new Set([
    "view_dashboard", "view_broker_ranking", "view_lost_leads_pool", "view_catalog", "manage_catalog", "view_leads", "manage_all_leads",
    "import_leads", "view_finance", "manage_finance", "manage_team", "manage_integrations",
    "view_audit", "manage_security",
  ]),
  manager: new Set([
    "view_dashboard", "view_catalog", "manage_catalog", "view_leads", "manage_all_leads",
    "import_leads", "view_finance", "manage_finance", "manage_team", "view_audit",
  ]),
  broker: new Set(["view_dashboard", "view_catalog", "view_leads"]),
  finance: new Set(["view_dashboard", "view_catalog", "view_finance", "manage_finance"]),
};

export function hasPermission(role: UserRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function roleLabel(role: UserRole) {
  return ({ admin: "Administrador", manager: "Gerente", broker: "Corretor", finance: "Financeiro" } as const)[role];
}

export function firstAllowedAdminTab(role: UserRole) {
  if (role === "finance") return "directorate" as const;
  return "overview" as const;
}
