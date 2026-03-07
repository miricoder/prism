'use client';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome to PRISM</h1>
        <p className="text-[#cbd5e1]">Your Ultimate Personal Planner</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <div className="text-3xl mb-2">✈️</div>
          <h3 className="font-semibold mb-1">Travel Plans</h3>
          <p className="text-sm text-[#cbd5e1]">Coming in Phase 2</p>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <div className="text-3xl mb-2">💳</div>
          <h3 className="font-semibold mb-1">Expenses</h3>
          <p className="text-sm text-[#cbd5e1]">Coming in Phase 3</p>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <div className="text-3xl mb-2">🎓</div>
          <h3 className="font-semibold mb-1">Skills & Resume</h3>
          <p className="text-sm text-[#cbd5e1]">Coming in Phase 4</p>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Phase 1 Status</h2>
        <ul className="space-y-2 text-sm">
          <li>✅ Authentication & user management</li>
          <li>✅ Encrypted API key storage</li>
          <li>✅ Settings page</li>
          <li>✅ Global layout & navigation</li>
          <li>✅ Section registry system</li>
        </ul>
      </div>
    </div>
  );
}
