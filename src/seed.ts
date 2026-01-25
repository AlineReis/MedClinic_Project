import { database } from './config/database.js';
import bcrypt from 'bcrypt';

/**
 * Seed Script - Popula o banco de dados com dados iniciais
 * Baseado na especificacao MedclinicDB_Implementacao.pdf
 */

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function seedUsers(): Promise<void> {
    console.log('Seeding users...');

    const users = [
        // Pacientes
        {
            name: 'Maria Silva',
            email: 'maria@email.com',
            password: await hashPassword('senha123'),
            role: 'patient',
            cpf: '12345678901',
            phone: '11987654321'
        },
        {
            name: 'João Santos',
            email: 'joao.santos@email.com',
            password: await hashPassword('senha123'),
            role: 'patient',
            cpf: '98765432100',
            phone: '11912345678'
        },
        // Profissionais de Saúde
        {
            name: 'Dr. João Cardiologista',
            email: 'joao@clinica.com',
            password: await hashPassword('medico123'),
            role: 'health_professional',
            cpf: '11122233344',
            phone: '1133334444'
        },
        {
            name: 'Dra. Ana Psicóloga',
            email: 'ana@clinica.com',
            password: await hashPassword('medico123'),
            role: 'health_professional',
            cpf: '55566677788',
            phone: '1144445555'
        },
        {
            name: 'Dr. Carlos Nutricionista',
            email: 'carlos@clinica.com',
            password: await hashPassword('medico123'),
            role: 'health_professional',
            cpf: '99988877766',
            phone: '1155556666'
        },
        // Recepcionista
        {
            name: 'Paula Recepcionista',
            email: 'paula@clinica.com',
            password: await hashPassword('recepcao123'),
            role: 'receptionist',
            cpf: '33344455566',
            phone: '1166667777'
        },
        // Técnico de Laboratório
        {
            name: 'Roberto Lab Tech',
            email: 'roberto@clinica.com',
            password: await hashPassword('labtech123'),
            role: 'lab_tech',
            cpf: '77788899900',
            phone: '1177778888'
        },
        // Admin da Clínica
        {
            name: 'Admin Clínica',
            email: 'admin@clinica.com',
            password: await hashPassword('admin123'),
            role: 'clinic_admin',
            cpf: '00011122233',
            phone: '1188889999'
        },
        // Admin do Sistema
        {
            name: 'System Admin',
            email: 'sysadmin@medclinic.com',
            password: await hashPassword('sysadmin123'),
            role: 'system_admin',
            cpf: '44455566677',
            phone: '1199990000'
        }
    ];

    for (const user of users) {
        await database.run(
            `INSERT INTO users (name, email, password, role, cpf, phone, created_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [user.name, user.email, user.password, user.role, user.cpf, user.phone]
        );
    }

    console.log(`✓ ${users.length} users seeded`);
}

async function seedProfessionalDetails(): Promise<void> {
    console.log('Seeding professional_details...');

    const professionals = [
        {
            user_id: 3, // Dr. João Cardiologista
            specialty: 'cardiologia',
            registration_number: 'CRM123456/SP',
            council: 'Conselho Regional de Medicina de São Paulo',
            consultation_price: 350.00,
            commission_percentage: 60.00
        },
        {
            user_id: 4, // Dra. Ana Psicóloga
            specialty: 'psicologia',
            registration_number: 'CRP654321/SP',
            council: 'Conselho Regional de Psicologia',
            consultation_price: 180.00,
            commission_percentage: 60.00
        },
        {
            user_id: 5, // Dr. Carlos Nutricionista
            specialty: 'nutricao',
            registration_number: 'CRN789012/SP',
            council: 'Conselho Regional de Nutricionistas',
            consultation_price: 200.00,
            commission_percentage: 60.00
        }
    ];

    for (const prof of professionals) {
        await database.run(
            `INSERT INTO professional_details
             (user_id, specialty, registration_number, council, consultation_price, commission_percentage, created_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [prof.user_id, prof.specialty, prof.registration_number, prof.council, prof.consultation_price, prof.commission_percentage]
        );
    }

    console.log(`✓ ${professionals.length} professional details seeded`);
}

async function seedAvailabilities(): Promise<void> {
    console.log('Seeding availabilities...');

    const availabilities = [
        // Dr. João - Terça e Quinta
        { professional_id: 3, day_of_week: 2, start_time: '09:00', end_time: '12:00', is_active: 1 },
        { professional_id: 3, day_of_week: 2, start_time: '14:00', end_time: '18:00', is_active: 1 },
        { professional_id: 3, day_of_week: 4, start_time: '09:00', end_time: '12:00', is_active: 1 },
        { professional_id: 3, day_of_week: 4, start_time: '14:00', end_time: '18:00', is_active: 1 },
        // Dra. Ana - Segunda, Quarta e Sexta
        { professional_id: 4, day_of_week: 1, start_time: '08:00', end_time: '12:00', is_active: 1 },
        { professional_id: 4, day_of_week: 3, start_time: '08:00', end_time: '12:00', is_active: 1 },
        { professional_id: 4, day_of_week: 5, start_time: '08:00', end_time: '12:00', is_active: 1 },
        // Dr. Carlos - Segunda a Sexta (manhã)
        { professional_id: 5, day_of_week: 1, start_time: '07:00', end_time: '11:00', is_active: 1 },
        { professional_id: 5, day_of_week: 2, start_time: '07:00', end_time: '11:00', is_active: 1 },
        { professional_id: 5, day_of_week: 3, start_time: '07:00', end_time: '11:00', is_active: 1 },
        { professional_id: 5, day_of_week: 4, start_time: '07:00', end_time: '11:00', is_active: 1 },
        { professional_id: 5, day_of_week: 5, start_time: '07:00', end_time: '11:00', is_active: 1 },
    ];

    for (const avail of availabilities) {
        await database.run(
            `INSERT INTO availabilities
             (professional_id, day_of_week, start_time, end_time, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [avail.professional_id, avail.day_of_week, avail.start_time, avail.end_time, avail.is_active]
        );
    }

    console.log(`✓ ${availabilities.length} availabilities seeded`);
}

async function seedExamCatalog(): Promise<void> {
    console.log('Seeding exam_catalog...');

    const exams = [
        // Exames de sangue
        { name: 'Hemograma Completo', type: 'blood', base_price: 80.00, description: 'Análise completa de células sanguíneas' },
        { name: 'Glicemia em Jejum', type: 'blood', base_price: 35.00, description: 'Medição de glicose (requer 8h jejum)' },
        { name: 'Colesterol Total e Frações', type: 'blood', base_price: 95.00, description: 'Perfil lipídico completo' },
        { name: 'TSH e T4 Livre', type: 'blood', base_price: 120.00, description: 'Avaliação da função tireoidiana' },
        { name: 'Ureia e Creatinina', type: 'blood', base_price: 65.00, description: 'Avaliação da função renal' },
        // Exames de imagem
        { name: 'Raio-X Tórax', type: 'image', base_price: 120.00, description: 'Radiografia de tórax em PA e perfil' },
        { name: 'Ultrassonografia Abdominal', type: 'image', base_price: 250.00, description: 'Avaliação de órgãos abdominais' },
        { name: 'Eletrocardiograma', type: 'image', base_price: 150.00, description: 'Registro da atividade elétrica do coração' },
        { name: 'Ecocardiograma', type: 'image', base_price: 450.00, description: 'Ultrassom do coração com Doppler' },
    ];

    for (const exam of exams) {
        await database.run(
            `INSERT INTO exam_catalog (name, type, base_price, description, is_active, created_at)
             VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [exam.name, exam.type, exam.base_price, exam.description]
        );
    }

    console.log(`✓ ${exams.length} exams seeded`);
}

async function main(): Promise<void> {
    console.log('='.repeat(50));
    console.log('MedClinic Database Seed');
    console.log('='.repeat(50));

    try {
        // Inicializar banco de dados (cria tabelas se não existirem)
        await database.initialize();

        // Popular com dados iniciais
        await seedUsers();
        await seedProfessionalDetails();
        await seedAvailabilities();
        await seedExamCatalog();

        console.log('='.repeat(50));
        console.log('✓ Seed completed successfully!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('Error during seed:', error);
        process.exit(1);
    } finally {
        await database.close();
    }
}

main();
