import bcrypt from "bcrypt";
import { database } from "./config/database.js";

// As senhas dos usuários no seed são "password"

const SALT_ROUNDS = 10;
const TABLES_TO_CLEAR = [
  "commission_splits",
  "refunds",
  "transactions",
  "monthly_reports",
  "prescriptions",
  "exam_requests",
  "appointments",
  "availabilities",
  "professional_details",
  "exam_catalog",
  "users",
];

type UserSeed = {
  name: string;
  email: string;
  password?: string;
  role: string;
  cpf?: string;
  phone?: string;
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function clearDatabase(): Promise<void> {
  console.log("Clearing existing seed data...");

  await database.run("PRAGMA foreign_keys = OFF");

  for (const table of TABLES_TO_CLEAR) {
    await database.run(`DELETE FROM ${table}`);
    await database.run("DELETE FROM sqlite_sequence WHERE name = ?", [table]);
  }

  await database.run("PRAGMA foreign_keys = ON");
  console.log("✓ Database cleared");
}

type SeededAppointment = {
  id: number;
  date: string;
  professionalEmail: string;
};

type SeededTransaction = {
  id: number;
  payerEmail: string;
  type: string;
  amount: number;
};

async function seedUsers(): Promise<Map<string, number>> {
  console.log("Seeding users...");

  const users: UserSeed[] = [
    {
      name: "Maria Silva",
      email: "maria@email.com",
      role: "patient",
      cpf: "12345678901",
      phone: "11987654321",
    },
    {
      name: "João Santos",
      email: "joao.santos@email.com",
      role: "patient",
      cpf: "98765432100",
      phone: "11912345678",
    },
    {
      name: "Dr. João Cardiologista",
      email: "joao@clinica.com",
      role: "health_professional",
      cpf: "11122233344",
      phone: "1133334444",
    },
    {
      name: "Dra. Ana Psicóloga",
      email: "ana@clinica.com",
      role: "health_professional",
      cpf: "55566677788",
      phone: "1144445555",
    },
    {
      name: "Dr. Carlos Nutricionista",
      email: "carlos@clinica.com",
      role: "health_professional",
      cpf: "99988877766",
      phone: "1155556666",
    },
    {
      name: "Paula Recepcionista",
      email: "paula@clinica.com",
      role: "receptionist",
      cpf: "33344455566",
      phone: "1166667777",
    },
    {
      name: "Roberto Lab Tech",
      email: "roberto@clinica.com",
      role: "lab_tech",
      cpf: "77788899900",
      phone: "1177778888",
    },
    {
      name: "Admin Clínica",
      email: "admin@clinica.com",
      role: "clinic_admin",
      cpf: "00011122233",
      phone: "1188889999",
    },
    {
      name: "System Admin",
      email: "sysadmin@medclinic.com",
      role: "system_admin",
      cpf: "44455566677",
      phone: "1199990000",
    },
  ];

  const insertedUsers = new Map<string, number>();
  const pass = await hashPassword("password");

  for (const user of users) {
    const result = await database.run(
      `INSERT INTO users (name, email, password, role, cpf, phone, clinic_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        user.name,
        user.email,
        pass,
        user.role,
        user.cpf || null,
        user.phone || null,
        1, // Default clinic_id
      ],
    );

    insertedUsers.set(user.email, result.lastID);
  }

  console.log(`✓ ${users.length} users seeded`);
  return insertedUsers;
}

async function seedProfessionalDetails(
  userIds: Map<string, number>,
): Promise<void> {
  console.log("Seeding professional_details...");

  const details = [
    {
      email: "joao@clinica.com",
      specialty: "cardiologia",
      registration_number: "CRM123456/SP",
      council: "Conselho Regional de Medicina de São Paulo",
      consultation_price: 350.0,
      commission_percentage: 60.0,
    },
    {
      email: "ana@clinica.com",
      specialty: "psicologia",
      registration_number: "CRP654321/SP",
      council: "Conselho Regional de Psicologia",
      consultation_price: 180.0,
      commission_percentage: 60.0,
    },
    {
      email: "carlos@clinica.com",
      specialty: "nutricao",
      registration_number: "CRN789012/SP",
      council: "Conselho Regional de Nutricionistas",
      consultation_price: 200.0,
      commission_percentage: 60.0,
    },
  ];

  for (const detail of details) {
    const userId = userIds.get(detail.email);
    if (!userId) continue;

    await database.run(
      `INSERT INTO professional_details
             (user_id, specialty, registration_number, council, consultation_price, commission_percentage, created_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        detail.specialty,
        detail.registration_number,
        detail.council,
        detail.consultation_price,
        detail.commission_percentage,
      ],
    );
  }

  console.log(`✓ ${details.length} professional details seeded`);
}

async function seedAvailabilities(userIds: Map<string, number>): Promise<void> {
  console.log("Seeding availabilities...");

  const availabilities = [
    {
      email: "joao@clinica.com",
      day_of_week: 2,
      start_time: "09:00",
      end_time: "12:00",
    },
    {
      email: "joao@clinica.com",
      day_of_week: 2,
      start_time: "14:00",
      end_time: "18:00",
    },
    {
      email: "joao@clinica.com",
      day_of_week: 4,
      start_time: "09:00",
      end_time: "12:00",
    },
    {
      email: "joao@clinica.com",
      day_of_week: 4,
      start_time: "14:00",
      end_time: "18:00",
    },
    {
      email: "ana@clinica.com",
      day_of_week: 1,
      start_time: "08:00",
      end_time: "12:00",
    },
    {
      email: "ana@clinica.com",
      day_of_week: 3,
      start_time: "08:00",
      end_time: "12:00",
    },
    {
      email: "ana@clinica.com",
      day_of_week: 5,
      start_time: "08:00",
      end_time: "12:00",
    },
    {
      email: "carlos@clinica.com",
      day_of_week: 1,
      start_time: "07:00",
      end_time: "11:00",
    },
    {
      email: "carlos@clinica.com",
      day_of_week: 2,
      start_time: "07:00",
      end_time: "11:00",
    },
    {
      email: "carlos@clinica.com",
      day_of_week: 3,
      start_time: "07:00",
      end_time: "11:00",
    },
    {
      email: "carlos@clinica.com",
      day_of_week: 4,
      start_time: "07:00",
      end_time: "11:00",
    },
    {
      email: "carlos@clinica.com",
      day_of_week: 5,
      start_time: "07:00",
      end_time: "11:00",
    },
  ];

  for (const avail of availabilities) {
    const professionalId = userIds.get(avail.email);
    if (!professionalId) continue;

    await database.run(
      `INSERT INTO availabilities
             (professional_id, day_of_week, start_time, end_time, is_active, created_at)
             VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [professionalId, avail.day_of_week, avail.start_time, avail.end_time],
    );
  }

  console.log(`✓ ${availabilities.length} availabilities seeded`);
}

type AppointmentSeed = {
  patientEmail: string;
  professionalEmail: string;
  date: string;
  time: string;
  type: "presencial" | "online";
  duration: number;
  price: number;
  status: string;
  payment_status: string;
  video_link?: string;
  room_number?: string;
  notes?: string;
  cancellation_reason?: string;
  cancelled_by_email?: string;
};

async function seedAppointments(
  userIds: Map<string, number>,
): Promise<SeededAppointment[]> {
  console.log("Seeding appointments...");

  const appointmentSeeds: AppointmentSeed[] = [
    {
      patientEmail: "maria@email.com",
      professionalEmail: "joao@clinica.com",
      date: "2026-02-12",
      time: "09:30",
      duration: 45,
      type: "presencial",
      price: 350.0,
      status: "scheduled",
      payment_status: "processing",
      room_number: "Sala 1",
      notes: "Primeira consulta cardiologia",
    },
    {
      patientEmail: "joao.santos@email.com",
      professionalEmail: "ana@clinica.com",
      date: "2026-02-13",
      time: "10:00",
      duration: 60,
      type: "online",
      price: 180.0,
      status: "confirmed",
      payment_status: "paid",
      video_link: "https://meet.medclinic.com/ana-joao",
    },
    {
      patientEmail: "maria@email.com",
      professionalEmail: "carlos@clinica.com",
      date: "2026-02-14",
      time: "08:30",
      duration: 30,
      type: "presencial",
      price: 200.0,
      status: "scheduled",
      payment_status: "pending",
      room_number: "Sala 3",
    },
    {
      patientEmail: "joao.santos@email.com",
      professionalEmail: "joao@clinica.com",
      date: "2026-02-15",
      time: "11:00",
      duration: 45,
      type: "online",
      price: 350.0,
      status: "waiting",
      payment_status: "pending",
      video_link: "https://meet.medclinic.com/joao-revisao",
    },
  ];

  const insertedAppointments: {
    id: number;
    date: string;
    professionalEmail: string;
  }[] = [];

  for (const appointment of appointmentSeeds) {
    const patientId = userIds.get(appointment.patientEmail);
    const professionalId = userIds.get(appointment.professionalEmail);
    const cancelledById = appointment.cancelled_by_email
      ? userIds.get(appointment.cancelled_by_email)
      : null;

    if (!patientId || !professionalId) {
      continue;
    }

    const result = await database.run(
      `INSERT INTO appointments
             (patient_id, professional_id, date, time, duration_minutes, type, status, price, payment_status, video_link, room_number, notes, cancellation_reason, cancelled_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        patientId,
        professionalId,
        appointment.date,
        appointment.time,
        appointment.duration,
        appointment.type,
        appointment.status,
        appointment.price,
        appointment.payment_status,
        appointment.video_link || null,
        appointment.room_number || null,
        appointment.notes || null,
        appointment.cancellation_reason || null,
        cancelledById || null,
      ],
    );

    insertedAppointments.push({
      id: result.lastID,
      date: appointment.date,
      professionalEmail: appointment.professionalEmail,
    });
  }

  console.log(`✓ ${insertedAppointments.length} appointments seeded`);
  return insertedAppointments;
}

async function seedExamCatalog(): Promise<Map<string, number>> {
  console.log("Seeding exam_catalog...");

  const exams = [
    {
      name: "Hemograma Completo",
      type: "blood",
      base_price: 80.0,
      description: "Análise completa de células sanguíneas",
    },
    {
      name: "Glicemia em Jejum",
      type: "blood",
      base_price: 35.0,
      description: "Medição de glicose (requer 8h jejum)",
    },
    {
      name: "Colesterol Total e Frações",
      type: "blood",
      base_price: 95.0,
      description: "Perfil lipídico completo",
    },
    {
      name: "TSH e T4 Livre",
      type: "blood",
      base_price: 120.0,
      description: "Avaliação da função tireoidiana",
    },
    {
      name: "Ureia e Creatinina",
      type: "blood",
      base_price: 65.0,
      description: "Avaliação da função renal",
    },
    {
      name: "Raio-X Tórax",
      type: "image",
      base_price: 120.0,
      description: "Radiografia de tórax em PA e perfil",
    },
    {
      name: "Ultrassonografia Abdominal",
      type: "image",
      base_price: 250.0,
      description: "Avaliação de órgãos abdominais",
    },
    {
      name: "Eletrocardiograma",
      type: "image",
      base_price: 150.0,
      description: "Registro da atividade elétrica do coração",
    },
    {
      name: "Ecocardiograma",
      type: "image",
      base_price: 450.0,
      description: "Ultrassom do coração com Doppler",
    },
  ];

  const examCatalogMap = new Map<string, number>();

  for (const exam of exams) {
    const result = await database.run(
      `INSERT INTO exam_catalog (name, type, base_price, description, is_active, created_at)
             VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [exam.name, exam.type, exam.base_price, exam.description],
    );

    examCatalogMap.set(exam.name, result.lastID);
  }

  console.log(`✓ ${exams.length} exam catalog entries seeded`);
  return examCatalogMap;
}

async function seedExamRequests(
  appointments: { id: number; date: string; professionalEmail: string }[],
  userIds: Map<string, number>,
  examCatalog: Map<string, number>,
): Promise<number[]> {
  console.log("Seeding exam_requests...");

  const requests = [
    {
      appointmentRefDate: "2026-02-12",
      examName: "Hemograma Completo",
      requestingEmail: "joao@clinica.com",
      price: 80.0,
      clinical_indication: "Avaliação cardiovascular inicial",
      scheduled_date: "2026-02-16",
      labTechEmail: "roberto@clinica.com",
    },
    {
      appointmentRefDate: "2026-02-13",
      examName: "Ultrassonografia Abdominal",
      requestingEmail: "ana@clinica.com",
      price: 250.0,
      clinical_indication: "Queixas gastrointestinais",
      scheduled_date: "2026-02-17",
      labTechEmail: null,
    },
  ];

  const insertedIds: number[] = [];

  for (const request of requests) {
    const appointment = appointments.find(
      appt => appt.date === request.appointmentRefDate,
    );
    if (!appointment) continue;

    const patientId = userIds.get("maria@email.com");
    const requestingProfessionalId = userIds.get(request.requestingEmail);
    const examCatalogId = examCatalog.get(request.examName);
    const labTechId = request.labTechEmail
      ? userIds.get(request.labTechEmail)
      : null;

    if (!patientId || !requestingProfessionalId || !examCatalogId) {
      continue;
    }

    const result = await database.run(
      `INSERT INTO exam_requests
             (appointment_id, patient_id, requesting_professional_id, exam_catalog_id, clinical_indication, price, status, payment_status, scheduled_date, lab_tech_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'pending_payment', 'pending', ?, ?, CURRENT_TIMESTAMP)`,
      [
        appointment.id,
        patientId,
        requestingProfessionalId,
        examCatalogId,
        request.clinical_indication,
        request.price,
        request.scheduled_date,
        labTechId || null,
      ],
    );

    insertedIds.push(result.lastID);
  }

  console.log(`✓ ${insertedIds.length} exam requests seeded`);
  return insertedIds;
}

async function seedPrescriptions(
  appointments: SeededAppointment[],
  userIds: Map<string, number>,
): Promise<void> {
  console.log("Seeding prescriptions...");

  const prescriptions = [
    {
      appointmentDate: "2026-02-12",
      patientEmail: "maria@email.com",
      professionalEmail: "joao@clinica.com",
      medication_name: "Atorvastatina 20mg",
      dosage: "1 comprimido ao dia",
      instructions: "Tomar à noite com alimento",
    },
    {
      appointmentDate: "2026-02-13",
      patientEmail: "joao.santos@email.com",
      professionalEmail: "ana@clinica.com",
      medication_name: "Sertralina 50mg",
      dosage: "1 comprimido ao dia",
      instructions: "Evitar álcool",
    },
  ];

  for (const prescription of prescriptions) {
    const appointment = appointments.find(
      appt => appt.date === prescription.appointmentDate,
    );
    if (!appointment) continue;

    const patientId = userIds.get(prescription.patientEmail);
    const professionalId = userIds.get(prescription.professionalEmail);

    if (!patientId || !professionalId) continue;

    await database.run(
      `INSERT INTO prescriptions
             (appointment_id, patient_id, professional_id, medication_name, dosage, instructions, is_controlled, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [
        appointment.id,
        patientId,
        professionalId,
        prescription.medication_name,
        prescription.dosage,
        prescription.instructions,
      ],
    );
  }

  console.log(`✓ ${prescriptions.length} prescriptions seeded`);
}

type TransactionSeed = {
  type: "appointment_payment" | "exam_payment";
  referenceId: number;
  referenceType: "appointment" | "exam";
  payerEmail: string;
  amountGross: number;
  status: "processing" | "paid" | "pending";
  payment_method?: string;
};

async function seedTransactions(
  appointments: SeededAppointment[],
  examRequests: number[],
  userIds: Map<string, number>,
): Promise<SeededTransaction[]> {
  console.log("Seeding transactions...");

  const transactionSeeds: TransactionSeed[] = [
    {
      type: "appointment_payment",
      referenceId: appointments[0].id,
      referenceType: "appointment",
      payerEmail: "maria@email.com",
      amountGross: 350.0,
      status: "paid",
      payment_method: "credit_card",
    },
    {
      type: "appointment_payment",
      referenceId: appointments[1].id,
      referenceType: "appointment",
      payerEmail: "joao.santos@email.com",
      amountGross: 180.0,
      status: "paid",
      payment_method: "pix",
    },
    {
      type: "exam_payment",
      referenceId: examRequests[0],
      referenceType: "exam",
      payerEmail: "maria@email.com",
      amountGross: 80.0,
      status: "processing",
      payment_method: "boleto",
    },
  ];

  const insertedTransactions: SeededTransaction[] = [];

  for (const tx of transactionSeeds) {
    const payerId = userIds.get(tx.payerEmail);
    if (!payerId) continue;

    const mdrFee = Number((tx.amountGross * 0.0379).toFixed(2));
    const amountNet = Number((tx.amountGross - mdrFee).toFixed(2));

    const result = await database.run(
      `INSERT INTO transactions
             (type, reference_id, reference_type, payer_id, amount_gross, mdr_fee, amount_net, payment_method, installments, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)`,
      [
        tx.type,
        tx.referenceId,
        tx.referenceType,
        payerId,
        tx.amountGross,
        mdrFee,
        amountNet,
        tx.payment_method || "credit_card",
        tx.status,
      ],
    );

    insertedTransactions.push({
      id: result.lastID,
      payerEmail: tx.payerEmail,
      type: tx.type,
      amount: tx.amountGross,
    });
  }

  console.log(`✓ ${insertedTransactions.length} transactions seeded`);
  return insertedTransactions;
}

async function seedCommissionSplits(
  transactions: SeededTransaction[],
  userIds: Map<string, number>,
): Promise<void> {
  console.log("Seeding commission_splits...");

  for (const transaction of transactions) {
    const professionalEmail =
      transaction.type === "appointment_payment"
        ? "joao@clinica.com"
        : "ana@clinica.com";
    const professionalId = userIds.get(professionalEmail);
    const professionalAmount = Number((transaction.amount * 0.6).toFixed(2));
    const clinicAmount = Number((transaction.amount * 0.35).toFixed(2));
    const systemAmount = Number((transaction.amount * 0.05).toFixed(2));

    if (professionalId) {
      await database.run(
        `INSERT INTO commission_splits (transaction_id, recipient_id, recipient_type, percentage, amount, status, created_at)
                 VALUES (?, ?, 'professional', 60, ?, 'pending', CURRENT_TIMESTAMP)`,
        [transaction.id, professionalId, professionalAmount],
      );
    }

    await database.run(
      `INSERT INTO commission_splits (transaction_id, recipient_id, recipient_type, percentage, amount, status, created_at)
             VALUES (?, NULL, 'clinic', 35, ?, 'pending', CURRENT_TIMESTAMP)`,
      [transaction.id, clinicAmount],
    );

    await database.run(
      `INSERT INTO commission_splits (transaction_id, recipient_id, recipient_type, percentage, amount, status, created_at)
             VALUES (?, NULL, 'system', 5, ?, 'pending', CURRENT_TIMESTAMP)`,
      [transaction.id, systemAmount],
    );
  }

  console.log("✓ commission splits seeded");
}

async function seedRefunds(
  transactions: { id: number }[],
  userIds: Map<string, number>,
): Promise<void> {
  console.log("Seeding refunds...");

  if (transactions.length < 2) {
    console.log("No refunds to seed");
    return;
  }

  const refundAmount = 126.0;
  const requestedBy = userIds.get("joao.santos@email.com");

  if (!requestedBy) return;

  await database.run(
    `INSERT INTO refunds
         (transaction_id, amount_refunded, reason, requested_by, status, created_at)
         VALUES (?, ?, 'Paciente cancelou com 48h de antecedência', ?, 'completed', CURRENT_TIMESTAMP)`,
    [transactions[1].id, refundAmount, requestedBy],
  );

  console.log("✓ refund seeded");
}

async function seedMonthlyReports(userIds: Map<string, number>): Promise<void> {
  console.log("Seeding monthly_reports...");

  const professionalId = userIds.get("joao@clinica.com");

  if (!professionalId) return;

  await database.run(
    `INSERT INTO monthly_reports
         (professional_id, month, year, total_appointments, total_gross_amount, total_net_amount, total_commission, total_deductions, amount_to_receive, payment_status, generated_at)
         VALUES (?, 2, 2026, 4, 1080.0, 1031.43, 648.0, 60.0, 588.0, 'generated', CURRENT_TIMESTAMP)`,
    [professionalId],
  );

  console.log("✓ monthly report seeded");
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("MedClinic: comprehensive seed script");
  console.log("=".repeat(60));

  try {
    await database.initialize();
    await clearDatabase();

    const userIds = await seedUsers();
    await seedProfessionalDetails(userIds);
    await seedAvailabilities(userIds);

    const appointments = await seedAppointments(userIds);
    const examCatalog = await seedExamCatalog();
    const examRequests = await seedExamRequests(
      appointments,
      userIds,
      examCatalog,
    );
    await seedPrescriptions(appointments, userIds);

    const transactions = await seedTransactions(
      appointments,
      examRequests,
      userIds,
    );
    await seedCommissionSplits(transactions, userIds);
    await seedRefunds(transactions, userIds);
    await seedMonthlyReports(userIds);

    console.log("=".repeat(60));
    console.log("✓ Seed completed successfully!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

main();
