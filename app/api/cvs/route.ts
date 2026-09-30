import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const MAX_CVS = 2;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("user_cvs")
    .select("id, file_name, file_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ cvs: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: existingCVs, error: countError } = await supabase
    .from("user_cvs")
    .select("id")
    .eq("user_id", user.id);

  if (countError) {
    return NextResponse.json(
      { error: countError.message },
      { status: 500 }
    );
  }

  if ((existingCVs?.length ?? 0) >= MAX_CVS) {
    return NextResponse.json(
      { error: "You can have a maximum of 2 CVs." },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "The CV must be smaller than 5 MB." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, DOC and DOCX files are allowed." },
      { status: 400 }
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !["pdf", "doc", "docx"].includes(extension)) {
    return NextResponse.json(
      { error: "Invalid file extension." },
      { status: 400 }
    );
  }

  const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const { data: cv, error: insertError } = await supabase
    .from("user_cvs")
    .insert({
      user_id: user.id,
      file_name: file.name,
      file_path: filePath,
      file_type: extension,
    })
    .select("id, file_name, file_type, created_at")
    .single();

  if (insertError) {
    await supabase.storage
      .from("cvs")
      .remove([filePath]);

    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      cv,
    },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "CV id is required." },
      { status: 400 }
    );
  }

  const { data: cv, error: findError } = await supabase
    .from("user_cvs")
    .select("id, file_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (findError || !cv) {
    return NextResponse.json(
      { error: "CV not found." },
      { status: 404 }
    );
  }

  const { error: storageError } = await supabase.storage
    .from("cvs")
    .remove([cv.file_path]);

  if (storageError) {
    return NextResponse.json(
      { error: storageError.message },
      { status: 500 }
    );
  }

  const { error: deleteError } = await supabase
    .from("user_cvs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}