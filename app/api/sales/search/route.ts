import { normalizePhone, normalizeNmi, searchByPhone, searchByNmi } from "@/lib/salesImporter";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPhone = searchParams.get("phone");
  const rawNmi   = searchParams.get("nmi");

  if (!rawPhone && !rawNmi) {
    return Response.json({ error: "Provide ?phone=<number> or ?nmi=<value>" }, { status: 400 });
  }

  if (rawPhone) {
    const phone = normalizePhone(rawPhone);
    if (!phone) return Response.json({ error: "Invalid phone number format." }, { status: 400 });
    const channels = await searchByPhone(phone);
    return Response.json({ type: "phone", query: phone, found: channels.length > 0, channels });
  }

  const nmi = normalizeNmi(rawNmi);
  if (!nmi) return Response.json({ error: "Invalid NMI / MIRN value." }, { status: 400 });
  const channels = await searchByNmi(nmi);
  return Response.json({ type: "nmi", query: nmi, found: channels.length > 0, channels });
}
