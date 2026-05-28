import { connectDb } from "@/lib/db";
import { Sale } from "@/models/Sale";

export const runtime = "nodejs";

export async function GET() {
  await connectDb();

  const channels = await Sale.aggregate<{ name: string; count: number }>([
    { $group: { _id: "$channel", count: { $sum: 1 } } },
    { $project: { _id: 0, name: "$_id", count: 1 } },
    { $sort: { name: 1 } },
  ]);

  return Response.json({ channels });
}
