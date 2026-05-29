import { importExcelBuffer } from "@/lib/salesImporter";

export const runtime = "nodejs";
/** Legacy whole-file import — large files should use chunked client import */
export const maxDuration = 300;

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

  // Files over ~2MB should use browser chunked import to avoid 504 timeouts
  if (file.size > 2 * 1024 * 1024) {
    return Response.json(
      {
        error:
          "File is too large for single upload. The app will import it in smaller batches automatically — please refresh and try again.",
      },
      { status: 413 },
    );
  }

  const buffer = await file.arrayBuffer();
  const sheets = await importExcelBuffer(buffer);

  const totalInserted  = sheets.reduce((s, r) => s + (r.inserted  ?? 0), 0);
  const totalDuplicates = sheets.reduce((s, r) => s + (r.duplicates ?? 0), 0);
  const totalSkipped   = sheets.reduce((s, r) => s + (r.skippedRows ?? 0), 0);

  return Response.json({ summary: { totalInserted, totalDuplicates, totalSkipped }, sheets });
}
