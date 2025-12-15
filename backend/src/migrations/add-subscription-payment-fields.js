import { query } from '../config/database.js';

/**
 * Migração para adicionar campos de pagamento na tabela subscriptions
 */
async function addSubscriptionPaymentFields() {
  try {
    console.log('🔄 Adicionando campos de pagamento na tabela subscriptions...');

    // Verificar se os campos já existem antes de adicionar
    const checkColumns = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions'
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);

    // Adicionar campos que não existem
    const columnsToAdd = [
      { name: 'plan_type', type: 'VARCHAR(100)', defaultValue: null },
      { name: 'duration_months', type: 'INTEGER', defaultValue: null },
      { name: 'price', type: 'DECIMAL(10,2)', defaultValue: null },
      { name: 'payment_method', type: 'VARCHAR(50)', defaultValue: 'pix' },
      { name: 'start_date', type: 'TIMESTAMP', defaultValue: null },
      { name: 'end_date', type: 'TIMESTAMP', defaultValue: null },
      { name: 'auto_renew', type: 'BOOLEAN', defaultValue: false }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`   ➕ Adicionando coluna: ${column.name}`);
        
        let alterQuery = `ALTER TABLE subscriptions ADD COLUMN ${column.name} ${column.type}`;
        
        if (column.defaultValue !== null) {
          if (typeof column.defaultValue === 'string') {
            alterQuery += ` DEFAULT '${column.defaultValue}'`;
          } else {
            alterQuery += ` DEFAULT ${column.defaultValue}`;
          }
        }
        
        await query(alterQuery);
        console.log(`   ✅ Coluna ${column.name} adicionada`);
      } else {
        console.log(`   ⏭️  Coluna ${column.name} já existe`);
      }
    }

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  addSubscriptionPaymentFields()
    .then(() => {
      console.log('✅ Migração executada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar migração:', error);
      process.exit(1);
    });
}

export default addSubscriptionPaymentFields;

