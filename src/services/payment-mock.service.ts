import { TransactionRepository } from "../repository/transaction.repository.js";
import { CommissionSplitRepository } from "../repository/commission-split.repository.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { Transaction } from "../models/transaction.js";
import { CommissionSplit } from "../models/commission-split.js";
import { Appointment } from "../models/appointment.js";

interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  message: string;
  invoice?: {
    amount: number;
    installments: number;
    brand: string;
    last4: string;
    created_at: string;
  };
}

export class PaymentMockService {
  constructor(
    private transactionRepository: TransactionRepository,
    private commissionSplitRepository: CommissionSplitRepository,
    private appointmentRepository: AppointmentRepository,
  ) {}

  async processAppointmentPayment(
    appointmentId: number,
    cardDetails: {
      number: string;
      cvv: string;
      expiration: string; // MM/YY
      brand: string;
      installments: number;
    },
  ): Promise<PaymentResult> {
    // Validar e Buscar Agendamento
    const appointment =
      await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      return { success: false, message: "Agendamento não encontrado." };
    }

    if (
      appointment.status === "cancelled_by_patient" ||
      appointment.status === "cancelled_by_clinic"
    ) {
      return {
        success: false,
        message: "Não é possível pagar um agendamento cancelado.",
      };
    }

    if (appointment.payment_status === "paid") {
      return { success: false, message: "Agendamento já está pago." };
    }

    // Simular Processamento (80% sucesso)
    const isApproved = Math.random() < 0.8;

    if (!isApproved) {
      // Registrar tentativa falha
      await this.transactionRepository.create({
        type: "appointment_payment",
        reference_id: appointmentId,
        reference_type: "appointment",
        payer_id: appointment.patient_id,
        amount_gross: appointment.price,
        mdr_fee: 0,
        amount_net: 0,
        installments: cardDetails.installments,
        status: "failed",
        payment_method: "credit_card",
        card_brand: cardDetails.brand,
        card_last4: cardDetails.number.slice(-4),
      });

      await this.appointmentRepository.updatePaymentStatus(
        appointmentId,
        "failed",
      );
      return { success: false, message: "Pagamento recusado pela operadora." };
    }

    // Cálculos Financeiros
    const amountGross = appointment.price;
    const mdrRate = 0.0379; // 3.79%
    const mdrFee = parseFloat((amountGross * mdrRate).toFixed(2));
    const amountNet = parseFloat((amountGross - mdrFee).toFixed(2));

    // Persistir Transação
    const gatewayId = `MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const processedAt = new Date().toISOString();

    const transactionId = await this.transactionRepository.create({
      type: "appointment_payment",
      reference_id: appointmentId,
      reference_type: "appointment",
      payer_id: appointment.patient_id,
      amount_gross: amountGross,
      mdr_fee: mdrFee,
      amount_net: amountNet,
      installments: cardDetails.installments,
      status: "paid",
      payment_method: "credit_card",
      gateway_transaction_id: gatewayId,
      card_brand: cardDetails.brand,
      card_last4: cardDetails.number.slice(-4),
      processed_at: processedAt,
    });

    // Divisão de Comissões (Split)
    // Regra: 60% Profissional, 35% Clínica, 5% Sistema (sobre o LÍQUIDO)
    const professionalShare = parseFloat((amountNet * 0.6).toFixed(2));
    const clinicShare = parseFloat((amountNet * 0.35).toFixed(2));
    const systemShare = parseFloat((amountNet * 0.05).toFixed(2)); // O que sobrar para fechar conta

    // Ajuste de centavos (jogar diferença para sistema/clínica se houver, mas aqui simplificamos)
    // Persistir splits
    await this.commissionSplitRepository.create({
      transaction_id: transactionId,
      recipient_id: appointment.professional_id,
      recipient_type: "professional",
      percentage: 60.0,
      amount: professionalShare,
      status: "pending", // Repasse mensal
    });

    await this.commissionSplitRepository.create({
      transaction_id: transactionId,
      recipient_id: null, // Clínica (definido por config ou null)
      recipient_type: "clinic",
      percentage: 35.0,
      amount: clinicShare,
      status: "paid", // Clínica recebe direto
    });

    await this.commissionSplitRepository.create({
      transaction_id: transactionId,
      recipient_id: null, // Sistema
      recipient_type: "system",
      percentage: 5.0,
      amount: systemShare,
      status: "paid", // Sistema recebe direto
    });

    // Atualizar Agendamento
    await this.appointmentRepository.updatePaymentStatus(appointmentId, "paid");
    await this.appointmentRepository.updateStatus(appointmentId, "confirmed");

    // Retorno com Invoice
    return {
      success: true,
      transaction_id: gatewayId,
      message: "Pagamento aprovado com sucesso.",
      invoice: {
        amount: amountGross,
        installments: cardDetails.installments,
        brand: cardDetails.brand,
        last4: cardDetails.number.slice(-4),
        created_at: processedAt,
      },
    };
  }
}
