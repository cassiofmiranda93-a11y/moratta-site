"use client";

import { useEffect, useState } from "react";
import { subscribeToCurrentAccess } from "@/services/adminService";
import type { OrganizationAccessRecord } from "@/types/admin";

export function useOrganizationAccess(email?: string | null) {
  const [access, setAccess] = useState<OrganizationAccessRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(email));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) {
      setAccess(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeToCurrentAccess(email, (next) => {
      setAccess(next);
      setLoading(false);
    }, (nextError) => {
      setError(nextError.message);
      setLoading(false);
    });
  }, [email]);

  return { access, loading, error };
}
