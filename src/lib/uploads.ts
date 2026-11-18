import "server-only";

import { randomBytes } from "crypto";
import { mkdir, unlink } from "fs/promises";
import path from "path";
import sharp from "sharp";

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_TOTAL_BYTES = 28 * 1024 * 1024;

export const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "storage", "uploads");

const PRODUCT_UPLOAD_ROOT = path.join(UPLOAD_ROOT, "products");

export function resolveUploadPath(relativePath: string) {
  const filePath = path.resolve(UPLOAD_ROOT, relativePath);
  if (filePath !== UPLOAD_ROOT && !filePath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) return null;
  return filePath;
}

export class UploadError extends Error {}

export async function saveProductImages(files: File[]) {
  if (files.length === 0) throw new UploadError("Choose at least one image.");
  if (files.length > MAX_PRODUCT_IMAGES) {
    throw new UploadError(`You can upload up to ${MAX_PRODUCT_IMAGES} images at a time.`);
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_PRODUCT_IMAGE_TOTAL_BYTES) {
    throw new UploadError("Those images are too large together. Please upload fewer or smaller files.");
  }

  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const directory = path.join(PRODUCT_UPLOAD_ROOT, folder);
  const savedPaths: string[] = [];
  const urls: string[] = [];

  try {
    await mkdir(directory, { recursive: true });

    for (const file of files) {
      if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
        throw new UploadError(`${file.name} is larger than 8MB.`);
      }
      if (file.type && !file.type.startsWith("image/")) {
        throw new UploadError(`${file.name} is not an image.`);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      let metadata;
      try {
        metadata = await sharp(buffer, { failOn: "error" }).metadata();
      } catch {
        throw new UploadError(`${file.name} could not be read as an image. Try JPG, PNG, WebP, AVIF or GIF.`);
      }
      if (!metadata.width || !metadata.height) {
        throw new UploadError(`${file.name} could not be read as an image.`);
      }

      const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.webp`;
      const filePath = path.join(directory, filename);
      await sharp(buffer, { failOn: "error" })
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 84, effort: 4 })
        .toFile(filePath);

      savedPaths.push(filePath);
      urls.push(`/uploads/products/${folder}/${filename}`);
    }
  } catch (error) {
    await Promise.all(savedPaths.map((filePath) => unlink(filePath).catch(() => undefined)));
    throw error;
  }

  return urls;
}
