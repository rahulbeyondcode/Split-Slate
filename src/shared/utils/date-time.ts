const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatDisplayDate = (timestamp: number | Date): string => {
  const date = new Date(timestamp);
  return `${String(date.getDate()).padStart(2, "0")}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
};

export const formatDisplayTime = (timestamp: number | Date): string => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  return `${String(hour % 12 || 12).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
};

export const formatDisplayDateTime = (timestamp: number | Date): string =>
  `${formatDisplayDate(timestamp)} · ${formatDisplayTime(timestamp)}`;
