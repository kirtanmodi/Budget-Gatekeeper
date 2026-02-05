import type { Category, CategorySuggestion, DecisionLog } from '../types';

const DEFAULT_KEYWORDS: Record<string, string[]> = {
  groceries: [
    'grocery', 'groceries', 'vegetables', 'fruits', 'milk', 'bread', 'rice',
    'dal', 'atta', 'oil', 'supermarket', 'bigbasket', 'blinkit', 'zepto',
    'dmart', 'reliance', 'more', 'spencers', 'kitchen', 'provisions', 'sabzi',
    'meat', 'chicken', 'fish', 'eggs', 'dairy', 'curd', 'paneer', 'butter',
  ],
  transport: [
    'uber', 'ola', 'auto', 'rickshaw', 'cab', 'taxi', 'metro', 'bus',
    'petrol', 'diesel', 'fuel', 'parking', 'toll', 'rapido', 'bike',
    'train', 'railway', 'flight', 'airport', 'travel', 'commute',
  ],
  'eating-entertainment': [
    'restaurant', 'dinner', 'lunch', 'breakfast', 'coffee', 'cafe', 'tea',
    'swiggy', 'zomato', 'pizza', 'burger', 'biryani', 'food', 'meal',
    'movie', 'cinema', 'pvr', 'inox', 'netflix', 'prime', 'hotstar',
    'spotify', 'game', 'gaming', 'pub', 'bar', 'drinks', 'beer', 'wine',
    'party', 'outing', 'hangout', 'starbucks', 'ccd', 'dominos', 'mcdonalds',
    'kfc', 'subway', 'snacks', 'ice cream', 'dessert', 'sweet',
  ],
  'life-events': [
    'gift', 'birthday', 'wedding', 'anniversary', 'festival', 'diwali',
    'holi', 'christmas', 'new year', 'celebration', 'donation', 'charity',
    'medical', 'doctor', 'hospital', 'medicine', 'pharmacy', 'health',
    'insurance', 'emergency', 'repair', 'maintenance', 'service',
  ],
  'my-personal': [
    'clothes', 'clothing', 'shoes', 'accessories', 'watch', 'bag',
    'haircut', 'salon', 'spa', 'grooming', 'cosmetics', 'skincare',
    'book', 'books', 'kindle', 'electronics', 'gadget', 'phone',
    'laptop', 'headphones', 'subscription', 'gym', 'fitness', 'hobby',
    'amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'online',
  ],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function getKeywordsForCategory(category: Category): string[] {
  if (category.keywords && category.keywords.length > 0) {
    return category.keywords;
  }
  return DEFAULT_KEYWORDS[category.id] || [];
}

export function buildKeywordIndex(
  categories: Category[]
): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const category of categories) {
    const keywords = getKeywordsForCategory(category);
    index.set(category.id, keywords);
  }

  return index;
}

export function learnFromHistory(
  logs: DecisionLog[]
): Map<string, Set<string>> {
  const categoryWords = new Map<string, Set<string>>();

  for (const log of logs) {
    if (!log.description) continue;

    const tokens = tokenize(log.description);
    if (!categoryWords.has(log.categoryId)) {
      categoryWords.set(log.categoryId, new Set());
    }

    const words = categoryWords.get(log.categoryId)!;
    for (const token of tokens) {
      if (token.length >= 3) {
        words.add(token);
      }
    }
  }

  return categoryWords;
}

export function calculateConfidence(
  matchCount: number,
  totalTokens: number,
  hasExactMatch: boolean
): number {
  if (totalTokens === 0) return 0;

  let confidence = matchCount / totalTokens;

  if (hasExactMatch) {
    confidence = Math.min(1, confidence + 0.3);
  }

  confidence = Math.min(1, confidence * 1.5);

  return Math.round(confidence * 100) / 100;
}

export function suggestCategory(
  description: string,
  categories: Category[],
  logs: DecisionLog[] = []
): CategorySuggestion | null {
  if (!description.trim()) return null;

  const tokens = tokenize(description);
  if (tokens.length === 0) return null;

  const keywordIndex = buildKeywordIndex(categories);
  const learnedWords = learnFromHistory(logs);

  const scores: Array<{
    categoryId: string;
    categoryName: string;
    matchCount: number;
    hasExactMatch: boolean;
  }> = [];

  for (const category of categories) {
    const keywords = keywordIndex.get(category.id) || [];
    const learned = learnedWords.get(category.id) || new Set();

    let matchCount = 0;
    let hasExactMatch = false;

    for (const token of tokens) {
      const keywordMatch = keywords.some(
        (kw) => kw.includes(token) || token.includes(kw)
      );

      if (keywordMatch) {
        matchCount++;
        if (keywords.includes(token)) {
          hasExactMatch = true;
        }
      }

      if (learned.has(token)) {
        matchCount += 0.5;
      }
    }

    if (matchCount > 0) {
      scores.push({
        categoryId: category.id,
        categoryName: category.name,
        matchCount,
        hasExactMatch,
      });
    }
  }

  if (scores.length === 0) return null;

  scores.sort((a, b) => {
    if (b.hasExactMatch !== a.hasExactMatch) {
      return b.hasExactMatch ? 1 : -1;
    }
    return b.matchCount - a.matchCount;
  });

  const best = scores[0];
  const confidence = calculateConfidence(
    best.matchCount,
    tokens.length,
    best.hasExactMatch
  );

  if (confidence < 0.3) return null;

  return {
    categoryId: best.categoryId,
    categoryName: best.categoryName,
    confidence,
  };
}
