// ============================================================================
// QR Dine — Database Seed Script
// Generates a demo restaurant with tables, categories, menu items,
// and an owner + kitchen staff account for testing.
// ============================================================================
// Usage: npx prisma db seed
// Configured in package.json: "prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
// ============================================================================

import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Create Owner ──────────────────────────────────────────────────────
  const ownerPassword = await hash("owner123", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@qrdine.demo" },
    update: {},
    create: {
      email: "owner@qrdine.demo",
      passwordHash: ownerPassword,
      name: "Raj Sharma",
      role: UserRole.OWNER,
    },
  });
  console.log(`✅ Owner: ${owner.email} (password: owner123)`);

  // ── 2. Create Restaurant ─────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "spice-garden" },
    update: {},
    create: {
      name: "Spice Garden",
      slug: "spice-garden",
      address: "42 MG Road, Bengaluru, Karnataka 560001",
      gstNumber: "29ABCDE1234F1Z5",
      taxRate: 5.0,
      currency: "INR",
      ownerId: owner.id,
    },
  });
  console.log(`✅ Restaurant: ${restaurant.name} (slug: ${restaurant.slug})`);

  // ── 3. Create Kitchen Staff ──────────────────────────────────────────────
  const staffPassword = await hash("kitchen123", 12);
  const kitchenStaff = await prisma.user.upsert({
    where: { email: "kitchen@qrdine.demo" },
    update: {},
    create: {
      email: "kitchen@qrdine.demo",
      passwordHash: staffPassword,
      name: "Anita Kitchen",
      role: UserRole.KITCHEN_STAFF,
      restaurantId: restaurant.id,
    },
  });
  console.log(`✅ Kitchen Staff: ${kitchenStaff.email} (password: kitchen123)`);

  // ── 4. Create Tables ─────────────────────────────────────────────────────
  const tableData = [
    { name: "Table 1", number: 1 },
    { name: "Table 2", number: 2 },
    { name: "Table 3", number: 3 },
    { name: "Table 4", number: 4 },
    { name: "Table 5", number: 5 },
    { name: "Table 6", number: 6 },
    { name: "Patio A", number: 7 },
    { name: "Patio B", number: 8 },
  ];

  for (const t of tableData) {
    await prisma.table.upsert({
      where: {
        uq_restaurant_table_number: {
          restaurantId: restaurant.id,
          number: t.number,
        },
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        name: t.name,
        number: t.number,
        // QR codes will be generated at runtime using NEXT_PUBLIC_APP_URL
      },
    });
  }
  console.log(`✅ Tables: ${tableData.length} tables created`);

  // ── 5. Create Categories ─────────────────────────────────────────────────
  const categories = await Promise.all(
    [
      { name: "Starters", sortOrder: 1 },
      { name: "Main Course", sortOrder: 2 },
      { name: "Breads", sortOrder: 3 },
      { name: "Rice & Biryani", sortOrder: 4 },
      { name: "Beverages", sortOrder: 5 },
      { name: "Desserts", sortOrder: 6 },
    ].map((cat) =>
      prisma.category.create({
        data: {
          restaurantId: restaurant.id,
          name: cat.name,
          sortOrder: cat.sortOrder,
        },
      })
    )
  );

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  console.log(`✅ Categories: ${categories.length} categories created`);

  // ── 6. Create Menu Items ─────────────────────────────────────────────────
  const menuItems = [
    // Starters
    { categoryId: catMap["Starters"], name: "Paneer Tikka", description: "Marinated cottage cheese grilled in tandoor with bell peppers and onions", price: 249, sortOrder: 1 },
    { categoryId: catMap["Starters"], name: "Chicken 65", description: "Spicy deep-fried chicken marinated with red chillies and curry leaves", price: 279, sortOrder: 2 },
    { categoryId: catMap["Starters"], name: "Veg Spring Rolls", description: "Crispy rolls stuffed with mixed vegetables and glass noodles", price: 199, sortOrder: 3 },
    { categoryId: catMap["Starters"], name: "Fish Amritsari", description: "Batter-fried fish fillets with ajwain and chaat masala", price: 329, sortOrder: 4 },
    { categoryId: catMap["Starters"], name: "Masala Papad", description: "Crispy papad topped with onion, tomato, and green chutney", price: 99, sortOrder: 5 },

    // Main Course
    { categoryId: catMap["Main Course"], name: "Butter Chicken", description: "Tender chicken in rich tomato-butter gravy with kasuri methi", price: 349, sortOrder: 1 },
    { categoryId: catMap["Main Course"], name: "Dal Makhani", description: "Slow-cooked black lentils in creamy buttery gravy", price: 249, sortOrder: 2 },
    { categoryId: catMap["Main Course"], name: "Paneer Butter Masala", description: "Cottage cheese cubes in silky tomato-cashew gravy", price: 279, sortOrder: 3 },
    { categoryId: catMap["Main Course"], name: "Mutton Rogan Josh", description: "Kashmiri-style slow-cooked lamb in aromatic spice gravy", price: 429, sortOrder: 4 },
    { categoryId: catMap["Main Course"], name: "Palak Paneer", description: "Fresh spinach purée with cottage cheese cubes", price: 249, sortOrder: 5 },
    { categoryId: catMap["Main Course"], name: "Chicken Kadai", description: "Chicken cooked with capsicum, tomato, and kadai masala", price: 329, sortOrder: 6 },

    // Breads
    { categoryId: catMap["Breads"], name: "Butter Naan", description: "Soft leavened bread brushed with butter", price: 59, sortOrder: 1 },
    { categoryId: catMap["Breads"], name: "Garlic Naan", description: "Naan topped with garlic and coriander", price: 69, sortOrder: 2 },
    { categoryId: catMap["Breads"], name: "Tandoori Roti", description: "Whole wheat bread baked in tandoor", price: 39, sortOrder: 3 },
    { categoryId: catMap["Breads"], name: "Laccha Paratha", description: "Flaky layered whole wheat paratha", price: 59, sortOrder: 4 },

    // Rice & Biryani
    { categoryId: catMap["Rice & Biryani"], name: "Hyderabadi Chicken Biryani", description: "Fragrant basmati rice layered with spiced chicken and saffron", price: 349, sortOrder: 1 },
    { categoryId: catMap["Rice & Biryani"], name: "Veg Biryani", description: "Aromatic basmati rice with mixed vegetables and whole spices", price: 249, sortOrder: 2 },
    { categoryId: catMap["Rice & Biryani"], name: "Jeera Rice", description: "Basmati rice tempered with cumin seeds and ghee", price: 149, sortOrder: 3 },
    { categoryId: catMap["Rice & Biryani"], name: "Steamed Rice", description: "Plain steamed basmati rice", price: 119, sortOrder: 4 },

    // Beverages
    { categoryId: catMap["Beverages"], name: "Masala Chai", description: "Traditional Indian spiced tea with ginger and cardamom", price: 49, sortOrder: 1 },
    { categoryId: catMap["Beverages"], name: "Mango Lassi", description: "Creamy yogurt-based mango smoothie", price: 129, sortOrder: 2 },
    { categoryId: catMap["Beverages"], name: "Fresh Lime Soda", description: "Refreshing lime juice with soda, sweet or salty", price: 79, sortOrder: 3 },
    { categoryId: catMap["Beverages"], name: "Cold Coffee", description: "Chilled coffee blended with ice cream and milk", price: 149, sortOrder: 4 },
    { categoryId: catMap["Beverages"], name: "Buttermilk", description: "Spiced churned yogurt drink with cumin and mint", price: 69, sortOrder: 5 },

    // Desserts
    { categoryId: catMap["Desserts"], name: "Gulab Jamun", description: "Soft milk-solid dumplings soaked in rose-flavored sugar syrup (2 pcs)", price: 129, sortOrder: 1 },
    { categoryId: catMap["Desserts"], name: "Rasmalai", description: "Flattened cottage cheese dumplings in saffron-cardamom milk (2 pcs)", price: 149, sortOrder: 2 },
    { categoryId: catMap["Desserts"], name: "Kulfi", description: "Traditional Indian frozen dessert with pistachios and saffron", price: 119, sortOrder: 3 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        isAvailable: true,
        sortOrder: item.sortOrder,
      },
    });
  }
  console.log(`✅ Menu Items: ${menuItems.length} items created`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n────────────────────────────────────────────");
  console.log("🎉 Seed complete!\n");
  console.log("Demo accounts:");
  console.log("  Owner:   owner@qrdine.demo / owner123");
  console.log("  Kitchen: kitchen@qrdine.demo / kitchen123");
  console.log(`\nRestaurant slug: ${restaurant.slug}`);
  console.log(`Customer QR URL: $\{NEXT_PUBLIC_APP_URL}/r/${restaurant.slug}/t/{tableId}`);
  console.log("────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
