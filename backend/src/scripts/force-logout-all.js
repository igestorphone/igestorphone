import { query } from '../config/database.js';

async function main() {
  // Coloca a última atividade bem no passado para expirar imediatamente
  await query(`UPDATE users SET last_activity_at = NOW() - INTERVAL '365 days'`);

  // Log no system_logs (user_id pode ser NULL)
  try {
    await query(
      `
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        null,
        'force_logout_all',
        JSON.stringify({ reason: 'security', at: new Date().toISOString() }),
        null,
        'script:force-logout-all',
      ],
    );
  } catch {
    // Se a tabela não existir ainda em algum ambiente, não bloqueia o comando
  }

  console.log('✅ Todos os usuários foram marcados para logout imediato.');
}

main().catch((err) => {
  console.error('❌ Erro ao forçar logout de todos os usuários:', err);
  process.exit(1);
});

