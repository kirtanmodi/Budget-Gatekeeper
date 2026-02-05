import { describe, it, expect } from 'vitest';
import { calculateDecision, calculateContext, getDaysInMonth, getZone } from './decision';

describe('calculateDecision', () => {
  const daysInMonth = 30;

  describe('GRACE zone (under 60%)', () => {
    it('returns YES when total spend stays under grace limit', () => {
      const result = calculateDecision(10000, 0, 5000, 1, daysInMonth);
      expect(result.type).toBe('YES');
      expect(result.reason.code).toBe('GRACE');
    });

    it('returns YES at exactly grace limit (60%)', () => {
      const result = calculateDecision(10000, 5000, 1000, 1, daysInMonth);
      expect(result.type).toBe('YES');
      expect(result.reason.code).toBe('GRACE');
    });

    it('does not use grace zone if already above grace limit', () => {
      const result = calculateDecision(10000, 6000, 500, 15, daysInMonth);
      expect(result.reason.code).not.toBe('GRACE');
    });
  });

  describe('ON_PACE zone', () => {
    it('returns YES when on pace mid-month', () => {
      const result = calculateDecision(10000, 6000, 500, 15, daysInMonth);
      expect(result.type).toBe('YES');
      expect(result.reason.code).toBe('ON_PACE');
    });

    it('returns YES when spending exactly at expected pace', () => {
      const result = calculateDecision(10000, 7500, 0, 30, daysInMonth);
      expect(result.type).toBe('YES');
    });
  });

  describe('OVER_PACE zone (WAIT)', () => {
    it('returns WAIT when over pace but under budget', () => {
      const result = calculateDecision(10000, 7000, 1000, 15, daysInMonth);
      expect(result.type).toBe('WAIT');
      if (result.type === 'WAIT') {
        expect(result.days).toBeGreaterThan(0);
      }
      expect(result.reason.code).toBe('OVER_PACE');
    });

    it('calculates correct wait days', () => {
      const result = calculateDecision(10000, 8000, 1000, 15, daysInMonth);
      if (result.type === 'WAIT') {
        expect(result.days).toBeGreaterThan(0);
        expect(result.days).toBeLessThanOrEqual(daysInMonth - 15);
      }
    });
  });

  describe('OVER_BUDGET zone (NO)', () => {
    it('returns NO when total exceeds budget', () => {
      const result = calculateDecision(10000, 9500, 1000, 15, daysInMonth);
      expect(result.type).toBe('NO');
      expect(result.reason.code).toBe('OVER_BUDGET');
    });

    it('returns NO for large purchase that busts budget', () => {
      const result = calculateDecision(10000, 5000, 6000, 15, daysInMonth);
      expect(result.type).toBe('NO');
    });
  });

  describe('edge cases', () => {
    it('handles day 1 of month', () => {
      const result = calculateDecision(10000, 0, 5000, 1, daysInMonth);
      expect(result.type).toBe('YES');
    });

    it('handles last day of month', () => {
      const result = calculateDecision(10000, 9000, 500, 30, daysInMonth);
      expect(result.type).toBe('YES');
    });

    it('handles zero budget', () => {
      const result = calculateDecision(0, 0, 100, 15, daysInMonth);
      expect(result.type).toBe('NO');
    });

    it('handles zero amount purchase', () => {
      const result = calculateDecision(10000, 5000, 0, 15, daysInMonth);
      expect(result.type).toBe('YES');
    });
  });
});

describe('calculateContext', () => {
  it('calculates remaining budget correctly', () => {
    const context = calculateContext(10000, 3000, 15, 30);
    expect(context.remaining).toBe(7000);
    expect(context.spent).toBe(3000);
    expect(context.budget).toBe(10000);
  });

  it('calculates used percent correctly', () => {
    const context = calculateContext(10000, 5000, 15, 30);
    expect(context.usedPercent).toBe(50);
  });

  it('calculates remaining per day correctly', () => {
    const context = calculateContext(10000, 0, 1, 30);
    expect(context.daysLeft).toBe(29);
    expect(context.remainingPerDay).toBeCloseTo(10000 / 29, 2);
  });

  it('handles last day of month', () => {
    const context = calculateContext(10000, 9000, 30, 30);
    expect(context.daysLeft).toBe(1);
    expect(context.remainingPerDay).toBe(1000);
  });

  it('handles zero budget', () => {
    const context = calculateContext(0, 0, 15, 30);
    expect(context.usedPercent).toBe(0);
  });
});

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2024, 0)).toBe(31);
  });

  it('returns 29 for Feb in leap year', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29);
  });

  it('returns 28 for Feb in non-leap year', () => {
    expect(getDaysInMonth(2023, 1)).toBe(28);
  });

  it('returns 30 for April', () => {
    expect(getDaysInMonth(2024, 3)).toBe(30);
  });
});

describe('getZone', () => {
  it('returns FREE for under 60%', () => {
    expect(getZone(5000, 10000)).toBe('FREE');
    expect(getZone(6000, 10000)).toBe('FREE');
  });

  it('returns CONTROL for 60-100%', () => {
    expect(getZone(6100, 10000)).toBe('CONTROL');
    expect(getZone(10000, 10000)).toBe('CONTROL');
  });

  it('returns STOP for over 100%', () => {
    expect(getZone(10001, 10000)).toBe('STOP');
    expect(getZone(15000, 10000)).toBe('STOP');
  });

  it('returns STOP for zero budget', () => {
    expect(getZone(100, 0)).toBe('STOP');
  });
});
