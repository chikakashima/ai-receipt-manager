export type Receipt = {
  id: string;
  receipt_date: string;
  store_name: string;
  total_amount: number;
  tax_amount: number;
  category: string;
  memo: string;
  image_url: string | null;
  line_user_id: string | null;
  created_at: string;
};

export type ReceiptInput = {
  receipt_date: string;
  store_name: string;
  total_amount: number;
  tax_amount: number;
  category: string;
  memo: string;
};

export type DashboardSummary = {
  monthCount: number;
  monthTotal: number;
  recentReceipts: Receipt[];
};
