import "server-only";
import { cache } from "react";
import { prisma } from "./db";

export type StoreSettings = {
  storeName: string;
  tagline: string;
  currency: string;
  shippingFlat: number;
  abujaShippingFee: number;
  freeShippingThreshold: number;
  taxRate: number;
  supportEmail: string;
  supportPhone: string;
  address: string;
  address2: string;
  instagram: string;
  tiktok: string;
  x: string;
  facebook: string;
  lowStockThreshold: number;
  abandonedCartHours: number;
  abandonedCartMaxReminders: number;
};

export const defaultSettings: StoreSettings = {
  storeName: "M&R Homes",
  tagline: "Curated plants, planters and objects for considered living.",
  currency: "NGN",
  shippingFlat: 700000,
  abujaShippingFee: 300000,
  freeShippingThreshold: 25000000,
  taxRate: 0,
  supportEmail: "contact@mandrhomes.com",
  supportPhone: "+234 803 000 0000",
  address: "Shop A206, Stick and Stones (Carter) Plaza, Ademola Adetokubo Crescent, Wuse 2, Abuja",
  address2: "Shop 3, No 7 Bompai Road, Opposite Pilgrim Board by FCMB, Nassarawa, Kano State",
  instagram: "",
  tiktok: "",
  x: "",
  facebook: "",
  lowStockThreshold: 10,
  abandonedCartHours: 6,
  abandonedCartMaxReminders: 3,
};

function coerceString(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function coerceNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

export const getSettings = cache(async (): Promise<StoreSettings> => {
  try {
    const rows = await prisma.setting.findMany();
    const map = new Map(rows.map((row) => [row.key, row.value]));
    return {
      storeName: coerceString(map.get("storeName"), defaultSettings.storeName),
      tagline: coerceString(map.get("tagline"), defaultSettings.tagline),
      currency: coerceString(map.get("currency"), defaultSettings.currency),
      shippingFlat: coerceNumber(map.get("shippingFlat"), defaultSettings.shippingFlat),
      abujaShippingFee: coerceNumber(map.get("abujaShippingFee"), defaultSettings.abujaShippingFee),
      freeShippingThreshold: coerceNumber(map.get("freeShippingThreshold"), defaultSettings.freeShippingThreshold),
      taxRate: coerceNumber(map.get("taxRate"), defaultSettings.taxRate),
      supportEmail: coerceString(map.get("supportEmail"), defaultSettings.supportEmail),
      supportPhone: coerceString(map.get("supportPhone"), defaultSettings.supportPhone),
      address: coerceString(map.get("address"), defaultSettings.address),
      address2: coerceString(map.get("address2"), defaultSettings.address2),
      instagram: coerceString(map.get("instagram"), defaultSettings.instagram),
      tiktok: coerceString(map.get("tiktok"), defaultSettings.tiktok),
      x: coerceString(map.get("x"), defaultSettings.x),
      facebook: coerceString(map.get("facebook"), defaultSettings.facebook),
      lowStockThreshold: coerceNumber(map.get("lowStockThreshold"), defaultSettings.lowStockThreshold),
      abandonedCartHours: coerceNumber(map.get("abandonedCartHours"), defaultSettings.abandonedCartHours),
      abandonedCartMaxReminders: coerceNumber(map.get("abandonedCartMaxReminders"), defaultSettings.abandonedCartMaxReminders),
    };
  } catch {
    return defaultSettings;
  }
});
