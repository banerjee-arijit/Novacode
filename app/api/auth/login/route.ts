import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  await createSession(String(user._id), user.email);
  return NextResponse.json({ user: { id: user._id, name: user.name, email: user.email } });
}
