
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

export const getAppointmentEmailHtml = (props: AppointmentEmailProps): string => {
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Agendamento - MediLux</title>
  <style>
    body { mso-line-height-rule: exactly; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; margin: 0; padding: 0; width: 100% !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; }
    .btn { text-decoration: none; display: inline-block; font-weight: bold; border-radius: 8px; padding: 12px 24px; transition: all 0.2s; }
    .btn-primary { background-color: ${primaryColor}; color: white; border: 1px solid ${primaryColor}; }
    .btn-outline { background-color: transparent; color: ${textGray}; border: 1px solid #CBD5E1; }
    @media only screen and (max-width: 600px) {
      .container { padding: 20px !important; }
      .actions { display: flex; flex-direction: column; gap: 10px; }
      .btn { width: 100%; text-align: center; box-sizing: border-box; }
    }
  </style>
</head>
<body style="background-color: ${bgLight}; margin: 0; padding: 40px 0;">
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: ${white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
    
    <!-- Header -->
    <tr>
      <td style="padding: 32px 40px; border-bottom: 1px solid #E2E8F0;">
        <table width="100%">
          <tr>
            <td>
              <h2 style="margin: 0; color: ${primaryColor}; font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 28px;">✚</span> MediLux
              </h2>
              <p style="margin: 4px 0 0; color: ${textGray}; font-size: 12px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Gestão Premium</p>
            </td>
            <td style="text-align: right;">
              <span style="background-color: #DBEAFE; color: ${primaryColor}; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;">Agendamento Confirmado</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 40px;" class="container">
        <h1 style="margin: 0 0 16px; color: ${secondaryColor}; font-size: 24px;">Olá, ${patientName}</h1>
        <p style="margin: 0 0 32px; color: ${textGray}; font-size: 16px;">Sua consulta foi agendada com sucesso. Abaixo estão os detalhes do seu atendimento.</p>

        <!-- Appointment Card -->
        <table width="100%" style="background-color: #F8FAFC; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <tr>
            <td width="50%" style="padding-bottom: 16px;">
              <p style="margin: 0; color: #94A3B8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Profissional</p>
              <p style="margin: 4px 0 0; color: ${secondaryColor}; font-weight: 600; font-size: 16px;">${doctorName}</p>
            </td>
            <td width="50%" style="padding-bottom: 16px;">
              <p style="margin: 0; color: #94A3B8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Especialidade</p>
              <p style="margin: 4px 0 0; color: ${secondaryColor}; font-weight: 600; font-size: 16px;">Geral</p> <!-- TODO: Passar especialidade -->
            </td>
          </tr>
          <tr>
            <td width="50%">
              <p style="margin: 0; color: #94A3B8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Data & Hora</p>
              <p style="margin: 4px 0 0; color: ${secondaryColor}; font-weight: 600; font-size: 16px;">
                 📅 ${date}<br>
                 ⏰ ${time}
              </p>
            </td>
            <td width="50%" style="vertical-align: top;">
              <p style="margin: 0; color: #94A3B8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Modalidade</p>
              <p style="margin: 4px 0 0; color: ${secondaryColor}; font-weight: 600; font-size: 16px;">${type === 'presencial' ? '🏥 Presencial' : '📹 Online'}</p>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 24px; color: ${textGray}; font-size: 14px; line-height: 1.6;">
          Recomendamos chegar com <strong>15 minutos</strong> de antecedência. Caso precise reagendar, utilize o botão abaixo ou entre em contato conosco.
        </p>

        <!-- Actions -->
        <table width="100%">
          <tr>
            <td class="actions" style="padding-top: 8px; gap: 16px;">
              <a href="${confirmLink || '#'}" class="btn btn-primary" style="color: #ffffff;">Confirmar Presença</a>
              <span style="display: inline-block; width: 12px;"></span>
              <a href="${cancelLink || '#'}" class="btn btn-outline">Gerenciar Consulta</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAFC; padding: 24px 40px; border-top: 1px solid #E2E8F0; text-align: center;">
        <p style="margin: 0 0 8px; color: ${textGray}; font-size: 14px; font-weight: 600;">MediLux Clínica</p>
        <p style="margin: 0; color: #94A3B8; font-size: 12px;">
          Av. Paulista, 1000 - Cerqueira César, São Paulo - SP<br>
          (11) 99999-9999 • contato@medilux.com.br
        </p>
        <div style="margin-top: 16px;">
           <!-- Social Icons Mock -->
           <span style="color: #CBD5E1; font-size: 20px;">•</span>
        </div>
      </td>
    </tr>
  </table>
  
  <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
    <p>© ${new Date().getFullYear()} MediLux. Todos os direitos reservados.</p>
  </div>

</body>
</html>
  `;
};
