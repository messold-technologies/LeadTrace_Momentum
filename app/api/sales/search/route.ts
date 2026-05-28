import { normalizePhone } from "@/lib/salesImporter";
import { getDb } from "@/lib/mongodb";

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

  const db  = await getDb();
  const col = db.collection("sales");

  const results = await col.aggregate([
    { $match: { phone } },
    {
      $group: {
        _id:     "$channel",
        count:   { $sum: 1 },
        records: {
          $push: {
            sale_date:   "$sale_date",
            center_name: "$center_name",
          },
        },
      },
    },
    {
      $project: {
        _id:     0,
        channel: "$_id",
        count:   1,
        records: 1,
      },
    },
    { $sort: { channel: 1 } },
  ]).toArray();

  return Response.json({
    phone,
    found:    results.length > 0,
    channels: results,
  });
}
