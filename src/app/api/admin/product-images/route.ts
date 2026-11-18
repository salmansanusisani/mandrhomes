import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { saveProductImages, UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  try {
    const urls = await saveProductImages(files);
    return NextResponse.json({ urls });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[uploads] product image upload failed", error);
    return NextResponse.json({ error: "Could not upload the images. Please try again." }, { status: 500 });
  }
}
