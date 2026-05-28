export type User = { id: string; email: string };

export type Channel = { name: string; count: number };

export type ChannelRecord = {
  phone: string;
  nmi: string | null;
  sale_date: string | null;
  center_name: string | null;
};

export type ChannelPage = {
  channel: string;
  total: number;
  page: number;
  totalPages: number;
  records: ChannelRecord[];
};

export type SearchRecord = {
  phone: string;
  nmi: string | null;
  sale_date: string | null;
  center_name: string | null;
};

export type SearchChannel = {
  channel: string;
  count: number;
  records: SearchRecord[];
};

export type SearchResult = {
  type: "phone" | "nmi";
  query: string;
  found: boolean;
  channels: SearchChannel[];
};

export type SheetReport = {
  sheet: string;
  skipped?: boolean;
  reason?: string;
  inserted?: number;
  duplicates?: number;
  skippedRows?: number;
  detectedColumns?: {
    phone: string | null;
    nmi: string | null;
    date: string | null;
    center: string | null;
  };
};

export type ImportResult = {
  summary: {
    totalInserted: number;
    totalDuplicates: number;
    totalSkipped: number;
  };
  sheets: SheetReport[];
};
