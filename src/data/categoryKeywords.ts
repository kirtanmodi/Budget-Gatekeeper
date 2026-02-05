import type { Category } from '../types';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Groceries': [
    'BIGBASKET',
    'BLINKIT',
    'ZEPTO',
    'DMART',
    'GROCERY',
    'SWIGGY-SWIGGYSTORES',
    'INSTAMART',
    'RELIANCE FRESH',
    'MORE RETAIL',
    'SUPERMARKET',
  ],
  'Transport': [
    'UBER',
    'OLA',
    'RAPIDO',
    'METRO',
    'IRCTC',
    'PETROL',
    'PETROLEUM',
    'ATW-',
    'ATM-WDL',
    'FUEL',
    'PARKING',
    'FASTAG',
    'TOLL',
  ],
  'Eating Out & Entertainment': [
    'SWIGGY',
    'ZOMATO',
    'DOMINOS',
    'MCDONALDS',
    'KFC',
    'CHICKEN',
    'PIZZA',
    'BURGER',
    'CAFE',
    'RESTAURANT',
    'GOOGLE INDIA',
    'NETFLIX',
    'SPOTIFY',
    'YOUTUBE',
    'PRIME VIDEO',
    'HOTSTAR',
    'PVR',
    'INOX',
    'BOOKMYSHOW',
  ],
  'My Personal': [
    'MYNTRA',
    'AMAZON',
    'FLIPKART',
    'AJIO',
    'NYKAA',
    'MEESHO',
    'SHOPPERS STOP',
    'LIFESTYLE',
    'WESTSIDE',
    'H&M',
    'ZARA',
  ],
};

export function matchCategory(
  narration: string,
  categories: Category[]
): string | null {
  const upperNarration = narration.toUpperCase();

  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (upperNarration.includes(keyword.toUpperCase())) {
        if (keyword === 'SWIGGY' && upperNarration.includes('SWIGGYSTORES')) {
          continue;
        }

        const category = categories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (category) {
          return category.id;
        }
      }
    }
  }

  return null;
}

export function getShortDescription(narration: string): string {
  const upper = narration.toUpperCase();

  const knownMerchants: Record<string, string> = {
    SWIGGY: 'Swiggy',
    ZOMATO: 'Zomato',
    AMAZON: 'Amazon',
    FLIPKART: 'Flipkart',
    MYNTRA: 'Myntra',
    'GOOGLE INDIA': 'Google',
    NETFLIX: 'Netflix',
    SPOTIFY: 'Spotify',
    UBER: 'Uber',
    OLA: 'Ola',
    RAPIDO: 'Rapido',
    BIGBASKET: 'BigBasket',
    BLINKIT: 'Blinkit',
    ZEPTO: 'Zepto',
    IRCTC: 'IRCTC',
    PETROL: 'Petrol',
    PETROLEUM: 'Petrol',
  };

  for (const [keyword, displayName] of Object.entries(knownMerchants)) {
    if (upper.includes(keyword)) {
      return displayName;
    }
  }

  if (upper.startsWith('UPI-')) {
    const parts = narration.split('-');
    if (parts.length > 1) {
      return parts[1].split(' ')[0];
    }
  }

  if (upper.startsWith('NEFT') || upper.startsWith('IMPS')) {
    const parts = narration.split('-');
    if (parts.length > 2) {
      return parts[2].split(' ')[0];
    }
  }

  if (upper.startsWith('POS ')) {
    const match = narration.match(/POS \d+X+\d+ (.+)/i);
    if (match) {
      return match[1].split(' ')[0];
    }
  }

  const words = narration.split(/[\s-]+/).filter((w) => w.length > 2);
  if (words.length > 0) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
  }

  return narration.substring(0, 20);
}
