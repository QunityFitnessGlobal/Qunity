"use client";

import { useEffect } from "react";
import { acquisitionFromLanding, rememberAcquisition } from "@/lib/acquisition";
import { recordVisit } from "@/services/visits.service";

const SESSION_KEY = "qunity_visit_recorded";

// On the welcome and sign-up screens: remembers where the family came from
// (for their sign-up) and counts one visit per browser session for the admin
// dashboard. Renders nothing.
export function TrackVisit() {
  useEffect(() => {
    const acquisition = acquisitionFromLanding(new URL(window.location.href), document.referrer);
    rememberAcquisition(acquisition);
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Without session storage a reload may count twice; that's fine.
    }
    recordVisit({ ...acquisition, path: window.location.pathname }).catch(() => {});
  }, []);

  return null;
}
