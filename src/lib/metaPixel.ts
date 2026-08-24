type MetaPixelFunction = (
  command: "track",
  eventName: "Lead",
) => void;

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
  }
}

export function trackMetaLead() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return false;

  window.fbq("track", "Lead");
  return true;
}
