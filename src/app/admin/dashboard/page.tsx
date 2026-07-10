import { getDashboardStats } from "@/lib/chat/dashboard";

export const dynamic = "force-dynamic";

const CLINIC_ID = process.env.CLINIC_ID || undefined;

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats(CLINIC_ID);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Conversas" value={stats.totalSessions} />
        <StatCard label="Hoje" value={stats.sessionsToday} highlight />
        <StatCard label="Mensagens" value={stats.totalMessages} />
        <StatCard label="Mensagens Hoje" value={stats.messagesToday} highlight />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Pacientes Recentes</h2>
        </div>

        {stats.recentSessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma conversa ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 font-medium">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-center px-4 py-3 font-medium">Mensagens</th>
                  <th className="text-right px-4 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentSessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900">
                      {s.patientName || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.patientPhone || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.patientEmail || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {s.messageCount}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {new Date(s.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? "text-teal-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
