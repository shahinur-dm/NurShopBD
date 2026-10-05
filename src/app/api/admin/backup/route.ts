import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentAdminUser, logActivity } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
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
  ActivityLog,
  DownloadFile,
  Order,
} from "@/lib/models";

export const dynamic = "force-dynamic";

// Map collection names to their respective models
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COLLECTION_MODELS: Record<string, { model: any; projection?: any; sort?: any }> = {
  products: { model: Product },
  categories: { model: Category },
  subcategories: { model: SubCategory },
  brands: { model: Brand },
  services: { model: Service },
  features: { model: Feature },
  banners: { model: Banner },
  blogPosts: { model: BlogPost },
  blogCategories: { model: BlogCategory },
  useCases: { model: UseCase },
  siteSettings: { model: SiteSettings },
  companyProfile: { model: CompanyProfile },
  contactMessages: { model: ContactMessage },
  users: {
    model: User,
    projection: { passwordHash: 1, email: 1, name: 1, role: 1, active: 1, phone: 1, createdAt: 1, updatedAt: 1 },
  },
  mediaItems: { model: MediaItem },
  activityLogs: { model: ActivityLog, sort: { createdAt: -1 } },
  downloadFiles: { model: DownloadFile },
  orders: { model: Order },
};

/**
 * GET /api/admin/backup
 * Supports:
 * - ?manifest=true -> Returns counts for all collections + admin metadata
 * - ?collection=<name>&skip=0&limit=10 -> Returns chunked collection data
 * - Default -> Generates full JSON backup
 */
export async function GET(req: Request) {
  const admin = await getCurrentAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const isManifest = searchParams.get("manifest") === "true";
    const collectionParam = searchParams.get("collection");

    // 1. MANIFEST MODE: Return metadata and collection counts
    if (isManifest) {
      const counts: Record<string, number> = {};
      let totalRecords = 0;

      for (const [key, config] of Object.entries(COLLECTION_MODELS)) {
        try {
          const count = await config.model.countDocuments();
          counts[key] = count;
          totalRecords += count;
        } catch {
          counts[key] = 0;
        }
      }

      return NextResponse.json({
        system: "NUR SHOP BD",
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        exportedBy: {
          _id: String(admin._id),
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        counts,
        totalRecords,
        collectionsList: Object.keys(COLLECTION_MODELS),
      });
    }

    // 2. CHUNKED COLLECTION MODE: Return data for a single collection with pagination
    if (collectionParam && COLLECTION_MODELS[collectionParam]) {
      const config = COLLECTION_MODELS[collectionParam];
      const skip = parseInt(searchParams.get("skip") || "0", 10);
      const limit = parseInt(searchParams.get("limit") || "50", 10);

      let query = config.model.find({}, config.projection || {});
      if (config.sort) {
        query = query.sort(config.sort);
      } else {
        query = query.sort({ _id: 1 });
      }
      if (skip > 0) query = query.skip(skip);
      if (limit > 0) query = query.limit(limit);

      const items = await query.lean();
      return NextResponse.json({
        collection: collectionParam,
        skip,
        limit,
        count: items.length,
        data: serialize(items),
      });
    }

    // 3. FULL BACKUP MODE (Direct Single Request):
    const backupCollections: Record<string, unknown[]> = {};
    const counts: Record<string, number> = {};
    let totalRecords = 0;

    for (const [key, config] of Object.entries(COLLECTION_MODELS)) {
      const totalInCol = await config.model.countDocuments();
      counts[key] = totalInCol;
      totalRecords += totalInCol;

      const items: Record<string, unknown>[] = [];
      const batchSize = key === "products" || key === "mediaItems" ? 10 : 100;
      for (let i = 0; i < totalInCol; i += batchSize) {
        let query = config.model.find({}, config.projection || {});
        if (config.sort) query = query.sort(config.sort);
        const chunk = await query.skip(i).limit(batchSize).lean();
        items.push(...(chunk as unknown as Record<string, unknown>[]));
      }
      backupCollections[key] = serialize(items);
    }

    const backupData = {
      system: "NUR SHOP BD",
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      exportedBy: {
        _id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      counts,
      totalRecords,
      collections: backupCollections,
    };

    // Log the backup action
    await logActivity({
      action: "BACKUP_DOWNLOAD",
      entity: "DatabaseBackup",
      details: `Generated and downloaded complete website backup (${backupData.totalRecords} records)`,
      user: {
        _id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const filename = `nurshopbd_backup_${timestamp}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    console.error("Backup generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate backup" },
      { status: 500 }
    );
  }
}
