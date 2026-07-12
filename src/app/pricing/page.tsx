"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  sortOrder: number;
}

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(0)}`;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(Array.isArray(data) ? data : data.plans || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F8FA]">
      <nav className="border-b border-[#C8DEDE]/30 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-sora font-bold text-xl text-[#003049]">
              Med<span className="text-[#0A9396]">Book</span>
            </Link>
            <Link
              href="/admin/login"
              className="text-sm font-medium text-[#0A9396] hover:text-[#007678]"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="font-sora font-bold text-3xl sm:text-4xl text-[#003049] mb-4">
            Planos e Preços
          </h1>
          <p className="text-[#5A7A8A] max-w-xl mx-auto mb-8">
            Escolha o plano ideal para sua clínica. Teste grátis por 14 dias, sem compromisso.
          </p>

          <div className="inline-flex items-center gap-2 bg-white border border-[#C8DEDE]/50 rounded-xl p-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                !yearly ? "bg-[#0A9396] text-white shadow-sm" : "text-[#5A7A8A] hover:text-[#003049]"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                yearly ? "bg-[#0A9396] text-white shadow-sm" : "text-[#5A7A8A] hover:text-[#003049]"
              }`}
            >
              Anual
              <span className="ml-1.5 text-[10px] font-semibold text-[#EE9B00]">-17%</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0A9396] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start max-w-5xl mx-auto">
            {plans.map((plan) => {
              const price = yearly
                ? (plan.priceYearly || plan.priceMonthly * 12)
                : plan.priceMonthly;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-7 sm:p-8 relative ${
                    plan.highlighted
                      ? "bg-[#003049] text-white shadow-[0_12px_50px_rgba(0,48,73,0.2)] scale-[1.02] md:-my-4"
                      : "bg-white border border-[#C8DEDE]/50 shadow-card"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#EE9B00] text-white text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full">
                      Mais popular
                    </div>
                  )}

                  <h3
                    className={`font-sora font-bold text-lg mb-1 ${
                      plan.highlighted ? "text-white" : "text-[#003049]"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-5 ${
                      plan.highlighted ? "text-[#94D2BD]" : "text-[#5A7A8A]"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-sora font-extrabold text-4xl">
                      {formatPrice(price)}
                    </span>
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-[#94D2BD]" : "text-[#5A7A8A]"
                      }`}
                    >
                      /{yearly ? "ano" : "mês"}
                    </span>
                  </div>
                  {yearly && plan.priceYearly && (
                    <p className={`text-xs mb-6 ${plan.highlighted ? "text-[#94D2BD]" : "text-[#5A7A8A]"}`}>
                      {formatPrice(plan.priceMonthly)}/mês equivalente
                    </p>
                  )}
                  {!yearly && (
                    <div className="h-5 mb-6" />
                  )}

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm">
                        <svg
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            plan.highlighted ? "text-[#94D2BD]" : "text-[#0A9396]"
                          }`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={plan.highlighted ? "text-[#E3F2F2]" : "text-[#5A7A8A]"}>
                          {feat}
                        </span>
                      </li>
                    ))}
                    {plan.maxConversationsMonthly && (
                      <li className="flex items-start gap-2.5 text-sm">
                        <svg
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            plan.highlighted ? "text-[#94D2BD]" : "text-[#0A9396]"
                          }`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={plan.highlighted ? "text-[#E3F2F2]" : "text-[#5A7A8A]"}>
                          Até {plan.maxConversationsMonthly} conversas/mês
                        </span>
                      </li>
                    )}
                  </ul>

                  <Link
                    href={plan.slug === "enterprise" ? "#" : `/admin/signup`}
                    className={`block text-center font-sora font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 active:scale-[0.97] ${
                      plan.slug === "enterprise"
                        ? "bg-transparent text-[#0A9396] border-[1.5px] border-[#0A9396]/40 hover:bg-[#E3F2F2] cursor-default"
                        : plan.highlighted
                        ? "bg-[#0A9396] text-white hover:bg-[#007678] shadow-teal"
                        : "bg-transparent text-[#0A9396] border-[1.5px] border-[#0A9396]/40 hover:bg-[#E3F2F2]"
                    }`}
                    onClick={(e) => {
                      if (plan.slug === "enterprise") {
                        e.preventDefault();
                      }
                    }}
                  >
                    {plan.slug === "enterprise" ? "Falar com Vendas" : "Começar Agora"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-sm text-[#5A7A8A]">
            Já tem uma conta?{" "}
            <Link href="/admin/login" className="text-[#0A9396] font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
