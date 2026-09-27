import { connectDB } from "../src/lib/mongodb";
import { Category, SubCategory, Product } from "../src/lib/models";

async function run() {
  await connectDB();
  const cats = await Category.find().lean();
  const subs = await SubCategory.find().lean();
  const prods = await Product.find().lean();
  console.log("Current Categories in DB:", cats.length);
  cats.forEach(c => console.log(`- [${c.order}] ${c.name} (${c.slug}) id: ${c._id}`));
  console.log("\nCurrent Subcategories in DB:", subs.length);
  console.log("\nCurrent Products in DB:", prods.length);
  process.exit(0);
}

run().catch(console.error);
