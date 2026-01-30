# Próximos Passos para Conectar Frontend e Backend

Com base nos planejamentos existentes, o fluxo a seguir conecta o frontend ao backend enquanto entrega valor incrementalmente:

1. **Infra + Stores**
   - Terminar `apiService`, `authStore` e `uiStore` (em andamento).
   - Garantir `authStore` inicialize a sessão via `GET /auth/profile` e que toasts do `uiStore` exibam erros.

2. **Login e Persistência de Sessão**
   - Converter `pages/login.html` para usar o form TypeScript, chamando `POST /auth/login` + `apiService`.
   - Em sucesso, salvar `session` no `authStore` e redirecionar para `index.html`; em erro, exibir toast com `error.message`.

3. **Página Principal (index + patient dashboard)**
   - Usar `authStore` para obter `patient_id` e carregar `GET /appointments?patient_id`, `GET /exams?patient_id`, `GET /prescriptions?patient_id`.
   - Criar componentes simples para cards de agendamentos e listas de exames.

4. **Galeria de Profissionais e Slots**
   - Consumir `GET /professionals` + filtros (specialty,nome) e `GET /professionals/:id/availability`.
   - Antes de criar agendamento, aplicar validações locais (RN-01 a RN-05) e chamar `POST /appointments`.

5. **Pagamentos / CloudWalk mock**
   - Mostrar o objeto `payment_required` do backend e fornecer retry para `status: failed/pending`.

6. **Revisão e Feedback contínuo**
   - Validar cada fluxo com testes manuais.
   - Atualizar `docs/planejamento-paginas-criticas.md` quando a implementação avançar.

Esse roadmap permite avançar aos poucos e manter o backend como fonte de verdade, seguindo as boas práticas RALPH antes de adicionar complexidade extra.
