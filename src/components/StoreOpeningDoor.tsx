"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSite } from "@/components/SiteProvider";

/**
 * Premium Website Opening / Door Animation for NUR SHOP BD.
 * Shows two dark panels that part from the center seam to reveal the website,
 * with the NUR SHOP BD logo and "STORE IS OPENING" text in the center.
 * Smooth, hardware-accelerated CSS transforms; unmounts completely after completion.
 */
export function StoreOpeningDoor() {
  const pathname = usePathname();
  const site = useSite();
  const [stage, setStage] = useState<"initial" | "active" | "opening" | "completed">("initial");

  // Skip animation completely inside admin panel
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) {
      setStage("completed");
      return;
    }

    // Check if animation already ran during this session
    const hasPlayed = sessionStorage.getItem("nurshop_opening_played");
    if (hasPlayed) {
      setStage("completed");
      return;
    }

    // Start active state
    setStage("active");

    // Phase 1: Keep doors closed and display logo / text (1.1s)
    const openTimer = setTimeout(() => {
      setStage("opening");
    }, 1100);

    // Phase 2: Slide doors open and complete (unmount after 2.3s total)
    const completeTimer = setTimeout(() => {
      setStage("completed");
      try {
        sessionStorage.setItem("nurshop_opening_played", "true");
      } catch {
        // ignore
      }
    }, 2300);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(completeTimer);
    };
  }, [isAdmin]);

  if (stage === "completed" || isAdmin) {
    return null;
  }

  const logoSrc =
    site?.logoUrl ||
    "https://nurshopbd.net/images/logo.png";

  const isOpening = stage === "opening";

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Left Door Panel */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-[#030911] via-[#071524] to-[#0a1f33] border-r border-teal-500/40 shadow-[0_0_25px_rgba(20,184,166,0.35)]"
        style={{
          transform: isOpening ? "translateX(-100%)" : "translateX(0%)",
          transition: "transform 1.05s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        {/* Subtle decorative grid/texture overlay */}
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"
        />
        {/* Seam Light Beam */}
        <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-teal-400 to-transparent opacity-80" />
      </div>

      {/* Right Door Panel */}
      <div
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-[#030911] via-[#071524] to-[#0a1f33] border-l border-teal-500/40 shadow-[0_0_25px_rgba(20,184,166,0.35)]"
        style={{
          transform: isOpening ? "translateX(100%)" : "translateX(0%)",
          transition: "transform 1.05s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        {/* Subtle decorative grid/texture overlay */}
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"
        />
        {/* Seam Light Beam */}
        <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-teal-400 to-transparent opacity-80" />
      </div>

      {/* Center Seam Vertical Glow Line */}
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-teal-400 shadow-[0_0_20px_#2dd4bf] z-10 transition-opacity duration-300"
        style={{ opacity: isOpening ? 0 : 0.85 }}
      />

      {/* Center Branding & Opening Title Container */}
      <div
        className="relative z-20 flex flex-col items-center justify-center px-4 text-center transition-all duration-700 ease-out"
        style={{
          opacity: isOpening ? 0 : 1,
          transform: isOpening ? "scale(0.92)" : "scale(1)",
        }}
      >
        {/* Glowing Logo Card */}
        <div className="relative mb-5 flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-2xl border border-teal-500/30 bg-[#071524]/90 p-3 shadow-[0_0_35px_rgba(20,184,166,0.35)] backdrop-blur-md">
          {/* Animated Ambient Ring */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-500/20 via-orange/20 to-teal-500/20 blur-sm animate-pulse" />

          {logoSrc ? (
            <div className="relative h-full w-full">
              <Image
                src={logoSrc}
                alt="NUR SHOP BD"
                fill
                priority
                sizes="112px"
                className="object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              />
            </div>
          ) : (
            <span className="font-display text-2xl font-bold tracking-wider text-orange">
              NES
            </span>
          )}
        </div>

        {/* Text: STORE IS OPENING */}
        <h2 className="font-display text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-[0.24em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          STORE IS OPENING
        </h2>

        {/* Subtitle / Department Badge */}
        <p className="mt-2 text-[10px] md:text-[11.5px] font-semibold uppercase tracking-[0.22em] text-teal-300/90 drop-shadow">
          NUR SHOP BD • INDUSTRIAL AUTOMATION & SPARE PARTS
        </p>

        {/* Center Progress / Energy Light Bar */}
        <div className="relative mt-5 h-[3px] w-48 md:w-72 overflow-hidden rounded-full bg-white/10 shadow-[0_0_12px_rgba(20,184,166,0.4)]">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-400 via-teal-300 to-orange shadow-[0_0_15px_#2dd4bf] transition-all duration-1000 ease-out"
            style={{ width: isOpening ? "100%" : "85%" }}
          />
        </div>

        {/* Bottom Tagline */}
        <span className="mt-3 text-[9.5px] uppercase tracking-[0.25em] text-white/40">
          ENGINEERING EXCELLENCE • BANGLADESH
        </span>
      </div>
    </div>
  );
}
