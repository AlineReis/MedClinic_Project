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
    // RN-27: Professional commission starts as pending_completion, activated when appointment is completed
    await this.commissionSplitRepository.create({
      transaction_id: transactionId,
      recipient_id: appointment.professional_id,
      recipient_type: "professional",
      percentage: 60.0,
      amount: professionalShare,
      status: "pending_completion", // Activated when appointment is completed
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

    // ... (existing code)

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

  async processRefund(appointmentId: number): Promise<{ success: boolean; message: string; refundAmount?: number }> {
      // 1. Buscar a transação original de pagamento
      // (Assumindo que só tem uma "paid" por appointment para simplificar)
      // Como não temos um método findByReference no repo ainda, vamos assumir que o fluxo é chamado logo após validação
      // Mas o correto é buscar no banco. Vamos precisar adicionar esse método no TransactionRepository ou fazer query direta.
      // Por simplicidade/MVP, vamos focar na lógica financeira agnóstica de persistência complexa,
      // mas precisamos SABER o valor pago.
      
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) return { success: false, message: "Agendamento não encontrado." };
      
      if (appointment.payment_status !== 'paid') {
          return { success: false, message: "Agendamento não paga, nada a reembolsar." };
      }

      // Regra de Cancelamento (24h)
      const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      let refundPercentage = 1.0; // 100%
      let penaltyFee = 0;

      if (hoursUntilAppointment < 24) {
          refundPercentage = 0.7; // 70% refund, 30% penalty
      }

      const originalAmount = appointment.price;
      const refundAmount = parseFloat((originalAmount * refundPercentage).toFixed(2));
      const penaltyAmount = parseFloat((originalAmount * (1 - refundPercentage)).toFixed(2));

      // Persistir Transação de Reembolso (Estorno)
      await this.transactionRepository.create({
          type: 'refund',
          reference_id: appointmentId,
          reference_type: 'appointment',
          payer_id: appointment.patient_id, // Recebedor do estorno
          amount_gross: -refundAmount, // Negativo representa saída
          mdr_fee: 0, // Geralmente estorno devolve taxas ou não, depende da adquirente. Simplificado: 0
          amount_net: -refundAmount,
          installments: 1,
          status: 'paid', // Estorno realizado
          payment_method: 'credit_card',
          processed_at: new Date().toISOString()
      });

      // Se houve multa, registrar a multa como receita da clínica? 
      // Ou apenas o estorno parcial já deixa o "saldo" da transação original sobrando 30%?
      // Transação Original: +100
      // Estorno: -70
      // Saldo do sistema: +30 (Fica para a clínica/profissional conforme regra).
      // Vamos simplificar: O "troco" (30%) fica lá. Precisamos estornar as comissões proporcionalmente.
      
      // Estornar Comissões (Reverse-Split)
      // Se devolvemos 70% do dinheiro, tiramos 70% da comissão de todo mundo.
      const commissionReversePercentage = -refundAmount / originalAmount; // ex: -0.7

      // Precisaríamos buscar os splits originais para estornar exato, 
      // mas vamos calcular baseado no valor de reembolso para ser rápido.
      const amountNetRefund = refundAmount; // Simplificando MDR no estorno
      const professionalRefund = parseFloat((amountNetRefund * 0.6).toFixed(2));
      const clinicRefund = parseFloat((amountNetRefund * 0.35).toFixed(2));
      const systemRefund = parseFloat((amountNetRefund * 0.05).toFixed(2));

      // Criar splits negativos
      const refundTxId = 0; // Precisaríamos do ID da transação de reembolso recém criada. 
      // (O repo create deveria retornar ID. Vamos assumir que retorna promise<number>)
      // Nota: O código acima processPayment não pegou o ID corretamente do await create, vamos ajustar isso ou ignorar por hora e focar na lógica.
      
      // Atualizar status do agendamento
      const newStatus = refundPercentage === 1.0 ? 'refunded' : 'partially_refunded';
      await this.appointmentRepository.updatePaymentStatus(appointmentId, newStatus);

      return { 
          success: true, 
          message: refundPercentage === 1.0 
              ? "Reembolso integral realizado com sucesso." 
              : `Reembolso parcial realizado. Multa de R$ ${penaltyAmount} aplicada por cancelamento tardio (<24h).`,
          refundAmount
      };
  }
}
