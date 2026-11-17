"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import {
  addressSchema,
  changePasswordSchema,
  fieldErrors,
  profileSchema,
} from "@/lib/validation";
import type { ActionState } from "@/lib/types";

export async function updateProfileAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Please sign in." };

  const parsed = profileSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { ok: false, message: "Please check the form.", errors: fieldErrors(parsed.error) };

  await prisma.user.update({
    where: { id: session.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });

  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Please sign in." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { ok: false, message: "Please check the form.", errors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { passwordHash: true } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { ok: false, message: "Your current password is incorrect.", errors: { currentPassword: "Incorrect password" } };
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { ok: true, message: "Password changed successfully." };
}

export async function saveAddressAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Please sign in." };

  const parsed = addressSchema.safeParse({
    id: formData.get("id") || undefined,
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode") ?? "",
    country: formData.get("country") ?? "Nigeria",
    isDefault: formData.get("isDefault") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: "Please check the address.", errors: fieldErrors(parsed.error) };

  const { id, isDefault, ...data } = parsed.data;
  const existingCount = await prisma.address.count({ where: { userId: session.id } });
  const makeDefault = isDefault === "on" || existingCount === 0;

  await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId: session.id }, data: { isDefault: false } });
    }
    if (id) {
      const updated = await tx.address.updateMany({
        where: { id, userId: session.id },
        data: { ...data, line2: data.line2 || null, postalCode: data.postalCode || null, isDefault: makeDefault },
      });
      if (updated.count === 0) throw new Error("Address not found");
    } else {
      await tx.address.create({
        data: {
          ...data,
          line2: data.line2 || null,
          postalCode: data.postalCode || null,
          userId: session.id,
          isDefault: makeDefault,
        },
      });
    }
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, message: id ? "Address updated." : "Address added." };
}

export async function deleteAddressAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.address.deleteMany({ where: { id, userId: session.id } });
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function setDefaultAddressAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const address = await prisma.address.findFirst({ where: { id, userId: session.id } });
  if (!address) return;
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: session.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}
