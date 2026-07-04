/**
 * Tools (Ferramentas) para o LangGraph.
 * 
 * Estas tools são usadas pelo Scheduling Node através de Function Calling.
 * Cada tool é uma função TypeScript que interage com o banco de dados.
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { 
  clinics, 
  professionals, 
  appointments 
} from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getAvailableSlots } from "@/lib/booking";

// ─── Tool: Check Availability ───────────────────────────────────────────────

/**
 * Busca horários livres para uma especialidade e clínica específicos.
 * 
 * Uso pelo LLM:
 * "Quero agendar uma consulta de cardiologia. Quais horários estão disponíveis?"
 */
export const checkAvailabilityTool = new DynamicStructuredTool({
  name: "check_availability",
  description: "Busca horários disponíveis para agendamento de consulta. Use quando o paciente quiser verificar disponibilidade ou agendar.",
  schema: z.object({
    clinicId: z.string().describe("ID da clínica"),
    specialty: z.string().describe("Especialidade médica (ex: cardiology, dermatology)"),
    preferredDate: z.string().optional().describe("Data preferida no formato YYYY-MM-DD (opcional)"),
    preferredPeriod: z.enum(["manha", "tarde", "qualquer"]).optional().describe("Período preferido"),
  }),
  func: async ({ clinicId, specialty, preferredDate, preferredPeriod }) => {
    try {
      // 1. Busca profissionais da clínica com a especialidade
      const clinicProfessionals = await db
        .select({
          id: professionals.id,
          name: professionals.name,
          specialty: professionals.specialty,
          workingHoursStart: professionals.workingHoursStart,
          workingHoursEnd: professionals.workingHoursEnd,
          slotDuration: professionals.slotDuration,
          availableDays: professionals.availableDays,
          breakStart: professionals.breakStart,
          breakEnd: professionals.breakEnd,
        })
        .from(professionals)
        .where(
          and(
            eq(professionals.clinicId, clinicId),
            eq(professionals.isActive, true),
            eq(professionals.specialty, specialty)
          )
        );

      if (clinicProfessionals.length === 0) {
        return JSON.stringify({
          success: false,
          message: `Nenhum profissional encontrado para a especialidade "${specialty}" nesta clínica.`,
          professionals: [],
        });
      }

      // 2. Para cada profissional, busca slots disponíveis
      const today = new Date();
      const fromDate = preferredDate || today.toISOString().split("T")[0];
      
      // Busca para os próximos 7 dias
      const toDate = new Date(today);
      toDate.setDate(toDate.getDate() + 7);
      const toDateStr = toDate.toISOString().split("T")[0];

      const results = [];

      for (const prof of clinicProfessionals) {
        // Converte availableDays para o formato esperado
        const availableDays = (prof.availableDays as number[]) || [1, 2, 3, 4, 5];
        
        // Gera slots usando a função existente
        const professionalData = {
          id: prof.id,
          name: prof.name,
          avatarUrl: "",
          createdAt: new Date(),
          specialty: prof.specialty || "",
          rating: 0,
          reviewCount: 0,
          clinicId,
          userId: null,
          registrationNumber: null,
          bio: null,
          workingHoursStart: prof.workingHoursStart || "08:00",
          workingHoursEnd: prof.workingHoursEnd || "18:00",
          slotDuration: prof.slotDuration || 30,
          availableDays,
          breakStart: prof.breakStart || undefined,
          breakEnd: prof.breakEnd || undefined,
          isActive: true,
        };

        const slots = await getAvailableSlots(professionalData, fromDate);
        
        // Filtra por período se especificado
        const filteredSlots = slots.filter((slot) => {
          if (!slot.available) return false;
          if (preferredPeriod === "manha") {
            const hour = parseInt(slot.time.split(":")[0]);
            return hour < 12;
          }
          if (preferredPeriod === "tarde") {
            const hour = parseInt(slot.time.split(":")[0]);
            return hour >= 12;
          }
          return true;
        });

        results.push({
          professionalId: prof.id,
          professionalName: prof.name,
          specialty: prof.specialty,
          availableSlots: filteredSlots.slice(0, 10), // Limita a 10 slots
          totalAvailable: filteredSlots.length,
        });
      }

      return JSON.stringify({
        success: true,
        clinicId,
        specialty,
        dateRange: { from: fromDate, to: toDateStr },
        professionals: results,
      });
    } catch (error) {
      console.error("[check_availability] Error:", error);
      return JSON.stringify({
        success: false,
        message: "Erro ao buscar disponibilidade. Tente novamente.",
        error: String(error),
      });
    }
  },
});

// ─── Tool: Book Appointment ─────────────────────────────────────────────────

/**
 * Realiza o agendamento no banco de dados.
 * 
 * Uso pelo LLM:
 * "Vou agendar para o Dr. João na quarta às 14:00."
 */
