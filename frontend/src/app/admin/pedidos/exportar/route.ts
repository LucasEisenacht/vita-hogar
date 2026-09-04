import { NextResponse } from "next/server";
import { getOrdersCsv } from "@/lib/admin/orders/export";
import { isOrderStatus } from "@/lib/orders/status";
import type { PaymentStatus } from "@/types/database";

const buenosAiresUtcOffsetHours = 3;

function isPaymentStatus(value: string | null): value is PaymentStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "refunded" ||
    value === "cancelled"
  );
}

function parseDateInput(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, buenosAiresUtcOffsetHours));
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function getExportFileName() {
  const timestamp = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
  })
    .format(new Date())
    .replace(", ", "-")
    .replace(":", "");

  return `wtodocell-pedidos-${timestamp}.csv`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const statusValue = url.searchParams.get("estado");
  const paymentStatusValue = url.searchParams.get("pago");
  const from = parseDateInput(url.searchParams.get("desde"));
  const to = parseDateInput(url.searchParams.get("hasta"));
  const csv = await getOrdersCsv({
    dateFrom: from?.toISOString(),
    dateTo: to ? addUtcDays(to, 1).toISOString() : undefined,
    paymentStatus: isPaymentStatus(paymentStatusValue)
      ? paymentStatusValue
      : undefined,
    search: url.searchParams.get("q") ?? undefined,
    status: statusValue && isOrderStatus(statusValue) ? statusValue : undefined,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${getExportFileName()}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
