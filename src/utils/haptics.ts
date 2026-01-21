export function triggerHaptic(type: 'success' | 'warning' | 'error') {
  if (!navigator.vibrate) return;
  switch (type) {
    case 'success':
      navigator.vibrate(50);
      break;
    case 'warning':
      navigator.vibrate([50, 50, 50]);
      break;
    case 'error':
      navigator.vibrate(200);
      break;
  }
}