export const bookAppointmentTool = new DynamicStructuredTool({
  name: "book_appointment",
  description: "Realiza o agendamento de uma consulta no banco de dados. Use após verificar disponibilidade.",
  schema: z.object({
    clinicId: z.string().describe("ID da clínica"),
    professionalId: z.string().describe("ID do profissional"),
    patientId: z.string().describe("ID do paciente (usuário logado)"),
    date: z.string().describe("Data do agendamento YYYY-MM-DD"),
    time: z.string().describe("Horário HH:MM"),
    specialty: z.string().describe("Especialidade da consulta"),
    notes: z.string().optional().describe("Observações adicionais"),
  }),
  func: async ({ 
    clinicId, 
    professionalId, 
    patientId,
    date, 
    time, 
    specialty,
    notes 
  }) => {
    try {
      // 1. Busca o profissional para obter duração do slot
      const [professional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, professionalId))
        .limit(1);

      if (!professional) {
        return JSON.stringify({
          success: false,
          message: "Profissional não encontrado.",
        });
      }

      // 2. Calcula horário de término
      const slotDuration = professional.slotDuration || 30;
      const [hours, minutes] = time.split(":").map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + slotDuration);
      
      const endTimeStr = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

      // 3. Verifica se o horário ainda está disponível
      const [existingBooking] = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.professionalId, professionalId),
            eq(appointments.date, date),
            eq(appointments.startTime, time),
            ne(appointments.status, "cancelled")
          )
        )
        .limit(1);

      if (existingBooking) {
        return JSON.stringify({
          success: false,
          message: "Este horário já está ocupado. Por favor, escolha outro horário.",
        });
      }

      // 4. Cria o agendamento
      const result = await db.execute(sql`
        INSERT INTO appointments (patient_id, clinic_id, professional_id, date, start_time, end_time, notes)
        VALUES (${patientId}, ${clinicId}, ${professionalId}, ${date}, ${time}, ${endTimeStr}, ${notes || `Agendamento via IA - ${specialty}`})
        RETURNING id
      `);
      const newAppointment = (result as any)[0];

      return JSON.stringify({
        success: true,
        message: "Agendamento realizado com sucesso!",
        appointment: {
          id: newAppointment.id,
          professionalName: professional.name,
          date,
          time,
          endTime: endTimeStr,
          specialty,
        },
      });
    } catch (error) {
      console.error("[book_appointment] Error:", error);
      return JSON.stringify({
        success: false,
        message: "Erro ao realizar agendamento. Tente novamente.",
        error: String(error),
      });
    }
  },
});

// ─── Tool: Get Patient History ──────────────────────────────────────────────

/**
 * Busca histórico de agendamentos do paciente.
 */
export const getPatientHistoryTool = new DynamicStructuredTool({
  name: "get_patient_history",
  description: "Busca o histórico de agendamentos de um paciente. Use quando o paciente quiser verificar seus compromissos.",
  schema: z.object({
    patientId: z.string().describe("ID do paciente"),
  }),
  func: async ({ patientId }) => {
    try {
      const patientAppointments = await db
        .select({
          id: appointments.id,
          date: appointments.date,
          startTime: appointments.startTime,
          endTime: appointments.endTime,
          status: appointments.status,
          professionalName: professionals.name,
          specialty: professionals.specialty,
        })
        .from(appointments)
        .innerJoin(professionals, eq(appointments.professionalId, professionals.id))
        .where(eq(appointments.patientId, patientId))
        .orderBy(appointments.date)
        .limit(10);

      return JSON.stringify({
        success: true,
        appointments: patientAppointments,
        total: patientAppointments.length,
      });
    } catch (error) {
      console.error("[get_patient_history] Error:", error);
      return JSON.stringify({
        success: false,
        message: "Erro ao buscar histórico.",
      });
    }
  },
});

// ─── Tool: Cancel Appointment ───────────────────────────────────────────────

/**
 * Cancela um agendamento existente.
 */
export const cancelAppointmentTool = new DynamicStructuredTool({
  name: "cancel_appointment",
  description: "Cancela um agendamento existente. Use quando o paciente quiser cancelar uma consulta.",
  schema: z.object({
    appointmentId: z.string().describe("ID do agendamento a ser cancelado"),
  }),
  func: async ({ appointmentId }) => {
    try {
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);

      if (!appointment) {
        return JSON.stringify({
          success: false,
          message: "Agendamento não encontrado.",
        });
      }

      if (appointment.status === "cancelled") {
        return JSON.stringify({
          success: false,
          message: "Este agendamento já foi cancelado.",
        });
      }

      await db.execute(sql`
        UPDATE appointments
        SET status = 'cancelled', notes = 'Cancelado via IA', updated_at = NOW()
        WHERE id = ${appointmentId}
      `);

      return JSON.stringify({
        success: true,
        message: "Agendamento cancelado com sucesso.",
        appointment: {
          id: appointment.id,
          date: appointment.date,
          time: appointment.startTime,
        },
      });
    } catch (error) {
      console.error("[cancel_appointment] Error:", error);
      return JSON.stringify({
        success: false,
        message: "Erro ao cancelar agendamento.",
      });
    }
  },
});

// ─── Exporta Todas as Tools ─────────────────────────────────────────────────

export const allTools = [
  checkAvailabilityTool,
  bookAppointmentTool,
  getPatientHistoryTool,
  cancelAppointmentTool,
];
