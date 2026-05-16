import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import { FileModel } from "@/models/File";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const file = await FileModel.findByIdAndUpdate(id, await request.json(), { new: true });
  return NextResponse.json({ file });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  await connectDB();
  await FileModel.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
