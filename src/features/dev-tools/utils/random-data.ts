export const PERSON_PRESETS = [
  { name: "Aarav Sharma", icon: "🧑‍💻" },
  { name: "Diya Patel", icon: "👩‍🎨" },
  { name: "Kabir Mehta", icon: "🧑‍🍳" },
  { name: "Ananya Rao", icon: "👩‍🚀" },
  { name: "Rohan Shah", icon: "🧑‍🔬" },
  { name: "Ishita Nair", icon: "👩‍🏫" },
  { name: "Arjun Verma", icon: "🧑‍🎤" },
  { name: "Meera Iyer", icon: "👩‍⚕️" },
  { name: "Vivaan Kapoor", icon: "🧑‍🌾" },
  { name: "Sana Khan", icon: "👩‍💻" },
  { name: "Aditya Joshi", icon: "🧑‍🚀" },
  { name: "Tara Desai", icon: "👩‍🍳" },
  { name: "Dev Malhotra", icon: "🧑‍🎨" },
  { name: "Nisha Reddy", icon: "👩‍🔬" },
  { name: "Kunal Singh", icon: "🧑‍🏫" },
  { name: "Priya Menon", icon: "👩‍🌾" },
  { name: "Siddharth Bose", icon: "🧑‍⚕️" },
  { name: "Riya Gupta", icon: "👩‍🎤" },
  { name: "Neel Kulkarni", icon: "🧑‍🔧" },
  { name: "Zoya Ali", icon: "👩‍🚒" },
] as const;

export const GROUP_PRESETS = [
  { name: "Goa Weekend", icon: "🏖️", currency: "INR" },
  { name: "Flat 402", icon: "🏠", currency: "INR" },
  { name: "Office Lunch Club", icon: "🍱", currency: "INR" },
  { name: "Coorg Road Trip", icon: "🚗", currency: "INR" },
  { name: "Friday Movie Night", icon: "🎬", currency: "INR" },
  { name: "Birthday Getaway", icon: "🎂", currency: "INR" },
  { name: "Sunday Football", icon: "⚽", currency: "INR" },
  { name: "Family Vacation", icon: "🧳", currency: "INR" },
  { name: "College Reunion", icon: "🎓", currency: "INR" },
  { name: "Mountain Camp", icon: "⛺", currency: "INR" },
  { name: "Jaipur Diaries", icon: "🏰", currency: "INR" },
  { name: "Wedding Crew", icon: "💐", currency: "INR" },
  { name: "Weekend Cyclists", icon: "🚲", currency: "INR" },
  { name: "Board Game Club", icon: "🎲", currency: "INR" },
  { name: "Kitchen Essentials", icon: "🥘", currency: "INR" },
  { name: "Pondicherry Escape", icon: "🌊", currency: "INR" },
  { name: "Music Festival", icon: "🎵", currency: "INR" },
  { name: "Book Club", icon: "📚", currency: "INR" },
  { name: "New Apartment", icon: "🪴", currency: "INR" },
  { name: "Badminton Buddies", icon: "🏸", currency: "INR" },
] as const;

export const CATEGORY_PRESETS = [
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
  { name: "Coffee", icon: "☕" },
  { name: "Fuel", icon: "⛽" },
  { name: "Parking", icon: "🅿️" },
  { name: "Household", icon: "🧹" },
  { name: "Gifts", icon: "🎁" },
  { name: "Pets", icon: "🐾" },
  { name: "Subscriptions", icon: "📺" },
  { name: "Laundry", icon: "🧺" },
  { name: "Activities", icon: "🎨" },
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
