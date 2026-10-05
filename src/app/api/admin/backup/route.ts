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

/**
 * GET /api/admin/backup
 * Generates a complete, non-destructive JSON backup bundle of all NUR SHOP BD database collections.
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

    // Safely query collections with chunked batching for large collections to prevent network timeouts
    const productCount = await Product.countDocuments();
    const products: Record<string, unknown>[] = [];
    for (let i = 0; i < productCount; i += 10) {
      const chunk = await Product.find({}).skip(i).limit(10).lean();
      products.push(...(chunk as unknown as Record<string, unknown>[]));
    }

    const categories = await Category.find({}).lean();
    const subcategories = await SubCategory.find({}).lean();
    const brands = await Brand.find({}).lean();
    const services = await Service.find({}).lean();
    const features = await Feature.find({}).lean();
    const banners = await Banner.find({}).lean();
    const blogPosts = await BlogPost.find({}).lean();
    const blogCategories = await BlogCategory.find({}).lean();
    const useCases = await UseCase.find({}).lean();
    const siteSettings = await SiteSettings.find({}).lean();
    const companyProfile = await CompanyProfile.find({}).lean();
    const contactMessages = await ContactMessage.find({}).lean();
    const users = await User.find({}, { passwordHash: 1, email: 1, name: 1, role: 1, active: 1, phone: 1, createdAt: 1, updatedAt: 1 }).lean();

    const mediaCount = await MediaItem.countDocuments();
    const mediaItems: Record<string, unknown>[] = [];
    for (let i = 0; i < mediaCount; i += 10) {
      const chunk = await MediaItem.find({}).skip(i).limit(10).lean();
      mediaItems.push(...(chunk as unknown as Record<string, unknown>[]));
    }

    const activityLogs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(500).lean();
    const downloadFiles = await DownloadFile.find({}).lean();
    const orders = await Order.find({}).lean();

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
      counts: {
        products: products.length,
        categories: categories.length,
        subcategories: subcategories.length,
        brands: brands.length,
        services: services.length,
        features: features.length,
        banners: banners.length,
        blogPosts: blogPosts.length,
        blogCategories: blogCategories.length,
        useCases: useCases.length,
        siteSettings: siteSettings.length,
        companyProfile: companyProfile.length,
        contactMessages: contactMessages.length,
        users: users.length,
        mediaItems: mediaItems.length,
        activityLogs: activityLogs.length,
        downloadFiles: downloadFiles.length,
        orders: orders.length,
      },
      totalRecords:
        products.length +
        categories.length +
        subcategories.length +
        brands.length +
        services.length +
        features.length +
        banners.length +
        blogPosts.length +
        blogCategories.length +
        useCases.length +
        siteSettings.length +
        companyProfile.length +
        contactMessages.length +
        users.length +
        mediaItems.length +
        activityLogs.length +
        downloadFiles.length +
        orders.length,
      collections: {
        products: serialize(products),
        categories: serialize(categories),
        subcategories: serialize(subcategories),
        brands: serialize(brands),
        services: serialize(services),
        features: serialize(features),
        banners: serialize(banners),
        blogPosts: serialize(blogPosts),
        blogCategories: serialize(blogCategories),
        useCases: serialize(useCases),
        siteSettings: serialize(siteSettings),
        companyProfile: serialize(companyProfile),
        contactMessages: serialize(contactMessages),
        users: serialize(users),
        mediaItems: serialize(mediaItems),
        activityLogs: serialize(activityLogs),
        downloadFiles: serialize(downloadFiles),
        orders: serialize(orders),
      },
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
