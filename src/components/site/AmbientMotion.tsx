"use client";

import { useEffect, useRef } from "react";

/** Lightweight, decorative effects for the public-facing site. */
export function AmbientMotion() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animationsDisabled = document.documentElement.dataset.anim === "off";
    if (reducedMotion || animationsDisabled) {
      host.dataset.motion = "off";
      return;
    }

    const aura = host.querySelector<HTMLElement>(".ambient-pointer-aura");
    let pointerX = -1000;
    let pointerY = -1000;
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !aura) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        aura.style.setProperty("--pointer-x", `${pointerX}px`);
        aura.style.setProperty("--pointer-y", `${pointerY}px`);
        aura.classList.add("is-visible");
        frame = 0;
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

      const existing = host.querySelectorAll(".ambient-water-ripple");
      if (existing.length >= 4) existing[0]?.remove();

      const ripple = document.createElement("span");
      ripple.className = "ambient-water-ripple";
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
      host.appendChild(ripple);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={hostRef} className="ambient-motion" aria-hidden="true">
      <span className="ambient-liquid ambient-liquid-a" />
      <span className="ambient-liquid ambient-liquid-b" />
      <span className="ambient-caustics" />
      <span className="ambient-sheen" />
      <span className="ambient-pointer-aura" />
    </div>
  );
}
