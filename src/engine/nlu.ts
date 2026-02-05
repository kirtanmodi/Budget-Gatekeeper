import type { NluParseResult } from '../types';

type NlpDocument = {
  nouns: () => { out: (format: string) => string[] };
  numbers: () => { out: (format: string) => string[] };
};

type NlpFunction = (text: string) => NlpDocument;

let nlpFn: NlpFunction | null = null;

async function loadNlp(): Promise<NlpFunction> {
  if (!nlpFn) {
    const module = await import('compromise');
    nlpFn = module.default as unknown as NlpFunction;
  }
  return nlpFn;
}

const AMOUNT_PATTERNS = [
  /(?:spent|paid|bought|got)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i,
  /(?:rs\.?|₹|inr)\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i,
  /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:rs\.?|₹|rupees?|inr)/i,
  /(\d+(?:,\d{3})*(?:\.\d+)?)/,
];

const RELATIVE_DATE_PATTERNS: Array<{
  pattern: RegExp;
  daysAgo: number;
}> = [
  { pattern: /\byesterday\b/i, daysAgo: 1 },
  { pattern: /\btoday\b/i, daysAgo: 0 },
  { pattern: /\blast\s*night\b/i, daysAgo: 1 },
  { pattern: /\bthis\s*morning\b/i, daysAgo: 0 },
];

const CATEGORY_HINTS: Record<string, string[]> = {
  'eating-entertainment': [
    'food', 'dinner', 'lunch', 'breakfast', 'meal', 'eat', 'restaurant', 'cafe', 'coffee', 'tea',
    'movie', 'cinema', 'netflix', 'game', 'gaming', 'party', 'swiggy', 'zomato', 'pizza', 'burger',
  ],
  groceries: ['grocery', 'groceries', 'vegetables', 'fruits', 'supermarket', 'provisions', 'bigbasket', 'blinkit', 'zepto'],
  transport: ['uber', 'ola', 'auto', 'cab', 'taxi', 'metro', 'bus', 'petrol', 'fuel', 'parking', 'rapido'],
  'life-events': ['gift', 'birthday', 'wedding', 'medical', 'doctor', 'hospital', 'medicine'],
  'my-personal': ['shopping', 'clothes', 'shoes', 'amazon', 'flipkart', 'online', 'myntra', 'salon', 'haircut'],
};

export function extractAmount(text: string): number | null {
  const cleaned = text.replace(/,/g, '');

  for (const pattern of AMOUNT_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return null;
}

export function extractDate(text: string, today: string): string {
  for (const { pattern, daysAgo } of RELATIVE_DATE_PATTERNS) {
    if (pattern.test(text)) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    }
  }

  return today;
}

export function extractCategoryHint(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_HINTS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

export async function parseNaturalInput(
  input: string,
  today: string
): Promise<NluParseResult> {
  const rawInput = input.trim();

  if (!rawInput) {
    return {
      amount: null,
      categoryHint: null,
      date: null,
      confidence: 0,
      rawInput,
    };
  }

  const amount = extractAmount(rawInput);
  const date = extractDate(rawInput, today);
  let categoryHint = extractCategoryHint(rawInput);

  let confidence = 0;
  if (amount !== null) confidence += 0.5;
  if (categoryHint !== null) confidence += 0.3;
  if (date !== today) confidence += 0.2;

  try {
    const nlp = await loadNlp();
    const doc = nlp(rawInput);

    const nouns = doc.nouns().out('array');
    if (nouns.length > 0 && !categoryHint) {
      for (const noun of nouns) {
        const hint = extractCategoryHint(noun);
        if (hint) {
          categoryHint = hint;
          confidence += 0.1;
          break;
        }
      }
    }

    const numbers = doc.numbers().out('array');
    if (numbers.length > 0 && amount === null) {
      const parsed = parseFloat(numbers[0].replace(/[^\d.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        confidence += 0.3;
      }
    }
  } catch {
    // NLP failed, use regex-based results
  }

  return {
    amount,
    categoryHint,
    date,
    confidence: Math.min(1, confidence),
    rawInput,
  };
}

export function formatParsedResult(result: NluParseResult): string {
  const parts: string[] = [];

  if (result.amount !== null) {
    parts.push(`₹${result.amount}`);
  }

  if (result.categoryHint) {
    parts.push(`(${result.categoryHint})`);
  }

  if (result.date && result.date !== new Date().toISOString().split('T')[0]) {
    const dateObj = new Date(result.date);
    parts.push(`on ${dateObj.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}`);
  }

  return parts.join(' ') || 'Could not parse input';
}
