import { NextResponse } from "next/server";
import { getCategories, getSubCategories } from "@/lib/data";
import { withCache } from "@/lib/cache";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tree = await withCache("catalog_tree_api", async () => {
      const [categories, subcategories, products] = await Promise.all([
        getCategories("product"),
        getSubCategories(),
        (async () => {
          try {
            await connectDB();
            const docs = await Product.find({ published: true })
              .select("_id name slug subCategory order")
              .sort({ order: 1, featured: -1, createdAt: -1 })
              .lean();
            return docs || [];
          } catch {
            return [];
          }
        })(),
      ]);

      // Index products by subCategory ID and slug in O(N) single pass
      const prodsBySub = new Map<string, Array<{ _id: string; name: string; slug: string; image: string }>>();
      for (const p of products) {
        if (!p.subCategory) continue;
        const subId = typeof p.subCategory === "object" && p.subCategory && "_id" in p.subCategory
          ? String((p.subCategory as { _id: unknown })._id)
          : String(p.subCategory);
        const subSlug = typeof p.subCategory === "object" && p.subCategory && "slug" in p.subCategory
          ? String((p.subCategory as { slug: unknown }).slug)
          : "";

        const item = {
          _id: String(p._id),
          name: p.name,
          slug: p.slug,
          image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
        };

        if (subId) {
          const list = prodsBySub.get(subId) || [];
          list.push(item);
          prodsBySub.set(subId, list);
        }
        if (subSlug && subSlug !== subId) {
          const list = prodsBySub.get(subSlug) || [];
          list.push(item);
          prodsBySub.set(subSlug, list);
        }
      }

      const treeObj: Record<
        string,
        {
          _id: string;
          name: string;
          slug: string;
          subcategories: Array<{
            _id: string;
            name: string;
            slug: string;
            products: Array<{
              _id: string;
              name: string;
              slug: string;
              image: string;
            }>;
          }>;
        }
      > = {};

      for (const cat of categories) {
        const catId = String(cat._id);
        const catSubs = subcategories.filter((s) => {
          const parentId =
            typeof s.category === "object" && s.category && "_id" in s.category
              ? String(s.category._id)
              : String(s.category);
          return parentId === catId;
        });

        treeObj[cat.slug] = {
          _id: catId,
          name: cat.name,
          slug: cat.slug,
          subcategories: catSubs.map((sub) => {
            const subId = String(sub._id);
            const subProds = prodsBySub.get(subId) || prodsBySub.get(sub.slug) || [];
            return {
              _id: subId,
              name: sub.name,
              slug: sub.slug,
              products: subProds,
            };
          }),
        };
      }

      return treeObj;
    }, 120_000);

    return NextResponse.json(
      { tree },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load catalog tree" },
      { status: 500 }
    );
  }
}
