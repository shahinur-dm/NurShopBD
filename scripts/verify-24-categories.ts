import { connectDB } from "../src/lib/mongodb";
import { Category, SubCategory, Product } from "../src/lib/models";

async function verify() {
  await connectDB();
  const cats = await Category.find({ type: "product" }).sort({ order: 1 }).lean();
  const subs = await SubCategory.find().populate("category").sort({ order: 1 }).lean();
  const prods = await Product.find().lean();

  console.log(`\n================= VERIFICATION REPORT =================`);
  console.log(`Total Product Categories: ${cats.length} (Expected: 24)`);
  console.log(`Total Sub-Categories: ${subs.length} (Expected: 89)`);
  console.log(`Total Products preserved: ${prods.length}`);
  console.log(`-------------------------------------------------------`);

  let errorCount = 0;
  for (const cat of cats) {
    const matchingSubs = subs.filter((s) => {
      const parentId = typeof s.category === "object" && s.category ? String(s.category._id) : String(s.category);
      return parentId === String(cat._id);
    });

    console.log(`[Order: ${cat.order}] ${cat.name} (${cat.slug}) -> ${matchingSubs.length} sub-categories`);
    for (const sub of matchingSubs) {
      console.log(`    - [${sub.order}] ${sub.name} (slug: ${sub.slug})`);
    }
  }

  if (cats.length !== 24) {
    console.error(`ERROR: Expected 24 categories, found ${cats.length}`);
    errorCount++;
  }
  if (subs.length !== 89) {
    console.error(`ERROR: Expected 89 subcategories, found ${subs.length}`);
    errorCount++;
  }

  console.log(`\nVerification finished with ${errorCount} errors.`);
  process.exit(errorCount > 0 ? 1 : 0);
}

verify().catch(console.error);
