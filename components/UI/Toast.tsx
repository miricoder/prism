import React, { useEffect } from 'react';

interface Props {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 3500 }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className="fixed right-6 top-6 z-50">
      <div className="bg-slate-800/95 text-slate-100 border border-slate-700 rounded-lg px-4 py-2 shadow-lg">
        <div className="text-sm">{message}</div>
      </div>
    </div>
  );
}
