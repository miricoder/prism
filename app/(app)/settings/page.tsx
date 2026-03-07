'use client';

import ApiKeyForm from '@/components/Settings/ApiKeyForm';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-8">
        <section className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <p className="text-[#cbd5e1] text-sm mb-6">
            Your API keys are encrypted and stored securely. They are never logged or exposed to the frontend.
          </p>

          <div className="space-y-6">
            <ApiKeyForm service="claude" label="Claude API Key" />
            <ApiKeyForm service="openai" label="OpenAI API Key" />
          </div>
        </section>

        <section className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Theme</h2>
          <div>
            <label className="block text-sm mb-2">Appearance</label>
            <select className="bg-[#0f172a] border border-[#334155] rounded px-3 py-2">
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </section>

        <section className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
          <button className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-2 rounded font-semibold">
            Delete Account
          </button>
        </section>
      </div>
    </div>
  );
}
