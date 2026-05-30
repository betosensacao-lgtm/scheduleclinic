import { Suspense } from "react";
import Link from "next/link";
import { Calendar, SearchX } from "lucide-react";
import { searchClinics } from "@/lib/booking";
import { ClinicCard } from "./components/ClinicCard";
import { SearchBar } from "./components/SearchBar";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; query?: string }>;
}) {
  const { specialty, query } = await searchParams;
  const clinics = await searchClinics({ specialty, query });

  return (
    <div className="min-h-screen bg-[#F4FAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#CCE8E8]">
        <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A9396] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-syne font-extrabold text-[#003049] tracking-tight">
              ScheduleClinic
            </span>
          </Link>
          <Link href="/auth/login" className="text-sm font-semibold text-[#003049] hover:text-[#0A9396]">
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="font-syne font-extrabold text-4xl text-[#003049] tracking-tight">
            Find & book your next appointment
          </h1>
          <p className="text-[#56768A]">
            Browse top-rated clinics, check real-time availability, and book in seconds.
          </p>
        </div>

        {/* Search */}
        <Suspense fallback={<div className="h-20 bg-white rounded-2xl border border-[#CCE8E8] animate-pulse" />}>
          <SearchBar />
        </Suspense>

        {/* Results */}
        {clinics.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#CCE8E8] p-16 text-center">
            <SearchX className="w-12 h-12 text-[#CCE8E8] mx-auto mb-4" />
            <p className="text-[#56768A] font-semibold text-lg">No clinics found</p>
            <p className="text-xs text-[#56768A] mt-1">Try a different specialty or search term.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#56768A]">
              {clinics.length} {clinics.length === 1 ? "clinic" : "clinics"} available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
