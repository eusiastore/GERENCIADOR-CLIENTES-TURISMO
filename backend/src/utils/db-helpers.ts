export async function registrarHistoricoViagem(
  db: D1Database,
  viagemId: number,
  passageiroNome: string | null,
  acao: string,
  detalhes: string | null
): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO historico_viagem (viagem_id, passageiro_nome, acao, detalhes) VALUES (?, ?, ?, ?)`
    ).bind(
      Number(viagemId),
      passageiroNome ? passageiroNome.toUpperCase().trim() : 'SISTEMA',
      acao,
      detalhes
    ).run();
  } catch (error) {
    console.error('Erro ao registrar histórico de viagem:', error);
  }
}
