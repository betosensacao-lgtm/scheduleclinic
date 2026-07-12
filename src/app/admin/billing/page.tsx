"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number | null;
  maxProfessionals: number | null;
  maxConversationsMonthly: number | null;
  features: string[];
  highlighted: boolean;
}

interface ClinicBilling {
  id: string;
  name: string;
  planId: string | null;
  planName: string | null;
  planSlug: string | null;
  planPrice: number | null;
  planFeatures: string[] | null;
  planMaxConversations: number | null;
  billingCycle: string | null;
  trialEndsAt: string | null;
  conversationsUsedMonthly: number;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
}

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function BillingPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<ClinicBilling | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [clinicRes, plansRes] = await Promise.all([
          fetch("/api/admin/clinics").then((r) => r.json()),
          fetch("/api/admin/plans").then((r) => r.json()),
        ]);

        const clinicsData = Array.isArray(clinicRes) ? clinicRes : clinicRes.clinics || [];
        const plansData = Array.isArray(plansRes) ? plansRes : plansRes.plans || [];

        setPlans(plansData);

        const clinicId = process.env.NEXT_PUBLIC_CLINIC_ID || "";
        if (clinicsData.length > 0) {
          setClinic(clinicsData[0]);
        }
      } catch (err) {
        console.error("Failed to load billing data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubscribe(planId: string, billingCycle: string) {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erro ao criar sessao de checkout");
      }
    } catch {
      alert("Erro ao conectar");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erro ao acessar portal");
      }
    } catch {
      alert("Erro ao conectar");
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "Ativa", color: "text-green-600 bg-green-50 border-green-200" },
    past_due: { label: "Pagamento Pendente", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    canceled: { label: "Cancelada", color: "text-red-600 bg-red-50 border-red-200" },
    incomplete: { label: "Incompleta", color: "text-orange-600 bg-orange-50 border-orange-200" },
    trialing: { label: "Trial", color: "text-blue-600 bg-blue-50 border-blue-200" },
  };

  const subStatus = clinic?.subscriptionStatus
    ? statusLabels[clinic.subscriptionStatus] || { label: clinic.subscriptionStatus, color: "text-gray-600 bg-gray-50 border-gray-200" }
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faturamento</h1>
        <p className="text-gray-500 mt-1">Gerencie sua assinatura e plano</p>
      </div>

      {clinic ? (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Plano Atual</h2>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-gray-900">
                    {clinic.planName || "Sem plano"}
                  </span>
                  {subStatus && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${subStatus.color}`}>
                      {subStatus.label}
                    </span>
                  )}
                </div>
                {clinic.planPrice ? (
                  <p className="text-sm text-gray-500">
                    {formatPrice(clinic.planPrice)}/{clinic.billingCycle === "yearly" ? "ano" : "mês"}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Clinica em modo gratuito</p>
                )}
                {clinic.trialEndsAt && new Date(clinic.trialEndsAt) > new Date() && (
                  <p className="text-xs text-gray-400 mt-1">
                    Periodo de teste ate {formatDate(clinic.trialEndsAt)}
                  </p>
                )}
              </div>

              {clinic.stripeCustomerId ? (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="px-4 py-2 text-sm font-medium text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 disabled:opacity-50 transition-colors"
                >
                  {portalLoading ? "Abrindo..." : "Gerenciar Assinatura"}
                </button>
              ) : null}
            </div>

            {clinic.planFeatures && clinic.planFeatures.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Funcionalidades
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {clinic.planFeatures.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clinic.planMaxConversations && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Uso de Conversas
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (clinic.conversationsUsedMonthly / clinic.planMaxConversations) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">
                    {clinic.conversationsUsedMonthly}/{clinic.planMaxConversations}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mudar de Plano</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isCurrentPlan = clinic.planId === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-2xl border p-5 ${
                      isCurrentPlan
                        ? "border-teal-300 ring-1 ring-teal-300"
                        : "border-gray-200"
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatPrice(plan.priceMonthly)}
                      <span className="text-sm font-normal text-gray-500">/mês</span>
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.slice(0, 3).map((f) => (
                        <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <svg className="w-3 h-3 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-xs text-gray-400">+{plan.features.length - 3} mais</li>
                      )}
                    </ul>
                    <button
                      onClick={() => handleSubscribe(plan.id, "monthly")}
                      disabled={isCurrentPlan || checkoutLoading}
                      className={`w-full mt-4 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        isCurrentPlan
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                      }`}
                    >
                      {isCurrentPlan
                        ? "Plano Atual"
                        : checkoutLoading
                        ? "Abrindo..."
                        : "Assinar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500">Nenhuma clinica encontrada.</p>
        </div>
      )}
    </div>
  );
}
