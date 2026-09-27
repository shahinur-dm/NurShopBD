import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { SiteSettings, CompanyProfile } from "@/lib/models";
import { getCurrentAdminUser, logActivity } from "@/lib/auth";
import { fallbackSettings } from "@/lib/data";
import { serialize } from "@/lib/serialize";
import { isRetiredPhone } from "@/lib/official-contact";
import { resolveGoogleMapsUrlAsync } from "@/lib/google-maps";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getCurrentAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let doc: Record<string, unknown> | null = null;
  let profile: Record<string, unknown> | null = null;

  try {
    const db = await connectDB();
    if (db) {
      const [settingsDoc, profileDoc] = await Promise.all([
        SiteSettings.findOne().sort({ updatedAt: -1 }).lean(),
        CompanyProfile.findOne().lean(),
      ]);
      if (settingsDoc) doc = serialize(settingsDoc) as unknown as Record<string, unknown>;
      if (profileDoc) profile = serialize(profileDoc) as unknown as Record<string, unknown>;
    }
  } catch (err) {
    console.warn("Get settings DB warning:", err);
  }

  const merged = {
    ...fallbackSettings,
    ...(doc || {}),
    contactPage: {
      ...fallbackSettings.contactPage,
      ...((doc?.contactPage as Record<string, unknown>) || {}),
    },
    social: {
      ...fallbackSettings.social,
      ...((doc?.social as Record<string, string>) || {}),
    },
    footerQr: {
      ...fallbackSettings.footerQr,
      ...((doc?.footerQr as Record<string, unknown>) || {}),
    },
    heroBanners: {
      ...fallbackSettings.heroBanners,
      ...((doc?.heroBanners as Record<string, string>) || {}),
    },
    seo: {
      ...fallbackSettings.seo,
      ...((doc?.seo as Record<string, unknown>) || {}),
    },
    analytics: {
      ...fallbackSettings.analytics,
      ...((doc?.analytics as Record<string, string>) || {}),
    },
    footerQuickLinks:
      Array.isArray(doc?.footerQuickLinks) && (doc?.footerQuickLinks as unknown[]).length
        ? (doc?.footerQuickLinks as { label: string; href: string }[])
        : fallbackSettings.footerQuickLinks,
    footerServices:
      Array.isArray(doc?.footerServices) && (doc?.footerServices as unknown[]).length
        ? (doc?.footerServices as { label: string; href: string }[])
        : fallbackSettings.footerServices,
  };

  return NextResponse.json({ settings: merged, profile });
}

export async function PUT(req: Request) {
  const admin = await getCurrentAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "super_admin" && admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const { settings, profile } = await req.json();
    let updatedSettings: Record<string, unknown> | null = null;
    let updatedProfile: Record<string, unknown> | null = null;

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    if (settings) {
      if (isRetiredPhone(String(settings.phone3 || ""))) {
        settings.phone3 = "";
      }

      // If user provided a mapShareUrl or mapEmbedUrl, make sure mapEmbedUrl is a valid embed URL
      const candidateMap = (settings.mapShareUrl || settings.mapEmbedUrl || "").trim();
      const zoom = Number(settings.mapZoom) || 15;
      const fullAddress = [
        settings.addressHouse ? `House ${settings.addressHouse}` : "",
        settings.addressRoad ? `Road ${settings.addressRoad}` : "",
        settings.addressBlock ? `Block ${settings.addressBlock}` : "",
        settings.address || "",
        settings.addressCity || "",
      ]
        .filter(Boolean)
        .join(", ");

      if (candidateMap) {
        try {
          const resolved = await resolveGoogleMapsUrlAsync(candidateMap, fullAddress, zoom);
          if (resolved.embedUrl) {
            settings.mapEmbedUrl = resolved.embedUrl;
          }
          if (resolved.shareUrl) {
            settings.mapShareUrl = resolved.shareUrl;
          }
        } catch (err) {
          console.warn("Map resolution error during save:", err);
        }
      } else if (fullAddress) {
        try {
          const resolved = await resolveGoogleMapsUrlAsync("", fullAddress, zoom);
          if (resolved.embedUrl) {
            settings.mapEmbedUrl = resolved.embedUrl;
          }
        } catch {
          // ignore
        }
      }

      const existing = await SiteSettings.findOne().sort({ updatedAt: -1 });
      if (existing) {
        const resDoc = await SiteSettings.findByIdAndUpdate(
          existing._id,
          { $set: settings },
          { new: true, runValidators: false }
        ).lean();
        if (resDoc) updatedSettings = serialize(resDoc) as unknown as Record<string, unknown>;
      } else {
        const created = await SiteSettings.create({
          ...fallbackSettings,
          ...settings,
        });
        if (created) {
          const obj = typeof created.toObject === "function" ? created.toObject() : created;
          updatedSettings = serialize(obj) as unknown as Record<string, unknown>;
        }
      }
    }

    if (profile) {
      const existingProf = await CompanyProfile.findOne();
      if (existingProf) {
        const resProf = await CompanyProfile.findByIdAndUpdate(
          existingProf._id,
          { $set: profile },
          { new: true, runValidators: false }
        ).lean();
        if (resProf) updatedProfile = serialize(resProf) as unknown as Record<string, unknown>;
      } else {
        const createdProf = await CompanyProfile.create(profile);
        if (createdProf) {
          const obj = typeof createdProf.toObject === "function" ? createdProf.toObject() : createdProf;
          updatedProfile = serialize(obj) as unknown as Record<string, unknown>;
        }
      }
    }

    await logActivity({
      action: "SETTINGS_UPDATE",
      entity: "SiteSettings",
      details: `Updated website settings, branding and contact information`,
      user: {
        _id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/about");
      revalidatePath("/contact");
      revalidatePath("/products");
      revalidatePath("/services");
      revalidatePath("/use-cases");
      revalidatePath("/blog");
      revalidatePath("/api/settings");
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings || settings,
      profile: updatedProfile || profile,
    });
  } catch (err: unknown) {
    console.error("Update settings error:", err);
    const msg = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

