export const PERSON_PRESETS = [
  { name: "Aarav Sharma", icon: "profile-pic/man-technologist-3d-default.png" },
  { name: "Diya Patel", icon: "profile-pic/artist-3d-default.png" },
  { name: "Kabir Mehta", icon: "profile-pic/cook-3d-default.png" },
  { name: "Ananya Rao", icon: "profile-pic/astronaut-3d-default.png" },
  { name: "Rohan Shah", icon: "profile-pic/person-curly-hair-3d-default.png" },
  { name: "Ishita Nair", icon: "profile-pic/woman-teacher-3d-default.png" },
  { name: "Arjun Verma", icon: "profile-pic/man-superhero-3d-default.png" },
  { name: "Meera Iyer", icon: "profile-pic/woman-with-headscarf-3d-default.png" },
  { name: "Vivaan Kapoor", icon: "profile-pic/farmer-3d-default.png" },
  { name: "Sana Khan", icon: "profile-pic/woman-curly-hair-3d-default.png" },
  { name: "Aditya Joshi", icon: "profile-pic/astronaut-3d-default.png" },
  { name: "Tara Desai", icon: "profile-pic/woman-cook-3d-default.png" },
  { name: "Dev Malhotra", icon: "profile-pic/man-bald-3d-default.png" },
  { name: "Nisha Reddy", icon: "profile-pic/princess-3d-default.png" },
  { name: "Kunal Singh", icon: "profile-pic/man-student-3d-default.png" },
  { name: "Priya Menon", icon: "profile-pic/woman-construction-worker-3d-default.png" },
  { name: "Siddharth Bose", icon: "profile-pic/man-health-worker-3d-default.png" },
  { name: "Riya Gupta", icon: "profile-pic/woman-zombie-3d.png" },
  { name: "Neel Kulkarni", icon: "profile-pic/ninja-3d-default.png" },
  { name: "Zoya Ali", icon: "profile-pic/firefighter-3d-default.png" },
] as const;

export const GROUP_PRESETS = [
  { name: "Goa Weekend", icon: "travel-and-places/beach-with-umbrella-3d.png", currency: "INR" },
  { name: "Flat 402", icon: "travel-and-places/house-with-garden-3d.png", currency: "INR" },
  { name: "Office Lunch Club", icon: "food-and-drinks/curry-rice-3d.png", currency: "INR" },
  { name: "Coorg Road Trip", icon: "travel-and-places/automobile-3d.png", currency: "INR" },
  { name: "Friday Movie Night", icon: "objects/clapper-board-3d.png", currency: "INR" },
  { name: "Birthday Getaway", icon: "food-and-drinks/birthday-cake-3d.png", currency: "INR" },
  { name: "Sunday Football", icon: "activities/soccer-ball-3d.png", currency: "INR" },
  { name: "Family Vacation", icon: "travel-and-places/luggage-3d.png", currency: "INR" },
  { name: "College Reunion", icon: "objects/graduation-cap-3d.png", currency: "INR" },
  { name: "Mountain Camp", icon: "travel-and-places/camping-3d.png", currency: "INR" },
  { name: "Jaipur Diaries", icon: "travel-and-places/cityscape-3d.png", currency: "INR" },
  { name: "Wedding Crew", icon: "activities/ribbon-3d.png", currency: "INR" },
  { name: "Weekend Cyclists", icon: "travel-and-places/bicycle-3d.png", currency: "INR" },
  { name: "Board Game Club", icon: "activities/joystick-3d.png", currency: "INR" },
  {
    name: "Kitchen Essentials",
    icon: "food-and-drinks/shallow-pan-of-food-3d.png",
    currency: "INR",
  },
  { name: "Pondicherry Escape", icon: "travel-and-places/water-wave-3d.png", currency: "INR" },
  { name: "Music Festival", icon: "objects/musical-notes-3d.png", currency: "INR" },
  { name: "Book Club", icon: "objects/books-3d.png", currency: "INR" },
  { name: "New Apartment", icon: "travel-and-places/house-with-garden-3d.png", currency: "INR" },
  { name: "Badminton Buddies", icon: "activities/badminton-3d.png", currency: "INR" },
] as const;

export const CATEGORY_PRESETS = [
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
  { name: "Coffee", icon: "food-and-drinks/hot-beverage-3d.png" },
  { name: "Fuel", icon: "travel-and-places/automobile-3d.png" },
  { name: "Parking", icon: "travel-and-places/motorway-3d.png" },
  { name: "Household", icon: "objects/broom-3d.png" },
  { name: "Gifts", icon: "activities/balloon-3d.png" },
  { name: "Pets", icon: "objects/shopping-bags-3d.png" },
  { name: "Subscriptions", icon: "objects/desktop-computer-3d.png" },
  { name: "Laundry", icon: "objects/coat-3d.png" },
  { name: "Activities", icon: "activities/artist-palette-3d.png" },
] as const;

