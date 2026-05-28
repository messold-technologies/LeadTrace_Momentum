import { connectDb } from "@/lib/db";
import { Sale } from "@/models/Sale";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const channel = decodeURIComponent(name);

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip  = (page - 1) * limit;

  await connectDb();

  const [records, total] = await Promise.all([
    Sale.find({ channel }, { _id: 0, phone: 1, nmi: 1, sale_date: 1, center_name: 1 })
        .sort({ sale_date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    Sale.countDocuments({ channel }),
  ]);

  return Response.json({
    channel,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    records,
  });
}
