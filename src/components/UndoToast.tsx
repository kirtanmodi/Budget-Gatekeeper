import { useEffect, useState } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  const handleUndo = () => {
    onUndo();
    setVisible(false);
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-gray-200 text-white rounded-lg p-4 flex items-center justify-between shadow-lg z-50">
      <span className="text-sm">{message}</span>
      <button
        onClick={handleUndo}
        className="ml-4 px-3 py-1 text-sm font-medium bg-nf-red text-white rounded active:bg-nf-red-dark"
      >
        Undo
      </button>
    </div>
  );
}
