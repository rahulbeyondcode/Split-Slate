// Seed values for the `settings` "categories" row — used only on first-launch
// seeding. At runtime the master/default lists are read from the DB (editable).

export const SEED_MASTER_CATEGORIES = [
  { name: "Food & Drinks", icon: "🍔" },
  { name: "Transport", icon: "🚗" },
  { name: "Accommodation", icon: "🏠" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Shopping", icon: "🛒" },
  { name: "Utilities", icon: "💡" },
  { name: "Health", icon: "🏥" },
  { name: "Groceries", icon: "🥦" },
  { name: "Travel", icon: "✈️" },
  { name: "Education", icon: "🎓" },
  { name: "Sports", icon: "⚽" },
  { name: "Others", icon: "📦" },
];

export const SEED_DEFAULT_GROUP_CATEGORIES = [
  "Food & Drinks",
  "Transport",
  "Groceries",
  "Entertainment",
];
