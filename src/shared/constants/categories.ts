// Seed values for the `settings` "categories" row — used only on first-launch
// seeding. At runtime the master/default lists are read from the DB (editable).

export const SEED_MASTER_CATEGORIES = [
  { name: "Food & Drinks", icon: "food-and-drinks/hamburger-3d.png" },
  { name: "Transport", icon: "travel-and-places/automobile-3d.png" },
  { name: "Accommodation", icon: "travel-and-places/house-with-garden-3d.png" },
  { name: "Entertainment", icon: "objects/clapper-board-3d.png" },
  { name: "Shopping", icon: "objects/shopping-cart-3d.png" },
  { name: "Utilities", icon: "objects/light-bulb-3d.png" },
  { name: "Health", icon: "travel-and-places/hospital-3d.png" },
  { name: "Groceries", icon: "food-and-drinks/broccoli-3d.png" },
  { name: "Travel", icon: "travel-and-places/airplane-3d.png" },
  { name: "Education", icon: "objects/graduation-cap-3d.png" },
  { name: "Sports", icon: "activities/soccer-ball-3d.png" },
  { name: "Others", icon: "objects/package-3d.png" },
];

export const SEED_DEFAULT_GROUP_CATEGORIES = [
  "Food & Drinks",
  "Transport",
  "Groceries",
  "Entertainment",
];
