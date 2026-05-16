import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import { FileModel } from "@/models/File";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ files: [] });
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  await connectDB();
  const files = await FileModel.find({ projectId }).sort({ name: 1 });
  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  await connectDB();
  const file = await FileModel.create(body);
  return NextResponse.json({ file }, { status: 201 });
}
