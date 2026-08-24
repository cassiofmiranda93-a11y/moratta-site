type MetaPixelFunction = (
  command: "track",
  eventName: "Lead",
) => void;

export type MetaLeadTrackingState = {
  tracked: boolean;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
  }
}

export function trackMetaLead() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return false;

  try {
    window.fbq("track", "Lead");
    return true;
  } catch {
    return false;
  }
}

export function trackMetaLeadOnce(state: MetaLeadTrackingState) {
  if (state.tracked) return false;

  const tracked = trackMetaLead();
  if (tracked) state.tracked = true;
  return tracked;
}
