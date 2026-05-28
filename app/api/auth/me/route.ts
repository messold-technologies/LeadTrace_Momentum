import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return Response.json({ user: null }, { status: 401 });
  }

  let payload: { sub: string; email: string };
  try {
    payload = verifyAuthToken(token);
  } catch {
    return Response.json({ user: null }, { status: 401 });
  }

  await connectDb();
  const user = await User.findById(payload.sub).exec();

  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({
    user: {
      id: user._id.toString(),
      email: user.email as string,
    },
  });
}

