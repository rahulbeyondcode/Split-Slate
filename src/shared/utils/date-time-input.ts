export interface DateTimeParts {
  date: string;
  hour: string;
  minute: string;
  period: "AM" | "PM";
}

export const parseLocalDateTime = (value: string): DateTimeParts => {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { date: "", hour: "", minute: "", period: "AM" };

  const hour = Number(match[2]);
  return {
    date: match[1],
    hour: String(hour % 12 || 12).padStart(2, "0"),
    minute: match[3],
    period: hour < 12 ? "AM" : "PM",
  };
};

export const composeLocalDateTime = ({ date, hour, minute, period }: DateTimeParts): string => {
  if (!date) return "";
  const hours = Number(hour);
  const minutes = Number(minute);
  if (
    !/^\d{1,2}$/.test(hour) ||
    !/^\d{1,2}$/.test(minute) ||
    hours < 1 ||
    hours > 12 ||
    minutes > 59
  )
    return "invalid";

  const hour24 = (hours % 12) + (period === "PM" ? 12 : 0);
  return `${date}T${String(hour24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
