interface AppointmentEmailProps {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  cancelLink?: string;
  confirmLink?: string;
}

// Função simples para escapar caracteres HTML e previnir XSS
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const getAppointmentEmailHtml = (
  props: AppointmentEmailProps,
): string => {
  // Sanitizando inputs para evitar injeção de HTML/Scripts
  const patientName = escapeHtml(props.patientName);
  const doctorName = escapeHtml(props.doctorName);
  const date = escapeHtml(props.date);
  const time = escapeHtml(props.time);
  const type = escapeHtml(props.type);

  // Links geralmente não devem ser escapados inteiramente se contiverem parâmetros complexos,
  // mas aqui vamos assumir que são URLs seguras geradas pelo backend.
  // Se forem input de usuário, devem ser validados antes.
  const cancelLink = props.cancelLink;
  const confirmLink = props.confirmLink;

  // Colors based on MediLux dashboard
  const primaryColor = "#3B82F6";
  const secondaryColor = "#1E293B";
  const textGray = "#64748B";
  const bgLight = "#F1F5F9";
  const white = "#FFFFFF";

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { mso-line-height-rule: exactly; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; margin: 0; padding: 0; width: 100% !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; }
    .btn { text-decoration: none; display: inline-block; font-weight: bold; border-radius: 8px; padding: 12px 24px; transition: all 0.2s; }
    .btn-primary { background-color: ${primaryColor}; color: white; border: 1px solid ${primaryColor}; }
    .btn-outline { background-color: transparent; color: ${textGray}; border: 1px solid #CBD5E1; }
  </style>
</head>
<body style="background-color: ${bgLight}; margin: 0; padding: 40px 0;">
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: ${white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 40px; border-bottom: 1px solid #E2E8F0;">
        <h2 style="margin: 0; color: ${primaryColor}; font-size: 24px; font-weight: 700;">✚ MediLux</h2>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="margin: 0 0 16px; color: ${secondaryColor}; font-size: 24px;">Olá, ${patientName}</h1>
        <p style="margin: 0 0 32px; color: ${textGray}; font-size: 16px;">Sua consulta foi agendada com sucesso.</p>

        <!-- Appointment Card -->
        <table width="100%" style="background-color: #F8FAFC; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <tr>
            <td>
              <p style="color: ${textGray}; font-size: 12px; font-weight: 600;">PROFISSIONAL</p>
              <p style="color: ${secondaryColor}; font-weight: 600;">${doctorName}</p>
            </td>
            <td>
              <p style="color: ${textGray}; font-size: 12px; font-weight: 600;">DATA E HORA</p>
              <p style="color: ${secondaryColor}; font-weight: 600;">${date} às ${time}</p>
            </td>
          </tr>
        </table>

        <!-- Actions -->
        <a href="${confirmLink || "#"}" class="btn btn-primary" style="color: white">Confirmar</a>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const getPasswordResetEmailHtml = (
  name: string,
  resetLink: string,
): string => {
  const safeName = escapeHtml(name);
  const primaryColor = "#EF4444"; // Red for security actions

  return `
<!DOCTYPE html>
<html>
<body style="background-color: #F1F5F9; margin: 0; padding: 40px 0; font-family: sans-serif;">
  <table width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px;">
    <tr>
      <td>
        <h2 style="color: ${primaryColor};">Recuperação de Senha</h2>
        <p>Olá, ${safeName}.</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Se não foi você, ignore este email.</p>
        <a href="${resetLink}" style="background-color: ${primaryColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">Redefinir Senha</a>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const getVerificationCodeEmailHtml = (code: string): string => {
  const primaryColor = "#3B82F6";

  return `
<!DOCTYPE html>
<html>
<body style="background-color: #F1F5F9; margin: 0; padding: 40px 0; font-family: sans-serif;">
  <table width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; text-align: center;">
    <tr>
      <td>
        <h2 style="color: ${primaryColor};">Seu Código de Verificação</h2>
        <p>Use o código abaixo para completar sua ação:</p>
        <div style="background-color: #EFF6FF; color: ${primaryColor}; font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 24px; border-radius: 12px; margin: 24px 0;">
          ${code}
        </div>
        <p style="color: #64748B; font-size: 14px;">Este código expira em 10 minutos.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const getWelcomeEmailHtml = (
  name: string,
  role: string,
  password: string,
): string => {
  const safeName = escapeHtml(name);
  const primaryColor = "#3B82F6";

  const roleDisplay: Record<string, string> = {
    patient: "Paciente",
    health_professional: "Profissional de Saúde",
    receptionist: "Recepcionista",
    lab_tech: "Técnico de Laboratório",
    clinic_admin: "Administrador",
    system_admin: "Admin Sistema",
  };
  const roleLabel = roleDisplay[role] || role;

  return `
<!DOCTYPE html>
<html>
<body style="background-color: #F8FAFC; margin: 0; padding: 40px 0; font-family: 'Segoe UI', sans-serif;">
  <table width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <tr>
      <td style="text-align: center; padding-bottom: 24px;">
        <h2 style="color: ${primaryColor}; margin: 0;">Bem-vindo(a) à MediLux</h2>
      </td>
    </tr>
    <tr>
      <td style="color: #334155; font-size: 16px; line-height: 1.6;">
        <p>Olá, <strong>${safeName}</strong>!</p>
        <p>Seu cadastro foi realizado com sucesso como <strong>${roleLabel}</strong>.</p>
        <p>Abaixo estão suas credenciais de acesso temporário:</p>
        
        <div style="background-color: #EFF6FF; border-left: 4px solid ${primaryColor}; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #64748B;">Sua senha temporária:</p>
          <div style="font-family: monospace; font-size: 24px; font-weight: bold; color: #1E293B; letter-spacing: 1px;">
            ${password}
          </div>
        </div>

        <p style="font-size: 14px; color: #64748B;">Recomendamos alterar sua senha após o primeiro acesso.</p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 32px; border-top: 1px solid #E2E8F0; margin-top: 32px;">
        <a href="http://localhost:8081/login.html" style="background-color: ${primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Acessar Sistema</a>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
