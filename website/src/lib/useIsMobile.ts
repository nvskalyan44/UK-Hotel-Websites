"use client";

import { useState, useEffect } from "react";

// Returns false during SSR and the first client paint (so desktop rendering is
// never affected), then resolves to the real value after mount. Used to swap in
// mobile-only layouts without changing the desktop output.
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
