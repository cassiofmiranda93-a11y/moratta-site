"use client";

import { useEffect, useState } from "react";
import { subscribeToCurrentAccess } from "@/services/adminService";
import type { OrganizationAccessRecord } from "@/types/admin";

export function useOrganizationAccess(email?: string | null) {
  const [result, setResult] = useState<{
    email: string;
    access: OrganizationAccessRecord | null;
    error: string;
  }>({ email: "", access: null, error: "" });

  useEffect(() => {
    if (!email) return;
    return subscribeToCurrentAccess(email, (next) => {
      setResult({ email, access: next, error: "" });
    }, (nextError) => {
      setResult({ email, access: null, error: nextError.message });
    });
  }, [email]);

  if (!email) return { access: null, loading: false, error: "" };
  if (result.email !== email) return { access: null, loading: true, error: "" };
  return { access: result.access, loading: false, error: result.error };
}
