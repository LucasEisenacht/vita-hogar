const ORDER_DATE_LOCALE = "es-AR";
const ORDER_DATE_TIME_ZONE = "America/Argentina/Buenos_Aires";

const orderDateFormatter = new Intl.DateTimeFormat(ORDER_DATE_LOCALE, {
  day: "2-digit",
  month: "short",
  timeZone: ORDER_DATE_TIME_ZONE,
  year: "numeric",
});

const orderDateTimeFormatter = new Intl.DateTimeFormat(ORDER_DATE_LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: ORDER_DATE_TIME_ZONE,
});

export function formatOrderDate(value: string | Date) {
  return orderDateFormatter.format(new Date(value));
}

export function formatOrderDateTime(value: string | Date) {
  return orderDateTimeFormatter.format(new Date(value));
}
