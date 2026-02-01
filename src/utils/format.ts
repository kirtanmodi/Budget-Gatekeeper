const LOCALE = 'en-IN';

export const formatCurrency = (amount: number): string =>
  `₹${Math.round(amount).toLocaleString(LOCALE)}`;

export const formatCompactCurrency = (amount: number): string => {
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(Math.abs(amount) >= 10000 ? 0 : 1)}k`;
  }
  return `₹${amount.toLocaleString(LOCALE)}`;
};

export const formatNumber = (amount: number): string =>
  Math.round(amount).toLocaleString(LOCALE);

export const pluralize = (count: number, singular: string, plural?: string): string =>
  count === 1 ? singular : (plural ?? `${singular}s`);
