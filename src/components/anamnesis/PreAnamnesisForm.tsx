"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { preAnamnesisSchema, type PreAnamnesisInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import {
  User, Heart, Pill, AlertTriangle, Shield, CheckCircle, ChevronRight, ChevronLeft, Plus, X
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Personal Info",   icon: User },
  { id: 2, label: "Chief Complaint", icon: Heart },
  { id: 3, label: "Medical History", icon: Pill },
  { id: 4, label: "Insurance",       icon: Shield },
  { id: 5, label: "Review & Sign",   icon: CheckCircle },
];

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

function TagInput({ values, onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const add = () => {
    const v = inputValue.trim();
    if (v && !values.includes(v)) {
      onChange([...values, v]);
      setInputValue("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="input-brand flex-1"
        />
        <button type="button" onClick={add} className="btn-teal px-4 py-2.5 text-sm">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1.5 bg-[#E0F4F4] text-[#0A9396] border border-[#94D2BD] px-3 py-1 rounded-full text-sm font-medium"
            >
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface PreAnamnesisFormProps {
  appointmentId: string;
  patientName?: string;
  onComplete?: (data: PreAnamnesisInput) => void;
}

export function PreAnamnesisForm({ appointmentId, patientName, onComplete }: PreAnamnesisFormProps) {
  const [step, setStep] = useState(1);
  const [medications, setMedications] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<PreAnamnesisInput>({
    resolver: zodResolver(preAnamnesisSchema),
    defaultValues: {
      fullName: patientName ?? "",
      currentMedications: [],
      allergies: [],
      chronicConditions: [],
      hasInsurance: false,
      consentGiven: false,
    },
  });

  const hasInsurance = watch("hasInsurance");
  const consentGiven = watch("consentGiven");

  const nextStep = async () => {
    let fields: (keyof PreAnamnesisInput)[] = [];
    if (step === 1) fields = ["fullName", "dateOfBirth", "gender", "phone"];
    if (step === 2) fields = ["chiefComplaint"];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, 5));
  };

  const onSubmit = (data: PreAnamnesisInput) => {
    const finalData = {
      ...data,
      currentMedications: medications,
      allergies,
      chronicConditions: conditions,
    };
    onComplete?.(finalData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-[#E0F4F4] flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-[#0A9396]" />
        </div>
        <h3 className="font-syne font-bold text-2xl text-[#003049] mb-2">Pre-Screening Complete!</h3>
        <p className="text-[#56768A] max-w-xs">
          Your health information has been securely submitted. Your doctor will review it before your appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  done  ? "bg-[#0A9396] border-[#0A9396] text-white" :
                  active ? "bg-white border-[#0A9396] text-[#0A9396]" :
                           "bg-white border-[#CCE8E8] text-[#56768A]"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold hidden sm:block",
                  active ? "text-[#0A9396]" : done ? "text-[#0A9396]" : "text-[#56768A]"
                )}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "h-[2px] flex-1 mx-2 mb-4 rounded transition-colors",
                  done ? "bg-[#0A9396]" : "bg-[#CCE8E8]"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-2xl border border-[#CCE8E8] shadow-card p-8">

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-syne font-bold text-xl text-[#003049]">Personal Information</h2>
                <p className="text-sm text-[#56768A] mt-1">Basic information about you</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Full Name *</label>
                  <input {...register("fullName")} className="input-brand" placeholder="Sarah Mitchell" />
                  {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Date of Birth *</label>
                  <input {...register("dateOfBirth")} type="date" className="input-brand" />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs">{errors.dateOfBirth.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Gender *</label>
                  <select {...register("gender")} className="input-brand">
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Phone *</label>
                  <input {...register("phone")} className="input-brand" placeholder="+1 (555) 000-0000" />
                  {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Emergency Contact</label>
                  <input {...register("emergencyContact")} className="input-brand" placeholder="Name & phone" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Blood Type</label>
                  <select {...register("bloodType")} className="input-brand">
                    <option value="">Unknown</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Height (cm)</label>
                  <input {...register("height", { valueAsNumber: true })} type="number" className="input-brand" placeholder="170" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Weight (kg)</label>
                  <input {...register("weight", { valueAsNumber: true })} type="number" className="input-brand" placeholder="70" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Chief Complaint */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-syne font-bold text-xl text-[#003049]">Chief Complaint</h2>
                <p className="text-sm text-[#56768A] mt-1">What brings you in today?</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Main reason for visit *</label>
                <input {...register("chiefComplaint")} className="input-brand" placeholder="e.g. Persistent lower back pain for 2 weeks" />
                {errors.chiefComplaint && <p className="text-red-500 text-xs">{errors.chiefComplaint.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Describe your symptoms</label>
                <textarea {...register("symptomsDescription")} className="input-brand min-h-[100px] resize-none" placeholder="Describe when it started, what makes it better or worse..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Duration</label>
                  <input {...register("symptomsDuration")} className="input-brand" placeholder="e.g. 2 weeks" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Pain Level (0–10)</label>
                  <input {...register("painScale", { valueAsNumber: true })} type="number" min="0" max="10" className="input-brand" placeholder="0 = none, 10 = severe" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Medical History */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-syne font-bold text-xl text-[#003049]">Medical History</h2>
                <p className="text-sm text-[#56768A] mt-1">Help your doctor understand your health background</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" /> Current Medications
                </label>
                <TagInput values={medications} onChange={setMedications} placeholder="Add medication (e.g. Ibuprofen 400mg)" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Allergies
                </label>
                <TagInput values={allergies} onChange={setAllergies} placeholder="Add allergy (e.g. Penicillin)" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Chronic Conditions</label>
                <TagInput values={conditions} onChange={setConditions} placeholder="Add condition (e.g. Hypertension)" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Previous Surgeries</label>
                <textarea {...register("previousSurgeries")} className="input-brand min-h-[80px] resize-none" placeholder="List any surgeries with approximate dates..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Family Medical History</label>
                <textarea {...register("familyHistory")} className="input-brand min-h-[80px] resize-none" placeholder="e.g. Father: diabetes, Mother: hypertension..." />
              </div>
            </div>
          )}

          {/* Step 4: Insurance */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-syne font-bold text-xl text-[#003049]">Insurance Information</h2>
                <p className="text-sm text-[#56768A] mt-1">Optional but helps with billing</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("hasInsurance")}
                  className="w-5 h-5 rounded border-[#CCE8E8] text-[#0A9396] accent-[#0A9396]"
                />
                <span className="text-sm font-medium text-[#003049]">I have health insurance</span>
              </label>
              {hasInsurance && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Insurance Provider</label>
                    <input {...register("insuranceProvider")} className="input-brand" placeholder="e.g. BlueCross PPO" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#56768A] uppercase tracking-wide">Plan / Member Number</label>
                    <input {...register("insurancePlanNumber")} className="input-brand" placeholder="Member ID" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Consent */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-syne font-bold text-xl text-[#003049]">Review & Consent</h2>
                <p className="text-sm text-[#56768A] mt-1">Please review and sign your pre-screening</p>
              </div>
              <div className="bg-[#F4FAFA] rounded-xl p-5 border border-[#CCE8E8] space-y-3 text-sm text-[#56768A]">
                <p className="font-semibold text-[#003049]">Summary</p>
                <p>By submitting this form, you confirm that the information provided is accurate to the best of your knowledge.</p>
                <p>Your health data is encrypted and shared only with your healthcare provider for this appointment.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => setValue("consentGiven", e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-[#CCE8E8] accent-[#0A9396]"
                />
                <span className="text-sm text-[#003049]">
                  I consent to share this health information with my healthcare provider and confirm the information is accurate.
                </span>
              </label>
              {errors.consentGiven && (
                <p className="text-red-500 text-xs">{errors.consentGiven.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            className={cn(
              "flex items-center gap-2 text-sm font-semibold text-[#56768A] hover:text-[#003049] transition-colors",
              step === 1 && "invisible"
            )}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <span className="text-xs text-[#56768A]">Step {step} of {STEPS.length}</span>

          {step < 5 ? (
            <button type="button" onClick={nextStep} className="btn-teal flex items-center gap-2 text-sm">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" className="btn-teal flex items-center gap-2 text-sm">
              Submit Pre-Screening <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
