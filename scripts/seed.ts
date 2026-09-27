import mongoose from "mongoose";
import {
  SiteSettings,
  Category,
  Product,
  Service,
  Banner,
  CompanyProfile,
  ContactMessage,
  UseCase,
} from "../src/lib/models";
import { navLinks, useCaseContent } from "../src/lib/use-cases";

const img = {
  plc: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&q=80",
  motor: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80",
  drive: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80",
  sensor: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1600&q=80",
  panel: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
  factory: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1600&q=80",
  bearing: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=80",
  cable: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&q=80",
  workshop: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1600&q=80",
};

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  await mongoose.connect(uri);
  console.log("Connected. Seeding Nur Engineering Solution catalog...");

  await Promise.all([
    SiteSettings.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Service.deleteMany({}),
    Banner.deleteMany({}),
    CompanyProfile.deleteMany({}),
    ContactMessage.deleteMany({}),
    UseCase.deleteMany({}),
  ]);

  await SiteSettings.create({
    brandName: "NUR SHOP BD",
    tagline: "Machine, spare parts and Technical service provider",
    description:
      "EEE-led supplier of PLC, motors, drives, sensors, contactors and industrial spare parts — with technical service for workshops, factories and labs across Bangladesh.",
    email: "info@nurengineering.com",
    phone: "+880 1700-000000",
    address: "Dhaka, Bangladesh",
    hours: "Sat–Thu 9:00–18:00",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=Dhaka%2C%20Bangladesh&t=&z=13&ie=UTF8&iwloc=&output=embed",
    social: {
      facebook: "https://www.facebook.com/",
      linkedin: "https://www.linkedin.com/",
      instagram: "https://www.instagram.com/",
      youtube: "https://www.youtube.com/",
    },
    seo: {
      defaultTitle:
        "NUR SHOP BD | Machine Parts & Technical Service",
      defaultDescription:
        "Buy PLC, motors, VFD, sensors and industrial spare parts. Technical service from an EEE engineering desk in Bangladesh.",
      keywords: [
        "NUR SHOP BD",
        "PLC Bangladesh",
        "machine spare parts",
        "VFD drive",
        "industrial motors",
        "EEE parts",
      ],
    },
    analytics: {
      gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
      googleSiteVerification:
        process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
    nav: navLinks,
  });

  const cats = await Category.insertMany([
    { name: "MACHINERIES", slug: "machineries", type: "product", order: 0, description: "We supply Injection molding machine of remarkable brands only. Because customer satisfaction is our main goal." },
    { name: "Injection molding machine", slug: "injection-molding-machine", type: "product", order: 1, description: "Industrial plastic injection molding machinery and auxiliary equipment." },
    { name: "PLC & HMI", slug: "plc-hmi", type: "product", order: 2, description: "Programmable logic controllers, HMI touch screens and complete automation sets." },
    { name: "Circuit boards/cards", slug: "circuit-boardscards", type: "product", order: 3, description: "MMR, temperature, I/O, amplifier and specialized control boards." },
    { name: "Servo System (Servo motor , Servo Drive , Servo pump)", slug: "servo-system-servo-motor-servo-drive-servo-pump", type: "product", order: 4, description: "High-precision servo drives, Servo motors, pumps, encoders, Breaking Resistor, Pressure sensor and accessories." },
    { name: "Servo Motors", slug: "servo-motors", type: "product", order: 5, description: "Induction, servo and gear motors." },
    { name: "Servo Drives", slug: "servo-drives", type: "product", order: 6, description: "INOVANCE, Hilectro, INVT, Techmation, EST, HiTech, Panasonic, Siemens, Xingtai, Haitian etc for Injection molding machine." },
    { name: "Hydraulic Pumps", slug: "hydraulic-pumps", type: "product", order: 7, description: "SUMITOMO, Yuken, Rexroth, Techmation, HYTEK, VJOKERS, Gear pump, vane pump etc Pumps for your machine." },
    { name: "Hydraulic items", slug: "hydraulic-items", type: "product", order: 9, description: "Hydraulic valve, pump, pipe and fittings items." },
    { name: "Hopper Dryer and Vaccum Autoloader", slug: "hopper-dryer-and-vaccum-autoloader", type: "product", order: 10, description: "Preheating hopper dryer and vaccum auto loader for injection molding machine. 300G, 600G, 700G, 800G, 900G etc." },
    { name: "Industrial Chiller", slug: "industrial-chiller", type: "product", order: 11, description: "Air Cooled chiller, Water cooled Industrial refrigeration Chiller." },
    { name: "Crusher machine", slug: "crusher-machine", type: "product", order: 12, description: "Heavy-duty plastic granulators, shredders and crushing machinery." },
    { name: "Mixer Machine", slug: "mixer-machine", type: "product", order: 13, description: "Industrial horizontal and vertical plastic resin or color mixer machine." },
    { name: "HDPE Blow molding machine (BMM)", slug: "hdpe-blow-molding-machine-bmm", type: "product", order: 14, description: "Extruder machine, Extrusion machine, HDPE Blow molding machine etc." },
    { name: "Semi Auto PET Blowing machine", slug: "semi-auto-pet-blowing-machine", type: "product", order: 15, description: "Semi Auto PET Blow machine, Heating chamber with High Pressure Air Compressor." },
    { name: "VFD / Inverters", slug: "vfd-inverters", type: "product", order: 16, description: "Variable frequency drives (VFD) and soft starters." },
    { name: "Printing and Packaging machine", slug: "printing-and-packaging-machine", type: "product", order: 17, description: "Heat seal, shrink wrap, hot stamping and pad printing machines." },
    { name: "Sensors", slug: "sensors", type: "product", order: 18, description: "Proximity, photoelectric and encoder sensors." },
    { name: "Relay, timer, counter etc", slug: "relay-timer-counter-etc", type: "product", order: 19, description: "Relay, timer, counter, overload relays etc." },
    { name: "Over head Industrial Crane", slug: "over-head-industrial-crane", type: "product", order: 21, description: "Industrial over head crane for your industry." },
    { name: "Air Compressor", slug: "air-compressor", type: "product", order: 23, description: "Air compressor systems and industrial cooling equipment." },
    { name: "HMI & Display", slug: "hmi-display", type: "product", order: 25, description: "Operator panels and industrial HMI displays." },
    { name: "Industrial Robot", slug: "industrial-robot", type: "product", order: 27, description: "Industrial Robot to make automated production system to reduce production cost, Improve product Quality and accuracy for smooth production." },
    { name: "Automation items", slug: "automation-items", type: "product", order: 29, description: "Automation make your factory highly productive by de" },
    { name: "Technical Service", slug: "technical-service", type: "service", order: 1 },
  ]);

  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));

  await Banner.insertMany([
    {
      title: "Industrial PLC & Automation Parts",
      subtitle: "Siemens, Delta, Mitsubishi and Omron controllers in stock for panel builders.",
      image: img.plc,
      ctaLabel: "Browse PLC",
      ctaHref: "/products?category=plc",
      order: 1,
      active: true,
    },
    {
      title: "Motors, Drives & Spare Parts",
      subtitle: "Matched 3-phase motors and VFDs for pumps, conveyors and workshop machines.",
      image: img.motor,
      ctaLabel: "View motors",
      ctaHref: "/products?category=motors",
      order: 2,
      active: true,
    },
    {
      title: "Technical Service You Can Call",
      subtitle: "EEE-backed part matching, panel support and substitution advice.",
      image: img.workshop,
      ctaLabel: "Our services",
      ctaHref: "/services",
      order: 3,
      active: true,
    },
  ]);

  await UseCase.insertMany(
    useCaseContent.map((item) => ({ ...item, published: true }))
  );

  const services = await Service.insertMany([
    {
      title: "PLC Programming Support",
      slug: "plc-programming-support",
      shortDescription: "I/O mapping, basic ladder logic and panel commissioning help.",
      description:
        "Practical PLC support for small automation jobs — module selection, I/O lists, and first-run checks so your panel actually starts.",
      image: img.plc,
      features: ["Controller selection", "I/O list review", "First-run support"],
      category: bySlug["technical-service"]._id,
      order: 1,
      featured: true,
      published: true,
    },
    {
      title: "Motor & Drive Matching",
      slug: "motor-drive-matching",
      shortDescription: "Correct kW, voltage and VFD pairing for the machine you already have.",
      description:
        "We match motors and VFDs by rating, frame, and application so replacements fit pumps, fans and conveyors without guesswork.",
      image: img.drive,
      features: ["kW / HP matching", "VFD sizing", "Soft-start options"],
      category: bySlug["technical-service"]._id,
      order: 2,
      featured: true,
      published: true,
    },
    {
      title: "Control Panel Parts",
      slug: "control-panel-parts",
      shortDescription: "Contactors, breakers, relays and DIN hardware as a kit.",
      description:
        "One-desk supply for panel builders: protection, switching, terminals and power supplies pulled to a parts list.",
      image: img.panel,
      features: ["Starter kits", "Protection devices", "DIN-rail hardware"],
      category: bySlug["technical-service"]._id,
      order: 3,
      featured: true,
      published: true,
    },
    {
      title: "Sensor & Automation Fit",
      slug: "sensor-automation-fit",
      shortDescription: "Proximity, photoelectric and encoder selection for real machines.",
      description:
        "We help you pick sensing distance, output type (NPN/PNP) and housing so sensors survive the job, not just the datasheet.",
      image: img.sensor,
      features: ["NPN/PNP selection", "IP rating advice", "Mounting options"],
      category: bySlug["technical-service"]._id,
      order: 4,
      featured: true,
      published: true,
    },
    {
      title: "Spare Parts Sourcing",
      slug: "spare-parts-sourcing",
      shortDescription: "OEM and compatible alternatives from a photo or part number.",
      description:
        "Send a photo, nameplate or part number. We cross-reference and quote working equivalents for workshops that cannot wait.",
      image: img.factory,
      features: ["Part-number search", "Compatible options", "Nationwide delivery"],
      category: bySlug["technical-service"]._id,
      order: 5,
      featured: true,
      published: true,
    },
  ]);

  const svcBySlug = Object.fromEntries(services.map((s) => [s.slug, s]));

  // Seed all 89 subcategories
  const createdSubSlugs = new Set<string>();
  for (const catDef of [
    {
      name: "MACHINERIES",
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
      name: "Hopper Dryer and Vaccum Autoloader",
      subcategories: [
        { name: "Semi Auto PET blowing machine", order: 1 },
        { name: "HDPE blow molding machine", order: 2 },
        { name: "Extrusion blowing machine for sheet", order: 3 },
      ],
    },
    {
      name: "Mixer Machine",
      subcategories: [{ name: "BLC sub", order: 1 }],
    },
    {
      name: "Printing and Packaging machine",
      subcategories: [
        { name: "Heat seal printing machine", order: 1 },
        { name: "Shrink wrapping machine", order: 2 },
        { name: "Hot stamping machine", order: 3 },
        { name: "PAD Printing machine", order: 4 },
      ],
    },
    {
      name: "Air Compressor",
      subcategories: [
        { name: "Water cooled chiller", order: 1 },
        { name: "Air cooled chiller", order: 2 },
      ],
    },
    {
      name: "HMI & Display",
      subcategories: [{ name: "HMI", order: 1 }],
    },
  ]) {
    const parentCat = cats.find((c) => c.name === catDef.name);
    if (!parentCat) continue;
    for (const sub of catDef.subcategories) {
      let slug = sub.name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
      if (createdSubSlugs.has(slug)) slug = `${parentCat.slug}-${slug}`;
      if (createdSubSlugs.has(slug)) slug = `${slug}-${sub.order}`;
      createdSubSlugs.add(slug);
      await SubCategory.create({
        name: sub.name,
        slug,
        category: parentCat._id,
        order: sub.order,
        published: true,
      });
    }
  }

  const products = await Product.insertMany([
    // 4 Featured Products (Screenshot 1st row)
    {
      name: "7-Inch HMI Touch Panel",
      slug: "hmi-7-inch",
      sku: "NES-HMI-7",
      brand: "Weintek / Delta class",
      category: bySlug["hmi-display"]._id,
      shortDescription: "7-inch industrial HMI with Ethernet and serial.",
      description:
        "Operator panel for PLC visualization. Drivers for common Delta, Siemens and Mitsubishi PLCs.",
      price: 18500,
      currency: "BDT",
      image: img.plc,
      specs: ["7 inch", "Ethernet", "RS232/485", "IP65 front"],
      relatedServices: [svcBySlug["plc-programming-support"]._id],
      inStock: true,
      featured: true,
      published: true,
      order: 1,
    },
    {
      name: "Inductive Proximity Sensor M18",
      slug: "proximity-sensor-m18",
      sku: "NES-SNS-M18",
      brand: "Autonics / equivalent",
      category: bySlug.sensors._id,
      shortDescription: "M18 inductive proximity sensor for metal detection.",
      description:
        "Industrial inductive sensor for end-of-travel, counting and fixture detection on machines.",
      price: 950,
      currency: "BDT",
      image: img.sensor,
      specs: ["M18", "NPN/PNP", "10–30 VDC", "IP67"],
      relatedServices: [svcBySlug["sensor-automation-fit"]._id],
      inStock: true,
      featured: true,
      published: true,
      order: 2,
    },
    {
      name: "3-Phase Induction Motor 1.5 HP",
      slug: "induction-motor-1-5hp",
      sku: "NES-MTR-15",
      brand: "Generic IE2",
      category: bySlug["servo-motors"]._id,
      shortDescription: "Foot-mounted 1.5 HP motor for pumps and conveyors.",
      description:
        "Reliable three-phase induction motor for light industrial drives. Confirm frame and shaft before ordering.",
      price: 18500,
      currency: "BDT",
      image: img.motor,
      specs: ["1.5 HP", "3-phase", "1400 RPM class", "IE2"],
      relatedServices: [svcBySlug["motor-drive-matching"]._id],
      inStock: true,
      featured: true,
      published: true,
      order: 3,
    },
    {
      name: "VFD Drive 2.2 kW",
      slug: "vfd-2-2kw",
      sku: "NES-VFD-22",
      brand: "Delta / INVT class",
      category: bySlug["vfd-inverters"]._id,
      shortDescription: "2.2 kW variable frequency drive for motor speed control.",
      description:
        "Compact VFD for soft start, speed control and energy savings on small three-phase motors.",
      price: 22000,
      currency: "BDT",
      image: img.drive,
      specs: ["2.2 kW", "380–440V", "Modbus", "Overload protection"],
      relatedServices: [svcBySlug["motor-drive-matching"]._id],
      inStock: true,
      featured: true,
      published: true,
      order: 4,
    },

    // 5 More Spare Parts (Screenshot 3rd row)
    {
      name: "Incremental Rotary Encoder 400 PPR",
      slug: "encoder-400ppr",
      sku: "NES-SNS-ENC",
      brand: "Autonics / equivalent",
      category: bySlug.sensors._id,
      shortDescription: "400 PPR encoder for speed and position feedback.",
      description:
        "Use with PLC high-speed counters or VFD pulse input for length and speed control.",
      price: 3800,
      currency: "BDT",
      image: img.sensor,
      specs: ["400 PPR", "AB / ABZ", "5–24 VDC", "6 mm shaft"],
      relatedServices: [svcBySlug["sensor-automation-fit"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 5,
    },
    {
      name: "Control Cable 1.5 mm² × 4C",
      slug: "control-cable-4c",
      sku: "NES-CBL-15-4",
      brand: "BRB / equivalent",
      category: bySlug["automation-items"]._id,
      shortDescription: "Flexible 4-core control cable for panels and field I/O.",
      description:
        "Sold per meter. Suitable for 24 VDC I/O and 220 VAC control circuits.",
      price: 95,
      currency: "BDT",
      image: img.workshop,
      specs: ["1.5 mm²", "4 core", "Flexible", "Per meter"],
      relatedServices: [svcBySlug["spare-parts-sourcing"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 6,
    },
    {
      name: "DIN Rail SMPS 24V 10A",
      slug: "smps-24v-10a",
      sku: "NES-PSU-2410",
      brand: "Mean Well class",
      category: bySlug["automation-items"]._id,
      shortDescription: "24 VDC 10A DIN-rail power supply for PLC panels.",
      description:
        "Industrial SMPS for PLC, HMI, sensors and relays. Size with 20–30% headroom.",
      price: 4200,
      currency: "BDT",
      image: img.drive,
      specs: ["24 VDC", "10A", "DIN rail", "Overload protection"],
      relatedServices: [svcBySlug["control-panel-parts"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 7,
    },
    {
      name: "Deep Groove Ball Bearing 6205",
      slug: "bearing-6205",
      sku: "NES-BRG-6205",
      brand: "SKF / equivalent",
      category: bySlug["hydraulic-items"]._id,
      shortDescription: "6205 bearing for motors, pulleys and fans.",
      description:
        "Standard 6205 deep groove ball bearing. Sealed options for dusty workshops.",
      price: 350,
      currency: "BDT",
      image: img.bearing,
      specs: ["6205", "25×52×15 mm", "2RS / ZZ"],
      relatedServices: [svcBySlug["spare-parts-sourcing"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 8,
    },
    {
      name: "AC Contactor 40A",
      slug: "contactor-40a",
      sku: "NES-CNT-40",
      brand: "Schneider / Chint class",
      category: bySlug["relay-timer-counter-etc"]._id,
      shortDescription: "40A contactor for larger motors and feeders.",
      description:
        "40A AC contactor for 5–10 HP class motors depending on utilization category.",
      price: 3200,
      currency: "BDT",
      image: img.panel,
      specs: ["40A", "3-pole", "AC-3", "Aux kit optional"],
      relatedServices: [svcBySlug["control-panel-parts"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 9,
    },

    // Additional catalog products
    {
      name: "Siemens S7-1200 CPU 1214C",
      slug: "siemens-s7-1200-cpu-1214c",
      sku: "NES-PLC-1214",
      brand: "Siemens",
      category: bySlug["plc-hmi"]._id,
      shortDescription: "Compact PLC CPU for machine and process control panels.",
      description:
        "Siemens SIMATIC S7-1200 CPU 1214C for small to mid automation. Suitable for packaging, conveyors and educational benches.",
      price: 48500,
      currency: "BDT",
      image: img.plc,
      specs: ["CPU 1214C", "14 DI / 10 DO", "2 analog in", "Profinet"],
      relatedServices: [svcBySlug["plc-programming-support"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 10,
    },
    {
      name: "Delta DVP-14SS2 PLC",
      slug: "delta-dvp-14ss2",
      sku: "NES-PLC-D14",
      brand: "Delta",
      category: bySlug["plc-hmi"]._id,
      shortDescription: "Slim PLC for compact control cabinets and OEM machines.",
      description:
        "Delta DVP Slim series PLC — popular in Bangladesh workshops for cost-effective machine control.",
      price: 12500,
      currency: "BDT",
      image: img.panel,
      specs: ["14 points", "High-speed counters", "MODBUS", "Expansion ready"],
      relatedServices: [svcBySlug["plc-programming-support"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 11,
    },
    {
      name: "Mitsubishi FX5U-32M",
      slug: "mitsubishi-fx5u-32m",
      sku: "NES-PLC-FX5",
      brand: "Mitsubishi",
      category: bySlug["plc-hmi"]._id,
      shortDescription: "iQ-F series compact PLC with built-in Ethernet.",
      description:
        "Mitsubishi FX5U for OEMs who need Ethernet, motion and a clear upgrade path from FX3.",
      price: 52000,
      currency: "BDT",
      image: img.plc,
      specs: ["32 I/O", "Ethernet", "SD card", "GX Works3"],
      relatedServices: [svcBySlug["plc-programming-support"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 12,
    },
    {
      name: "Omron CP1E-N20DR-A",
      slug: "omron-cp1e-n20",
      sku: "NES-PLC-CP1E",
      brand: "Omron",
      category: bySlug["plc-hmi"]._id,
      shortDescription: "Entry Omron PLC for simple sequential machines.",
      description:
        "CP1E is a practical choice for small machines, student projects and replacement of aging relay logic.",
      price: 9800,
      currency: "BDT",
      image: img.panel,
      specs: ["20 I/O", "Relay outputs", "USB programming", "CX-Programmer"],
      relatedServices: [svcBySlug["plc-programming-support"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 13,
    },
    {
      name: "3-Phase Induction Motor 3 HP",
      slug: "induction-motor-3hp",
      sku: "NES-MTR-30",
      brand: "Generic IE2",
      category: bySlug["servo-motors"]._id,
      shortDescription: "3 HP industrial motor for fans, mixers and machine tools.",
      description:
        "Standard 3 HP three-phase motor. Pair with a matching VFD for soft start and speed control.",
      price: 26800,
      currency: "BDT",
      image: img.motor,
      specs: ["3 HP", "3-phase", "IE2", "Foot / flange options"],
      relatedServices: [svcBySlug["motor-drive-matching"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 14,
    },
    {
      name: "VFD Drive 5.5 kW",
      slug: "vfd-5-5kw",
      sku: "NES-VFD-55",
      brand: "Delta / INVT class",
      category: bySlug["vfd-inverters"]._id,
      shortDescription: "5.5 kW VFD for pumps, fans and conveyor lines.",
      description:
        "Mid-range VFD with PID and multi-speed control. Confirm motor FLA before commissioning.",
      price: 38500,
      currency: "BDT",
      image: img.drive,
      specs: ["5.5 kW", "3-phase in/out", "PID", "Brake chopper ready"],
      relatedServices: [svcBySlug["motor-drive-matching"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 15,
    },
    {
      name: "Photoelectric Sensor Kit",
      slug: "photoelectric-sensor-kit",
      sku: "NES-SNS-PE",
      brand: "Autonics / equivalent",
      category: bySlug.sensors._id,
      shortDescription: "Through-beam and diffuse photoelectric sensors.",
      description:
        "Useful for packaging lines, counting and presence detection where metal sensors cannot see the target.",
      price: 2200,
      currency: "BDT",
      image: img.sensor,
      specs: ["Diffuse / through-beam", "12–24 VDC", "Adjustable sensitivity"],
      relatedServices: [svcBySlug["sensor-automation-fit"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 16,
    },
    {
      name: "AC Contactor 25A",
      slug: "contactor-25a",
      sku: "NES-CNT-25",
      brand: "Schneider / Chint class",
      category: bySlug["relay-timer-counter-etc"]._id,
      shortDescription: "25A 3-pole AC contactor for motor starters.",
      description:
        "Standard 25A contactor for DOL starters and control panels. Coil voltage on request.",
      price: 1800,
      currency: "BDT",
      image: img.panel,
      specs: ["25A", "3-pole", "Aux contacts", "Coil 220VAC / 24VDC"],
      relatedServices: [svcBySlug["control-panel-parts"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 17,
    },
    {
      name: "Thermal Overload Relay",
      slug: "thermal-overload-relay",
      sku: "NES-RLY-OL",
      brand: "Schneider / Chint class",
      category: bySlug["relay-timer-counter-etc"]._id,
      shortDescription: "Adjustable thermal overload for motor protection.",
      description:
        "Mounts under matching contactors. Set the FLA to protect the motor from stall and overload.",
      price: 1450,
      currency: "BDT",
      image: img.panel,
      specs: ["Adjustable FLA", "1NO+1NC", "Manual/auto reset"],
      relatedServices: [svcBySlug["control-panel-parts"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 18,
    },
    {
      name: "Timer Relay 0.1s–10h",
      slug: "timer-relay",
      sku: "NES-RLY-TMR",
      brand: "Omron / equivalent",
      category: bySlug["relay-timer-counter-etc"]._id,
      shortDescription: "Multi-mode DIN timer for sequential control.",
      description:
        "On-delay, off-delay and cyclic modes for machines that still use relay logic.",
      price: 1100,
      currency: "BDT",
      image: img.panel,
      specs: ["Multi-mode", "DIN rail", "8-pin / 11-pin"],
      relatedServices: [svcBySlug["control-panel-parts"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 19,
    },
    {
      name: "MCB 32A 3-Pole",
      slug: "mcb-32a-3p",
      sku: "NES-BRK-32",
      brand: "Schneider / Chint class",
      category: bySlug["circuit-boardscards"]._id,
      shortDescription: "32A three-pole miniature circuit breaker.",
      description:
        "C-curve MCB for motor and distribution feeders in control panels.",
      price: 890,
      currency: "BDT",
      image: img.panel,
      specs: ["32A", "3P", "C-curve", "6 kA"],
      relatedServices: [svcBySlug["control-panel-parts"]._id],
      inStock: true,
      featured: false,
      published: true,
      order: 20,
    },
  ]);

  await Service.findByIdAndUpdate(svcBySlug["plc-programming-support"]._id, {
    relatedProducts: products.filter((p) => ["siemens-s7-1200-cpu-1214c", "delta-dvp-14ss2", "mitsubishi-fx5u-32m", "hmi-7-inch"].includes(p.slug)).map((p) => p._id),
  });
  await Service.findByIdAndUpdate(svcBySlug["motor-drive-matching"]._id, {
    relatedProducts: products.filter((p) => p.slug.includes("motor") || p.slug.includes("vfd")).map((p) => p._id),
  });

  await CompanyProfile.create({
    name: "NUR SHOP BD",
    tagline: "Machine, spare parts and Technical service provider",
    about:
      "NUR SHOP BD is a Bangladesh-based machine parts and technical service desk founded by an Electrical and Electronic Engineering student. We sell PLC, motors, drives, sensors, contactors and workshop spare parts — and we help you pick the right substitute when the original part is gone.",
    mission:
      "Supply accurate industrial parts with honest specs, clear prices, and EEE-backed selection help.",
    vision:
      "Be the parts partner workshops and small factories in Bangladesh actually call first.",
    foundedYear: 2024,
    email: "info@nurengineering.com",
    phone: "+880 1700-000000",
    address: "Dhaka, Bangladesh",
    coverImage: img.workshop,
    highlights: [
      { label: "Founded", value: "2024" },
      { label: "Focus", value: "EEE machine parts & service" },
      { label: "Based in", value: "Dhaka, Bangladesh" },
      { label: "Catalog", value: "PLC to bearings" },
    ],
  });

  console.log(`Seed complete: ${products.length} products, ${services.length} services.`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
