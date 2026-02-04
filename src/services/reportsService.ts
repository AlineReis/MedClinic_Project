import { request } from "./apiService";
import { uiStore } from "../stores/uiStore";

export async function sendFinancialReportEmail(
  startDate?: string,
  endDate?: string,
  htmlContent?: string,
) {
  const body: any = {};
  if (startDate) body.startDate = startDate;
  if (endDate) body.endDate = endDate;
  if (htmlContent) body.htmlContent = htmlContent;

  return await request<{ success: boolean; message: string }>(
    `/reports/financial/email`,
    "POST",
    body,
  );
}
