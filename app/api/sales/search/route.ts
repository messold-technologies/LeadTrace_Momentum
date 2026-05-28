import { normalizePhone, searchByPhone } from "@/lib/salesImporter";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("phone");

  if (!raw) {
    return Response.json({ error: "Provide ?phone=<number>" }, { status: 400 });
  }

  const phone = normalizePhone(raw);
  if (!phone) {
    return Response.json({ error: "Invalid phone number format." }, { status: 400 });
  }

  const channels = await searchByPhone(phone);
  return Response.json({ phone, found: channels.length > 0, channels });
}
