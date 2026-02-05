import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ParsedTransaction {
  date: string;
  narration: string;
  amount: number;
  refNo: string;
  type: 'expense' | 'income';
}

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
}

export async function parseHDFCPDF(
  file: File,
  password?: string
): Promise<ParsedTransaction[]> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data,
    ...(password ? { password } : {}),
  });
  const pdf = await loadingTask.promise;
  const transactions: ParsedTransaction[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items: TextItem[] = [];
    for (const item of textContent.items) {
      if ('str' in item && 'transform' in item) {
        const textItem = item as { str: string; transform: number[]; width: number };
        const str = textItem.str.trim();
        if (str.length > 0) {
          items.push({
            str,
            x: textItem.transform[4],
            y: viewport.height - textItem.transform[5],
            width: textItem.width,
          });
        }
      }
    }

    const pageTransactions = extractTransactionsFromPage(items);
    transactions.push(...pageTransactions);
  }

  return transactions;
}

function extractTransactionsFromPage(items: TextItem[]): ParsedTransaction[] {
  const rows = groupItemsByRow(items, 3);
  const transactions: ParsedTransaction[] = [];

  let currentTransaction: {
    date: string;
    narration: string[];
    refNo: string;
    withdrawal: string;
    deposit: string;
  } | null = null;

  for (const row of rows) {
    const sortedRow = row.sort((a, b) => a.x - b.x);
    const dateMatch = findDateInRow(sortedRow);

    if (dateMatch) {
      if (currentTransaction) {
        const withdrawalAmount = parseAmount(currentTransaction.withdrawal);
        const depositAmount = parseAmount(currentTransaction.deposit);
        if (withdrawalAmount > 0) {
          transactions.push({
            date: convertDateToISO(currentTransaction.date),
            narration: currentTransaction.narration.join(' '),
            amount: withdrawalAmount,
            refNo: currentTransaction.refNo,
            type: 'expense',
          });
        } else if (depositAmount > 0) {
          transactions.push({
            date: convertDateToISO(currentTransaction.date),
            narration: currentTransaction.narration.join(' '),
            amount: depositAmount,
            refNo: currentTransaction.refNo,
            type: 'income',
          });
        }
      }

      currentTransaction = {
        date: dateMatch.date,
        narration: [],
        refNo: '',
        withdrawal: '',
        deposit: '',
      };

      const columns = categorizeColumns(sortedRow, dateMatch.index);
      if (columns.narration) {
        currentTransaction.narration.push(columns.narration);
      }
      if (columns.refNo) {
        currentTransaction.refNo = columns.refNo;
      }
      if (columns.withdrawal) {
        currentTransaction.withdrawal = columns.withdrawal;
      }
      if (columns.deposit) {
        currentTransaction.deposit = columns.deposit;
      }
    } else if (currentTransaction) {
      const narrationText = sortedRow
        .filter((item) => item.x < 250)
        .map((item) => item.str)
        .join(' ');
      if (narrationText) {
        currentTransaction.narration.push(narrationText);
      }
    }
  }

  if (currentTransaction) {
    const withdrawalAmount = parseAmount(currentTransaction.withdrawal);
    const depositAmount = parseAmount(currentTransaction.deposit);
    if (withdrawalAmount > 0) {
      transactions.push({
        date: convertDateToISO(currentTransaction.date),
        narration: currentTransaction.narration.join(' '),
        amount: withdrawalAmount,
        refNo: currentTransaction.refNo,
        type: 'expense',
      });
    } else if (depositAmount > 0) {
      transactions.push({
        date: convertDateToISO(currentTransaction.date),
        narration: currentTransaction.narration.join(' '),
        amount: depositAmount,
        refNo: currentTransaction.refNo,
        type: 'income',
      });
    }
  }

  return transactions;
}

function groupItemsByRow(items: TextItem[], tolerance: number): TextItem[][] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => a.y - b.y);
  const rows: TextItem[][] = [];
  let currentRow: TextItem[] = [sorted[0]];
  let currentY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - currentY) <= tolerance) {
      currentRow.push(item);
    } else {
      rows.push(currentRow);
      currentRow = [item];
      currentY = item.y;
    }
  }
  rows.push(currentRow);

  return rows;
}

function findDateInRow(row: TextItem[]): { date: string; index: number } | null {
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{2,4})$/;

  for (let i = 0; i < row.length; i++) {
    const match = row[i].str.match(dateRegex);
    if (match) {
      return { date: row[i].str, index: i };
    }
  }
  return null;
}

function categorizeColumns(
  row: TextItem[],
  dateIndex: number
): { narration: string; refNo: string; withdrawal: string; deposit: string } {
  const result = { narration: '', refNo: '', withdrawal: '', deposit: '' };

  for (let i = dateIndex + 1; i < row.length; i++) {
    const item = row[i];
    const x = item.x;

    if (x < 250) {
      result.narration += (result.narration ? ' ' : '') + item.str;
    } else if (x >= 250 && x < 350) {
      result.refNo = item.str;
    } else if (x >= 420 && x < 490) {
      if (isAmountString(item.str)) {
        result.withdrawal = item.str;
      }
    } else if (x >= 490 && x < 560) {
      if (isAmountString(item.str)) {
        result.deposit = item.str;
      }
    }
  }

  return result;
}

function isAmountString(str: string): boolean {
  const cleaned = str.replace(/,/g, '');
  return /^\d+(\.\d{2})?$/.test(cleaned);
}

function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/,/g, '').replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
}

function convertDateToISO(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;

  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  let year = parts[2];

  if (year.length === 2) {
    const yearNum = parseInt(year, 10);
    year = yearNum > 50 ? `19${year}` : `20${year}`;
  }

  return `${year}-${month}-${day}`;
}
