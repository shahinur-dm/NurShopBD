"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { ISiteSettings, IUseCase } from "@/lib/models";
import { OrderModalProvider } from "@/components/OrderModal";
import { CartProvider } from "@/components/CartContext";
import { CartDrawer } from "@/components/CartDrawer";

type SiteContextValue = {
  settings: ISiteSettings;
  useCases: IUseCase[];
  updateSettings?: (newSettings: Partial<ISiteSettings>) => void;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({
  settings: initialSettings,
  useCases,
  children,
}: {
  settings: ISiteSettings;
  useCases: IUseCase[];
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<ISiteSettings>(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  // Client-side dynamic synchronization for live logo, favicon and branding updates
  useEffect(() => {
    function fetchLatestSettings() {
      fetch("/api/settings", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setSettings((prev) => ({
              ...prev,
              ...data.settings,
              logoUrl: data.settings.logoUrl || data.settings.logo || prev.logoUrl,
              footerLogoUrl: data.settings.footerLogoUrl ?? prev.footerLogoUrl,
              favicon: data.settings.favicon || prev.favicon,
            }));

            // Dynamically update document favicon links in real time
            const favUrl = data.settings.favicon;
            if (favUrl) {
              const rels = ["icon", "shortcut icon", "apple-touch-icon"];
              rels.forEach((rel) => {
                let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);
                if (!link) {
                  link = document.createElement("link");
                  link.rel = rel;
                  document.head.appendChild(link);
                }
                link.href = favUrl;
              });
            }
          }
        })
        .catch(() => {});
    }

    // Refresh on mount and when returning to the tab
    fetchLatestSettings();
    window.addEventListener("focus", fetchLatestSettings);
    return () => window.removeEventListener("focus", fetchLatestSettings);
  }, []);

  return (
    <SiteContext.Provider value={{ settings, useCases }}>
      <CartProvider>
        <OrderModalProvider>
          {children}
          <CartDrawer />
        </OrderModalProvider>
      </CartProvider>
    </SiteContext.Provider>
  );
}


export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within SiteProvider");
  return ctx.settings;
}

export function useUseCases() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useUseCases must be used within SiteProvider");
  return ctx.useCases;
}
