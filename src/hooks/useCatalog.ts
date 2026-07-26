"use client";

import { useEffect, useState } from "react";
import { PROJECTS } from "@/data/projects";
import { firebaseConfigured } from "@/config/firebase";
import { subscribeToDevelopments, subscribeToProperties } from "@/services/catalogService";
import type { Development, PropertyUnit } from "@/types/project";

export function useCatalog(options: { publicOnly?: boolean } = {}) {
  const [developments, setDevelopments] = useState<Development[]>(PROJECTS);
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!firebaseConfigured) return;
    let developmentReady = false;
    let propertyReady = false;
    const finish = () => {
      if (developmentReady && propertyReady) setLoading(false);
    };
    const unsubscribeDevelopments = subscribeToDevelopments(
      (items) => {
        setDevelopments(items.length ? items : PROJECTS);
        developmentReady = true;
        finish();
      },
      (nextError) => {
        setError(nextError.message);
        developmentReady = true;
        finish();
      },
      options,
    );
    const unsubscribeProperties = subscribeToProperties(
      (items) => {
        setProperties(items);
        propertyReady = true;
        finish();
      },
      (nextError) => {
        setError(nextError.message);
        propertyReady = true;
        finish();
      },
      options,
    );
    return () => {
      unsubscribeDevelopments();
      unsubscribeProperties();
    };
  }, [options.publicOnly]);

  return { developments, properties, loading, error };
}
