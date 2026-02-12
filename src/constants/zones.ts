import type { Zone } from '../engine/decision';

export const zoneLabels: Record<Zone, string> = {
  FREE: 'Free Zone',
  CONTROL: 'Control Zone',
  STOP: 'Over Budget',
};

export const zoneStyles: Record<Zone, { badge: string; bar: string }> = {
  FREE: { badge: 'bg-gray-300 text-gray-800', bar: 'bg-gray-400' },
  CONTROL: { badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500' },
  STOP: { badge: 'bg-red-100 text-red-800', bar: 'bg-red-500' },
};
