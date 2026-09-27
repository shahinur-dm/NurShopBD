import { connectDB } from "../src/lib/mongodb";
import { Category, SubCategory, Product } from "../src/lib/models";

interface SubDef {
  name: string;
  order: number;
}

interface CatDef {
  name: string;
  order: number;
  description: string;
  subcategories: SubDef[];
}

export const CATEGORIES_DEFINITION: CatDef[] = [
  {
    name: "MACHINERIES",
    order: 0,
    description: "We supply Injection molding machine of remarkable brands only. Because customer satisfaction is our main goal.",
    subcategories: [
      { name: "Horizontal Injection molding machine", order: 1 },
      { name: "Vertical Injection molding machine", order: 2 },
      { name: "Twin color Injection molding machine", order: 3 },
      { name: "HDPE Blow molding machine (BMM)", order: 4 },
      { name: "PET Blow molding machine", order: 5 },
      { name: "Crusher Machine", order: 6 },
      { name: "Mixer machine", order: 7 },
      { name: "Industrial Chiller", order: 8 },
      { name: "Heat Seal Printing machine", order: 9 },
      { name: "PAD Printing machine", order: 10 },
      { name: "Hot Stamping machine", order: 11 },
      { name: "Packaging Machineries", order: 12 },
    ],
  },
  {
    name: "Injection molding machine",
    order: 1,
    description: "Industrial plastic injection molding machinery and auxiliary equipment.",
    subcategories: [
      { name: "Horizontal Injection molding machine", order: 1 },
      { name: "Vertical Injection molding machine", order: 2 },
      { name: "Twin Color injection molding machine", order: 3 },
      { name: "PLC & HMI Full Set", order: 4 },
      { name: "TECH1 full PLC set", order: 5 },
      { name: "TECH2 PLC full set", order: 6 },
      { name: "AK668 PLC full set", order: 7 },
      { name: "AK628 PLC full set", order: 8 },
      { name: "AK580 PLC full set", order: 9 },
      { name: "iTech5610 PLC full set", order: 10 },
      { name: "iTech5620 PLC full set", order: 11 },
      { name: "iTech5630 PLC full set", order: 12 },
      { name: "Porcheson MS300 PLC set", order: 13 },
      { name: "Porcheson MS500 PLC set", order: 14 },
      { name: "Porcheson MS700 PLC set", order: 15 },
      { name: "Ai530 PLC full set", order: 16 },
      { name: "Mi530Li PLC full set", order: 17 },
    ],
  },
  {
    name: "PLC & HMI",
    order: 2,
    description: "Programmable logic controllers, HMI touch screens and complete automation sets.",
    subcategories: [
      { name: "Injection molding machine PLC", order: 1 },
      { name: "Semi Auto PET blow controller", order: 2 },
      { name: "PLC full set", order: 3 },
      { name: "HMI full set", order: 4 },
      { name: "TECH1 PLC set", order: 5 },
      { name: "TECH2 PLC set", order: 6 },
      { name: "AK580 PLC set", order: 7 },
      { name: "AK628 PLC set", order: 8 },
      { name: "AK668 PLC set", order: 9 },
      { name: "iTech PLC set", order: 10 },
      { name: "Porcheson MS300 PLC set", order: 11 },
      { name: "Porcheson MS500 PLC set", order: 12 },
      { name: "Porcheson MS700 PLC set", order: 13 },
      { name: "HAITIAN HMI", order: 14 },
      { name: "MMI card", order: 15 },
      { name: "Likui PLC", order: 16 },
      { name: "Ai530Li", order: 17 },
      { name: "Mi538Li", order: 18 },
      { name: "HERING 628", order: 19 },
      { name: "Siemens", order: 20 },
      { name: "DELTA", order: 21 },
      { name: "MITSUBISHI", order: 22 },
      { name: "ALLEN BRADLY", order: 23 },
    ],
  },
  {
    name: "Circuit boards/cards",
    order: 3,
    description: "MMR, temperature, I/O, amplifier and specialized control boards.",
    subcategories: [
      { name: "MMR card (MMR 270, MMR 255)", order: 1 },
      { name: "Temperature card", order: 2 },
      { name: "Pressure & Flow control card", order: 3 },
      { name: "Thermo couple connection card", order: 4 },
      { name: "I/O Card", order: 5 },
      { name: "PLC I/O Amplifier card", order: 6 },
      { name: "TECH1", order: 7 },
      { name: "TECH2", order: 8 },
      { name: "AK580", order: 9 },
      { name: "AK668", order: 10 },
      { name: "MS300", order: 11 },
      { name: "MS500", order: 12 },
      { name: "MS700", order: 13 },
      { name: "Ai530Li", order: 14 },
      { name: "Mi530Li", order: 15 },
      { name: "Ai580T6", order: 16 },
      { name: "Mi580T8", order: 17 },
      { name: "Ai103", order: 18 },
    ],
  },
  {
    name: "Servo System (Servo motor , Servo Drive , Servo pump)",
    order: 4,
    description: "High-precision servo drives, Servo motors, pumps, encoders, Breaking Resistor, Pressure sensor and accessories.",
    subcategories: [
      { name: "Servo Drive (INOVANCE, Hilectro, Techmation, HiTech, KEB)", order: 1 },
      { name: "Servo motor", order: 2 },
      { name: "Servo pump", order: 3 },
      { name: "Encoder", order: 4 },
      { name: "Breaking Resistor", order: 5 },
      { name: "Encoder cable", order: 6 },
      { name: "Coupling items", order: 7 },
      { name: "Pressure sensor", order: 8 },
    ],
  },
  {
    name: "Servo Motors",
    order: 5,
    description: "Induction, servo and gear motors.",
    subcategories: [],
  },
  {
    name: "Servo Drives",
    order: 6,
    description: "INOVANCE, Hilectro, INVT, Techmation, EST, HiTech, Panasonic, Siemens, Xingtai, Haitian etc for Injection molding machine.",
    subcategories: [],
  },
  {
    name: "Hydraulic Pumps",
    order: 7,
    description: "SUMITOMO, Yuken, Rexroth, Techmation, HYTEK, VJOKERS, Gear pump, vane pump etc Pumps for your machine.",
    subcategories: [],
  },
  {
    name: "Hydraulic items",
    order: 9,
    description: "Hydraulic valve, pump, pipe and fittings items.",
    subcategories: [],
  },
  {
    name: "Hopper Dryer and Vaccum Autoloader",
    order: 10,
    description: "Preheating hopper dryer and vaccum auto loader for injection molding machine. 300G, 600G, 700G, 800G, 900G etc.",
    subcategories: [
      { name: "Semi Auto PET blowing machine", order: 1 },
      { name: "HDPE blow molding machine", order: 2 },
      { name: "Extrusion blowing machine for sheet", order: 3 },
    ],
  },
  {
    name: "Industrial Chiller",
    order: 11,
    description: "Air Cooled chiller, Water cooled Industrial refrigeration Chiller.",
    subcategories: [],
  },
  {
    name: "Crusher machine",
    order: 12,
    description: "Heavy-duty plastic granulators, shredders and crushing machinery.",
    subcategories: [],
  },
  {
    name: "Mixer Machine",
    order: 13,
    description: "Industrial horizontal and vertical plastic resin or color mixer machine.",
    subcategories: [
      { name: "BLC sub", order: 1 },
    ],
  },
  {
    name: "HDPE Blow molding machine (BMM)",
    order: 14,
    description: "Extruder machine, Extrusion machine, HDPE Blow molding machine etc.",
    subcategories: [],
  },
  {
    name: "Semi Auto PET Blowing machine",
    order: 15,
    description: "Semi Auto PET Blow machine, Heating chamber with High Pressure Air Compressor.",
    subcategories: [],
  },
  {
    name: "VFD / Inverters",
    order: 16,
    description: "Variable frequency drives (VFD) and soft starters.",
    subcategories: [],
  },
  {
    name: "Printing and Packaging machine",
    order: 17,
    description: "Heat seal, shrink wrap, hot stamping and pad printing machines.",
    subcategories: [
      { name: "Heat seal printing machine", order: 1 },
      { name: "Shrink wrapping machine", order: 2 },
      { name: "Hot stamping machine", order: 3 },
      { name: "PAD Printing machine", order: 4 },
    ],
  },
  {
    name: "Sensors",
    order: 18,
    description: "Proximity, photoelectric and encoder sensors.",
    subcategories: [],
  },
  {
    name: "Relay, timer, counter etc",
    order: 19,
    description: "Relay, timer, counter, overload relays etc.",
    subcategories: [],
  },
  {
    name: "Over head Industrial Crane",
    order: 21,
    description: "Industrial over head crane for your industry.",
    subcategories: [],
  },
  {
    name: "Air Compressor",
    order: 23,
    description: "Air compressor systems and industrial cooling equipment.",
    subcategories: [
      { name: "Water cooled chiller", order: 1 },
      { name: "Air cooled chiller", order: 2 },
    ],
  },
  {
    name: "HMI & Display",
    order: 25,
    description: "Operator panels and industrial HMI displays.",
    subcategories: [
      { name: "HMI", order: 1 },
    ],
  },
  {
    name: "Industrial Robot",
    order: 27,
    description: "Industrial Robot to make automated production system to reduce production cost, Improve product Quality and accuracy for smooth production.",
    subcategories: [],
  },
  {
    name: "Automation items",
    order: 29,
    description: "Automation make your factory highly productive by de",
    subcategories: [],
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  await connectDB();
  console.log("Connected to MongoDB for 24 Categories & 89 Subcategories sync...");

  // Generate category slug map
  const categoryDocsMap = new Map<string, any>();
  const createdSubSlugs = new Set<string>();

  // 1. Process 24 Main Categories
  const categorySlugs = new Set<string>();
  for (const catDef of CATEGORIES_DEFINITION) {
    let catSlug = slugify(catDef.name);
    // ensure unique category slug
    if (categorySlugs.has(catSlug)) {
      catSlug = `${catSlug}-${catDef.order}`;
    }
    categorySlugs.add(catSlug);

    // Look for existing category by name or slug
    let catDoc = await Category.findOne({
      $or: [
        { name: catDef.name },
        { slug: catSlug },
      ],
    });

    if (catDoc) {
      catDoc.name = catDef.name;
      catDoc.slug = catSlug;
      catDoc.order = catDef.order;
      catDoc.description = catDef.description;
      catDoc.type = "product";
      await catDoc.save();
    } else {
      catDoc = await Category.create({
        name: catDef.name,
        slug: catSlug,
        order: catDef.order,
        description: catDef.description,
        type: "product",
      });
    }

    categoryDocsMap.set(catDef.name, catDoc);
    console.log(`Saved Category [Order ${catDef.order}]: ${catDoc.name} (${catDoc.slug}) -> ID: ${catDoc._id}`);
  }

  // 2. Remove legacy product categories not in the 24 list and remap products
  const allCurrentProdCats = await Category.find({ type: "product" });
  const validCatIds = new Set(Array.from(categoryDocsMap.values()).map(c => String(c._id)));

  for (const oldCat of allCurrentProdCats) {
    if (!validCatIds.has(String(oldCat._id))) {
      console.log(`Cleaning up old category: ${oldCat.name} (${oldCat.slug})`);
      // Find matching replacement category for products
      let replacement = categoryDocsMap.get("PLC & HMI");
      if (/motor/i.test(oldCat.name)) replacement = categoryDocsMap.get("Servo Motors");
      else if (/drive|vfd/i.test(oldCat.name)) replacement = categoryDocsMap.get("VFD / Inverters");
      else if (/sensor/i.test(oldCat.name)) replacement = categoryDocsMap.get("Sensors");
      else if (/relay/i.test(oldCat.name)) replacement = categoryDocsMap.get("Relay, timer, counter etc");
      else if (/hmi/i.test(oldCat.name)) replacement = categoryDocsMap.get("HMI & Display");

      if (replacement) {
        await Product.updateMany(
          { $or: [{ category: oldCat._id }, { category: oldCat.slug }] },
          { category: replacement._id }
        );
      }
      await Category.findByIdAndDelete(oldCat._id);
    }
  }

  // 3. Clear existing SubCategories and insert all 89 exact subcategories
  await SubCategory.deleteMany({});
  console.log("Cleared old subcategories.");

  let totalSubCount = 0;

  for (const catDef of CATEGORIES_DEFINITION) {
    const parentCatDoc = categoryDocsMap.get(catDef.name);
    if (!parentCatDoc) continue;

    for (const subDef of catDef.subcategories) {
      let baseSlug = slugify(subDef.name);
      let subSlug = baseSlug;

      // Ensure global uniqueness for subcategory slug
      if (createdSubSlugs.has(subSlug)) {
        subSlug = `${slugify(parentCatDoc.name)}-${baseSlug}`;
      }
      if (createdSubSlugs.has(subSlug)) {
        subSlug = `${subSlug}-${subDef.order}`;
      }
      createdSubSlugs.add(subSlug);

      await SubCategory.create({
        name: subDef.name,
        slug: subSlug,
        category: parentCatDoc._id,
        order: subDef.order,
        published: true,
      });

      totalSubCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`SYNC COMPLETE:`);
  console.log(`- Main Categories: ${CATEGORIES_DEFINITION.length} (Expected: 24)`);
  console.log(`- Sub-Categories: ${totalSubCount} (Expected: 89)`);
  console.log(`========================================\n`);

  process.exit(0);
}

run().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
