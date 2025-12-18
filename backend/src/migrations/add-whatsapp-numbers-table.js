import { query } from '../config/database.js'

/**
 * Migration: Criar tabela para números de WhatsApp dos fornecedores
 * Permite múltiplos números por fornecedor (para comunidades)
 * Com campo is_primary para identificar o número principal
 */
export const up = async () => {
  console.log('🔄 Criando tabela supplier_whatsapp_numbers...')
  
  // Criar tabela de números de WhatsApp
  await query(`
    CREATE TABLE IF NOT EXISTS supplier_whatsapp_numbers (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      phone_number VARCHAR(30) NOT NULL,
      is_primary BOOLEAN DEFAULT false,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(supplier_id, phone_number)
    )
  `)
  
  // Criar índice para busca rápida
  await query(`
    CREATE INDEX IF NOT EXISTS idx_supplier_whatsapp_phone 
    ON supplier_whatsapp_numbers(phone_number)
  `)
  
  // Criar índice para busca por fornecedor
  await query(`
    CREATE INDEX IF NOT EXISTS idx_supplier_whatsapp_supplier 
    ON supplier_whatsapp_numbers(supplier_id)
  `)
  
  // Migrar números existentes da tabela suppliers
  console.log('🔄 Migrando números existentes...')
  const suppliers = await query(`
    SELECT id, whatsapp, contact_phone 
    FROM suppliers 
    WHERE (whatsapp IS NOT NULL AND whatsapp != '') 
       OR (contact_phone IS NOT NULL AND contact_phone != '')
  `)
  
  for (const supplier of suppliers.rows) {
    const numbers = []
    
    if (supplier.whatsapp) {
      numbers.push({ number: supplier.whatsapp, isPrimary: true })
    }
    if (supplier.contact_phone && supplier.contact_phone !== supplier.whatsapp) {
      numbers.push({ number: supplier.contact_phone, isPrimary: false })
    }
    
    for (let i = 0; i < numbers.length; i++) {
      const { number, isPrimary } = numbers[i]
      try {
        await query(`
          INSERT INTO supplier_whatsapp_numbers (supplier_id, phone_number, is_primary)
          VALUES ($1, $2, $3)
          ON CONFLICT (supplier_id, phone_number) DO NOTHING
        `, [supplier.id, number, isPrimary && i === 0])
      } catch (error) {
        console.error(`Erro ao migrar número ${number} do fornecedor ${supplier.id}:`, error.message)
      }
    }
  }
  
  // Criar trigger para atualizar updated_at
  await query(`
    DROP TRIGGER IF EXISTS update_supplier_whatsapp_numbers_updated_at ON supplier_whatsapp_numbers
  `)
  await query(`
    CREATE TRIGGER update_supplier_whatsapp_numbers_updated_at
    BEFORE UPDATE ON supplier_whatsapp_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()
  `)
  
  console.log('✅ Tabela supplier_whatsapp_numbers criada e dados migrados')
}

export const down = async () => {
  console.log('🔄 Revertendo criação da tabela supplier_whatsapp_numbers...')
  await query(`DROP TRIGGER IF EXISTS update_supplier_whatsapp_numbers_updated_at ON supplier_whatsapp_numbers`)
  await query(`DROP INDEX IF EXISTS idx_supplier_whatsapp_supplier`)
  await query(`DROP INDEX IF EXISTS idx_supplier_whatsapp_phone`)
  await query(`DROP TABLE IF EXISTS supplier_whatsapp_numbers`)
  console.log('✅ Tabela supplier_whatsapp_numbers removida')
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('add-whatsapp-numbers-table')) {
  up()
    .then(() => {
      console.log('✅ Migração executada com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro ao executar migração:', error)
      process.exit(1)
    })
}

