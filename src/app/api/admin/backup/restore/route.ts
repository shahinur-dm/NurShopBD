import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getCurrentAdminUser, logActivity } from "@/lib/auth";
import { clearAllCache } from "@/lib/cache";
import {
  Product,
  Category,
  SubCategory,
  Brand,
  Service,
  Feature,
  Banner,
  BlogPost,
  BlogCategory,
  UseCase,
  SiteSettings,
  CompanyProfile,
  ContactMessage,
  User,
  MediaItem,
  DownloadFile,
  Order,
} from "@/lib/models";

export const dynamic = "force-dynamic";

// Map collection key to Mongoose Model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODEL_MAP: Record<string, mongoose.Model<any>> = {
  products: Product,
  categories: Category,
  subcategories: SubCategory,
  brands: Brand,
  services: Service,
  features: Feature,
  banners: Banner,
  blogPosts: BlogPost,
  blogCategories: BlogCategory,
  useCases: UseCase,
  siteSettings: SiteSettings,
  companyProfile: CompanyProfile,
  contactMessages: ContactMessage,
  users: User,
  mediaItems: MediaItem,
  downloadFiles: DownloadFile,
  orders: Order,
};

/**
 * POST /api/admin/backup/restore
 * Safely restores website data from a valid NUR SHOP BD backup file.
 * Uses non-destructive upsert operations preserving relational ObjectIds.
 */
export async function POST(req: Request) {
  const admin = await getCurrentAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super_admin or admin can restore backups
  if (admin.role !== "super_admin" && admin.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Insufficient privileges for database restore" },
      { status: 403 }
    );
  }

  try {
    const payload = await req.json();
    const { backup, dryRun } = payload;

    if (!backup || typeof backup !== "object") {
      return NextResponse.json(
        { error: "Invalid backup payload: Empty or malformed data." },
        { status: 400 }
      );
    }

    // Validate backup schema
    if (backup.system !== "NUR SHOP BD" || !backup.collections || typeof backup.collections !== "object") {
      return NextResponse.json(
        {
          error:
            "Incompatible backup file: The uploaded file does not appear to be a valid NUR SHOP BD backup.",
        },
        { status: 400 }
      );
    }

    const collections = backup.collections;
    const summary: Record<string, number> = {};
    let totalRecordsToRestore = 0;

    for (const [key, model] of Object.entries(MODEL_MAP)) {
      const records = collections[key];
      if (Array.isArray(records)) {
        summary[key] = records.length;
        totalRecordsToRestore += records.length;
      } else {
        summary[key] = 0;
      }
    }

    // If dry run, return validation report without executing changes
    if (dryRun) {
      return NextResponse.json({
        valid: true,
        dryRun: true,
        createdAt: backup.createdAt || "Unknown",
        version: backup.version || "1.0.0",
        totalRecords: totalRecordsToRestore,
        summary,
        message: "Backup file is valid and ready for restoration.",
      });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const restoredCounts: Record<string, number> = {};

    // Execute safe, non-destructive restoration collection by collection
    for (const [key, model] of Object.entries(MODEL_MAP)) {
      const records = collections[key];
      if (!Array.isArray(records) || records.length === 0) {
        restoredCounts[key] = 0;
        continue;
      }

      let restoredInCollection = 0;
      const bulkOps = [];

      for (const rawDoc of records) {
        if (!rawDoc || typeof rawDoc !== "object") continue;

        // Clean document copy
        const doc = { ...rawDoc };
        const id = doc._id;
        delete doc.__v;

        if (id) {
          const filterId = mongoose.Types.ObjectId.isValid(id)
            ? new mongoose.Types.ObjectId(id)
            : id;

          bulkOps.push({
            replaceOne: {
              filter: { _id: filterId },
              replacement: doc,
              upsert: true,
            },
          });
        } else {
          bulkOps.push({
            insertOne: {
              document: doc,
            },
          });
        }

        restoredInCollection++;
      }

      if (bulkOps.length > 0) {
        await model.bulkWrite(bulkOps, { ordered: false });
      }

      restoredCounts[key] = restoredInCollection;
    }

    // Immediately clear all application memory caches
    clearAllCache();

    // Revalidate Next.js static pages and public paths
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/services");
      revalidatePath("/use-cases");
      revalidatePath("/about");
      revalidatePath("/contact");
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/products");
      revalidatePath("/admin/categories");
    } catch {
      // ignore
    }

    // Record activity log
    await logActivity({
      action: "BACKUP_RESTORE",
      entity: "DatabaseBackup",
      details: `Restored website database from backup dated ${backup.createdAt || "recent"} (${totalRecordsToRestore} records processed)`,
      user: {
        _id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Website backup restored successfully!",
      restoredRecords: totalRecordsToRestore,
      summary: restoredCounts,
    });
  } catch (err: unknown) {
    console.error("Backup restoration error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to restore backup" },
      { status: 500 }
    );
  }
}
