import { NextResponse } from "next/server";
import { getCategories, getSubCategories, getProducts } from "@/lib/data";
import { withCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tree = await withCache("catalog_tree_api", async () => {
      const [categories, subcategories, products] = await Promise.all([
        getCategories("product"),
        getSubCategories(),
        getProducts(),
      ]);

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
            const subProds = products.filter(
              (p) =>
                p.subCategory &&
                (String(p.subCategory._id) === subId || p.subCategory.slug === sub.slug)
            );
            return {
              _id: subId,
              name: sub.name,
              slug: sub.slug,
              products: subProds.map((p) => ({
                _id: String(p._id),
                name: p.name,
                slug: p.slug,
                image:
                  p.image ||
                  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
              })),
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
