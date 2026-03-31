import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/admin";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const res = await requireAdmin(req as any);
  if (!res.ok) {
    return Response.json({ error: "Forbidden" }, { status: res.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const randomString = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${randomString}.${ext}`;

    // Save file
    const bytes_array = new Uint8Array(await file.arrayBuffer());
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, bytes_array);

    // Return the public URL
    const url = `/uploads/${filename}`;

    return Response.json({ url, filename }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
