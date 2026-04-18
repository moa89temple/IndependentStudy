import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { api, type UxClickRecord } from "../api";

const FLUSH_MS = 4000;
const MAX_BATCH = 60;

const queue: UxClickRecord[] = [];

function elementKeyFromEvent(target: Element, path: string): { key: string; tag: string } | null {
  if (target.closest("[data-no-ux-track]")) return null;

  const labeled = target.closest("[data-analytics]");
  if (labeled instanceof HTMLElement && labeled.dataset.analytics) {
    const tag = (labeled.tagName || "el").toLowerCase();
    return { key: labeled.dataset.analytics, tag };
  }

  const interactive = target.closest(
    'button, a[href], [role="button"], input[type="submit"], input[type="button"]',
  );
  if (!(interactive instanceof HTMLElement)) return null;
  if (interactive.closest("[data-no-ux-track]")) return null;

  const tag = interactive.tagName.toLowerCase();
  const raw = (interactive.innerText || interactive.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
  const label = raw.slice(0, 36);
  const extra =
    interactive instanceof HTMLAnchorElement
      ? interactive.getAttribute("href") || ""
      : interactive.getAttribute("type") || "";
  const key = `${path}:${tag}:${label || extra || "control"}`;
  return { key: key.slice(0, 256), tag };
}

export function UxClickTracker() {
  const loc = useLocation();
  const pathRef = useRef(loc.pathname);

  useEffect(() => {
    pathRef.current = loc.pathname;
  }, [loc.pathname]);

  useEffect(() => {
    const flush = () => {
      if (!queue.length) return;
      const batch = queue.splice(0, MAX_BATCH);
      void api.ux.recordClicks(batch);
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!(e.target instanceof Element)) return;
      const path = pathRef.current;
      const hit = elementKeyFromEvent(e.target, path);
      if (!hit) return;
      const x_norm = Math.min(1, Math.max(0, e.clientX / Math.max(1, window.innerWidth)));
      const y_norm = Math.min(1, Math.max(0, e.clientY / Math.max(1, window.innerHeight)));
      queue.push({
        path,
        element_key: hit.key,
        tag: hit.tag.slice(0, 32),
        x_norm,
        y_norm,
        viewport_w: window.innerWidth,
        viewport_h: window.innerHeight,
      });
      if (queue.length >= MAX_BATCH) flush();
    };

    const id = window.setInterval(flush, FLUSH_MS);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(id);
      flush();
    };
  }, []);

  return null;
}
