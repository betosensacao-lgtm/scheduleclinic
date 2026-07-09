import { getAllContext } from "@/lib/rag/knowledge-base";
import { ContextForm } from "./ContextForm";

export const dynamic = "force-dynamic";

const CLINIC_ID = process.env.CLINIC_ID || "default";

export default async function AdminContextPage() {
  let entries: Awaited<ReturnType<typeof getAllContext>> = [];
  let error: string | null = null;

  try {
    entries = await getAllContext(CLINIC_ID);
  } catch (e) {
    error = e instanceof Error ? e.message : "Erro ao carregar contexto";
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Contexto da Clínica
      </h1>
      <p className="text-gray-500 mb-8">
        Gerencie as informacoes que a IA utiliza para responder aos pacientes.
        Insira textos, regras e horarios em formato livre.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Adicionar / Atualizar Informacao
        </h2>
        <ContextForm clinicId={CLINIC_ID} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Informacoes Cadastradas
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma informacao cadastrada. Use o formulario acima para adicionar.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {entry.key.replace(/_/g, " ")}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Atualizado em{" "}
                  {new Date(entry.updatedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
