export type EventRecord = {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  slug: string;
  is_public: boolean;
  created_at: string;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatEventDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const monthName = MONTHS[month - 1];

  if (!year || !monthName || !day) {
    return value;
  }

  return `${monthName} ${day}, ${year}`;
}

export function formatPhotoTime(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hourText, minute] = (timePart ?? "").split(":");
  const monthName = MONTHS[month - 1];
  const hour = Number(hourText);

  if (!year || !monthName || !day || !minute || Number.isNaN(hour)) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${monthName} ${day}, ${year} · ${hour12}:${minute.slice(0, 2)} ${suffix} UTC`;
}
