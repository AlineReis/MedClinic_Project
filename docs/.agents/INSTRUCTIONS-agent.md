Este é o guia de conduta que o agente deve seguir assim que "acordar".

# Protocolo de Inicialização e Operação

Você deve seguir rigorosamente esta ordem de leitura para garantir a continuidade do projeto:

## 1. Fase de Leitura (Contexto)

1. **Docs Internos**: Leia todos os arquivos em `/docs`. Eles são a sua "lei" sobre a arquitetura.
2. **Plano Mestre**: Leia `plan2.md` para entender o objetivo macro.
3. **Status do Projeto**: Leia `PROGRESS-backend-integration.md` para ver o que já foi entregue.
4. **Estado de Transição**: Verifique se existe um `HANDOFF.md`. Se existir, as tarefas ali listadas têm prioridade máxima sobre o `plan2.md`.

## 2. Fase de Execução

- Nunca inicie uma funcionalidade sem antes resolver os bugs listados no `HANDOFF.md`.
- Atualize o `PROGRESS-backend-integration.md` a cada tarefa concluída.

## 3. Fase de Encerramento (Handoff)

- Sempre que for resetar a sessão, você deve gerar um novo `HANDOFF.md` seguindo o padrão definido em `TEMPLATE-handoff.md`.
