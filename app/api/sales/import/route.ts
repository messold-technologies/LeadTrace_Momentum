import { importExcelBuffer } from "@/lib/salesImporter";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded. Use field name 'file'." }, { status: 400 });
  }

  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    return Response.json({ error: "Only .xlsx / .xls files are accepted." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const report = await importExcelBuffer(buffer);

  const totalInserted  = report.reduce((s, r) => s + (r.inserted  ?? 0), 0);
  const totalDuplicates = report.reduce((s, r) => s + (r.duplicates ?? 0), 0);
  const totalSkipped   = report.reduce((s, r) => s + (r.skippedRows ?? 0), 0);

  return Response.json({
    summary: { totalInserted, totalDuplicates, totalSkipped },
    sheets: report,
  });
}
