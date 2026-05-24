import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password || password.length < 8) {
      return NextResponse.json({ error: "Name, valid email, and 8+ character password are required." }, { status: 400 });
    }
    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash });
    await createSession(String(user._id), user.email, user.name);
    return NextResponse.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during signup." }, { status: 500 });
  }
}
