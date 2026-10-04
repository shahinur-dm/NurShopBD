import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { invalidateCache, withCache } from "@/lib/cache";
import { Product, Category, SubCategory, type ICategory } from "@/lib/models";
import { getCurrentAdminUser, logActivity } from "@/lib/auth";
import { getCategories, getSubCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await getCurrentAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const stock = url.searchParams.get("stock") || undefined;
  const published = url.searchParams.get("published") || undefined;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10));

  const filter: Record<string, unknown> = {};

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { brand: { $regex: q, $options: "i" } },
      { shortDescription: { $regex: q, $options: "i" } },
    ];
  }

  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    } else {
      const catDoc = await Category.findOne({ slug: category }).lean<ICategory | null>();
      if (catDoc) {
        filter.$or = [
          { category: catDoc._id },
          { category: String(catDoc._id) },
          { category: catDoc.slug },
        ];
      } else {
        filter.category = category;
      }
    }
  }

  if (stock === "in") filter.inStock = true;
  if (stock === "out") filter.inStock = false;
  if (published === "true") filter.published = true;
  if (published === "false") filter.published = false;

  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const cacheKey = `admin_products_${JSON.stringify({ q, category, stock, published, page, limit })}`;
    const responseData = await withCache(
      cacheKey,
      async () => {
        const rawItems = await Product.find(filter)
          .select(
            "_id name slug sku itemNameModel brand category subCategory price currency image inStock featured published order createdAt"
          )
          .sort({ order: 1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();

        let total = 0;
        try {
          total = await Product.countDocuments(filter);
        } catch {
          total = rawItems.length;
        }

        const allCats = (await getCategories("product")) || [];
        const allSubs = (await getSubCategories()) || [];

        const catMap = new Map<string, { _id: string; name: string; slug: string }>();
        for (const c of allCats) {
          catMap.set(String(c._id), { _id: String(c._id), name: c.name, slug: c.slug });
          catMap.set(c.slug, { _id: String(c._id), name: c.name, slug: c.slug });
        }

        const subMap = new Map<string, { _id: string; name: string; slug: string }>();
        for (const s of allSubs) {
          subMap.set(String(s._id), { _id: String(s._id), name: s.name, slug: s.slug });
          subMap.set(s.slug, { _id: String(s._id), name: s.name, slug: s.slug });
        }

        const items = (rawItems as Record<string, unknown>[]).map((p) => {
          let cat = p.category;
          if (typeof cat === "string" || (cat && mongoose.Types.ObjectId.isValid(cat as string))) {
            cat = catMap.get(String(cat)) || { _id: String(cat), name: String(cat), slug: String(cat) };
          }
          let sub = p.subCategory;
          if (typeof sub === "string" || (sub && mongoose.Types.ObjectId.isValid(sub as string))) {
            sub = subMap.get(String(sub)) || null;
          }
          return {
            ...p,
            category: cat,
            subCategory: sub,
          };
        });

        return {
          items,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
          },
        };
      },
      30_000
    );

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    console.error("Fetch products initial error, attempting retry:", err);
    try {
      // Automatic single retry for transient replica set elections or socket resets
      await new Promise((r) => setTimeout(r, 300));
      const db = await connectDB();
      if (db) {
        const rawItems = await Product.find(filter)
          .select(
            "_id name slug sku itemNameModel brand category subCategory price currency image inStock featured published order createdAt"
          )
          .sort({ order: 1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();

        let total = rawItems.length;
        try {
          total = await Product.countDocuments(filter);
        } catch {
          // ignore count error
        }

        const allCats = (await getCategories("product")) || [];
        const allSubs = (await getSubCategories()) || [];

        const catMap = new Map<string, { _id: string; name: string; slug: string }>();
        for (const c of allCats) {
          catMap.set(String(c._id), { _id: String(c._id), name: c.name, slug: c.slug });
          catMap.set(c.slug, { _id: String(c._id), name: c.name, slug: c.slug });
        }

        const subMap = new Map<string, { _id: string; name: string; slug: string }>();
        for (const s of allSubs) {
          subMap.set(String(s._id), { _id: String(s._id), name: s.name, slug: s.slug });
          subMap.set(s.slug, { _id: String(s._id), name: s.name, slug: s.slug });
        }

        const items = (rawItems as Record<string, unknown>[]).map((p) => {
          let cat = p.category;
          if (typeof cat === "string" || (cat && mongoose.Types.ObjectId.isValid(cat as string))) {
            cat = catMap.get(String(cat)) || { _id: String(cat), name: String(cat), slug: String(cat) };
          }
          let sub = p.subCategory;
          if (typeof sub === "string" || (sub && mongoose.Types.ObjectId.isValid(sub as string))) {
            sub = subMap.get(String(sub)) || null;
          }
          return {
            ...p,
            category: cat,
            subCategory: sub,
          };
        });

        return NextResponse.json({
          items,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
          },
        });
      }
    } catch (retryErr) {
      console.error("Fetch products retry failed:", retryErr);
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const admin = await getCurrentAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role === "viewer") {
    return NextResponse.json({ error: "Forbidden: Viewer cannot edit" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.name || !body.category) {
      return NextResponse.json({ error: "Name and Category are required" }, { status: 400 });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Generate slug
    let slug = (body.slug || body.name || "product")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) slug = `product-${Date.now()}`;

    const existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Resolve Category ID
    let categoryRef: mongoose.Types.ObjectId | string = body.category;
    if (mongoose.Types.ObjectId.isValid(body.category)) {
      categoryRef = new mongoose.Types.ObjectId(body.category);
    } else {
      const foundCat = await Category.findOne({
        $or: [{ slug: body.category }, { name: body.category }],
      });
      if (foundCat) categoryRef = foundCat._id;
    }

    // Resolve SubCategory ID
    let subCategoryRef: mongoose.Types.ObjectId | string | undefined = undefined;
    if (body.subCategory) {
      if (mongoose.Types.ObjectId.isValid(body.subCategory)) {
        subCategoryRef = new mongoose.Types.ObjectId(body.subCategory);
      } else {
        const foundSub = await SubCategory.findOne({
          $or: [{ slug: body.subCategory }, { name: body.subCategory }],
        });
        if (foundSub) subCategoryRef = foundSub._id;
      }
    }

    const createdProduct = await Product.create({
      name: String(body.name).trim(),
      slug,
      sku: body.sku ? String(body.sku).trim() : (body.itemNameModel ? String(body.itemNameModel).trim() : undefined),
      itemNameModel: body.itemNameModel ? String(body.itemNameModel).trim() : (body.sku ? String(body.sku).trim() : undefined),
      benefitPoint1: body.benefitPoint1 !== undefined ? String(body.benefitPoint1).trim() : "100% genuine, authorised stock",
      benefitPoint2: body.benefitPoint2 !== undefined ? String(body.benefitPoint2).trim() : "12-month manufacturer warranty",
      benefitPoint3: body.benefitPoint3 !== undefined ? String(body.benefitPoint3).trim() : "Nationwide delivery in 2-4 days",
      benefitPoint4: body.benefitPoint4 !== undefined ? String(body.benefitPoint4).trim() : "Cash on delivery available",
      brand: body.brand ? String(body.brand).trim() : undefined,
      category: categoryRef,
      subCategory: subCategoryRef,
      shortDescription: body.shortDescription ? String(body.shortDescription).trim() : String(body.name).trim(),
      description: body.description ? String(body.description).trim() : String(body.name).trim(),
      price: body.price !== undefined && body.price !== null && body.price !== "" ? Number(body.price) : undefined,
      currency: body.currency || "BDT",
      image: body.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&q=80",
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
      videoUrl: body.videoUrl ? String(body.videoUrl).trim() : undefined,
      specs: Array.isArray(body.specs) ? body.specs : [],
      specTable: Array.isArray(body.specTable) ? body.specTable : [],
      atAGlance: Array.isArray(body.atAGlance) ? body.atAGlance : [],
      includedItems: Array.isArray(body.includedItems) ? body.includedItems : [],
      beforeYouOrder: Array.isArray(body.beforeYouOrder) ? body.beforeYouOrder : [],
      condition: body.condition || "100% Genuine, Authorised Stock",
      packing: body.packing || "Carton",
      warranty: body.warranty || "12-month manufacturer warranty",
      warrantyAndReturns: body.warrantyAndReturns || "",
      availabilityText: body.availabilityText || "In stock – confirm lead time",
      deliveryTime: body.deliveryTime || "2–3 Working Days",
      options: Array.isArray(body.options) ? body.options : [],
      variants: Array.isArray(body.variants) ? body.variants : [],
      inStock: body.inStock !== false,
      featured: Boolean(body.featured),
      published: body.published !== false,
      order: Number(body.order) || 0,
      relatedProducts: Array.isArray(body.relatedProducts) ? body.relatedProducts : [],
      relatedServices: Array.isArray(body.relatedServices) ? body.relatedServices : [],
    });

    await logActivity({
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: String(createdProduct._id),
      details: `Created product "${createdProduct.name}" (SKU: ${createdProduct.sku || "N/A"})`,
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
      revalidatePath("/products");
      revalidatePath(`/products/${createdProduct.slug}`);
      revalidatePath("/admin/products");
      revalidatePath("/api/catalog-tree");
      revalidatePath("/api/products");
    } catch {
      // ignore revalidation error
    }
    invalidateCache();

    return NextResponse.json({ success: true, product: createdProduct });
  } catch (err: unknown) {
    console.error("Create product error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