export const TAG_PRESETS = [
  { name: "Weekend", color: "#6366f1" },
  { name: "Reimbursable", color: "#10b981" },
  { name: "Recurring", color: "#f59e0b" },
  { name: "Shared", color: "#3b82f6" },
  { name: "Work", color: "#64748b" },
  { name: "Holiday", color: "#06b6d4" },
  { name: "Birthday", color: "#ec4899" },
  { name: "Essentials", color: "#22c55e" },
  { name: "One-off", color: "#8b5cf6" },
  { name: "Online", color: "#0ea5e9" },
  { name: "Cash", color: "#84cc16" },
  { name: "Card", color: "#a855f7" },
  { name: "UPI", color: "#14b8a6" },
  { name: "Prepaid", color: "#f97316" },
  { name: "Last Minute", color: "#ef4444" },
  { name: "Group Outing", color: "#d946ef" },
  { name: "Family", color: "#f43f5e" },
  { name: "Office", color: "#0284c7" },
  { name: "Home", color: "#65a30d" },
  { name: "Road Trip", color: "#d97706" },
] as const;

// Amounts are whole major units, valid even in currencies without fractional units.
export const EXPENSE_PRESETS = [
  { name: "Dinner at the neighbourhood cafe", amount: "1260", categoryName: "Food & Drinks" },
  { name: "Cab home from the station", amount: "380", categoryName: "Transport" },
  { name: "Weekend homestay booking", amount: "4800", categoryName: "Accommodation" },
  { name: "Friday cinema tickets", amount: "960", categoryName: "Entertainment" },
  { name: "Supplies for the weekend trip", amount: "750", categoryName: "Shopping" },
  { name: "Monthly electricity bill", amount: "1850", categoryName: "Utilities" },
  { name: "First aid kit for the trip", amount: "320", categoryName: "Health" },
  { name: "Weekly vegetable market run", amount: "680", categoryName: "Groceries" },
  { name: "Train tickets to Jaipur", amount: "2400", categoryName: "Travel" },
  { name: "Shared language workbook", amount: "450", categoryName: "Education" },
  { name: "Badminton court booking", amount: "600", categoryName: "Sports" },
  { name: "Coffee before the road trip", amount: "420", categoryName: "Coffee" },
  { name: "Petrol for the weekend drive", amount: "2200", categoryName: "Fuel" },
  { name: "Parking near the beach", amount: "100", categoryName: "Parking" },
  { name: "Cleaning supplies for the flat", amount: "540", categoryName: "Household" },
  { name: "Birthday gift for a friend", amount: "1500", categoryName: "Gifts" },
  { name: "Pet food for the month", amount: "890", categoryName: "Pets" },
  { name: "Monthly streaming plan", amount: "299", categoryName: "Subscriptions" },
  { name: "Laundry after the camping trip", amount: "360", categoryName: "Laundry" },
  { name: "Pottery workshop tickets", amount: "1800", categoryName: "Activities" },
] as const;

const DEV_PRESETS = {
  person: PERSON_PRESETS,
  member: PERSON_PRESETS,
  group: GROUP_PRESETS,
  category: CATEGORY_PRESETS,
  tag: TAG_PRESETS,
  expense: EXPENSE_PRESETS,
};

export type DevDataType = keyof typeof DEV_PRESETS;
type DevDataMap = {
  [K in DevDataType]: Omit<(typeof DEV_PRESETS)[K][number], "name"> & { name: string };
};
const DEV_DATA: { [K in DevDataType]: readonly DevDataMap[K][] } = DEV_PRESETS;

export const pickRandom = <T>(items: readonly T[]): T => {
  if (!items.length) throw new Error("No development data is available to choose from");
  return items[Math.floor(Math.random() * items.length)];
};

export const getAvailableDevName = (name: string, existingNames: readonly string[] = []) => {
  const used = new Set(existingNames.map((item) => item.trim().toLowerCase()));
  let candidate = name;
  let suffix = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${name} ${suffix}`;
    suffix += 1;
  }
  return candidate;
};

// Templates carry display fields only. Creation actions supply IDs and group relationships.
export const getRandomDevData = <T extends DevDataType>(
  type: T,
  existingNames: readonly string[] = [],
): DevDataMap[T] => {
  const pool: readonly DevDataMap[T][] = DEV_DATA[type];
  const used = new Set(existingNames.map((name) => name.trim().toLowerCase()));
  const unused = pool.filter((item) => !used.has(item.name.toLowerCase()));
  const item = pickRandom(unused.length ? unused : pool);
  return { ...item, name: getAvailableDevName(item.name, existingNames) };
};
