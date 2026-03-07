'use client';

import { useState } from 'react';

export default function ApiKeyForm({ service, label }: { service: string; label: string }) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!key) return;

    try {
      const response = await fetch(`/api/settings/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, key }),
      });

      if (response.ok) {
        setSaved(true);
        setKey('');
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">{label}</label>
      <div className="flex gap-2">
        <input
          type={showKey ? 'text' : 'password'}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={`Enter your ${service} API key`}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded"
        >
          {showKey ? '👁️' : '🔒'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </div>
      {saved && <p className="text-[#10b981] text-sm">✅ Saved securely!</p>}
    </div>
  );
}
