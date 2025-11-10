import { query } from './config/database.js';
import bcrypt from 'bcryptjs';

console.log('🌱 Populando banco com dados de exemplo...');

const populateDatabase = async () => {
  try {
    // Adicionar colunas faltantes se não existirem
    console.log('📝 Verificando e adicionando colunas faltantes...');
    
    // Adicionar coluna whatsapp em suppliers
    try {
      await query('ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20)');
      console.log('   ✅ Coluna whatsapp adicionada em suppliers');
    } catch (error) {
      console.log('   ⚠️  Coluna whatsapp já existe ou erro:', error.message);
    }

    // Adicionar coluna region em products
    try {
      await query('ALTER TABLE products ADD COLUMN IF NOT EXISTS region VARCHAR(50)');
      console.log('   ✅ Coluna region adicionada em products');
    } catch (error) {
      console.log('   ⚠️  Coluna region já existe ou erro:', error.message);
    }

    // Adicionar coluna is_active em products se não existir
    try {
      await query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');
      console.log('   ✅ Coluna is_active adicionada em products');
    } catch (error) {
      console.log('   ⚠️  Coluna is_active já existe ou erro:', error.message);
    }

    // Criar fornecedores com WhatsApp
    const fornecedores = [
      { name: 'WEE SHOP 9998', whatsapp: '5511999999998', phone: '(11) 99999-9998', email: 'contato@weeshop9998.com', active: true },
      { name: 'LOJA 31 0181', whatsapp: '5511999999999', phone: '(11) 99999-9999', email: 'contato@loja310181.com', active: true },
      { name: 'MUNDO DO IPHONE 5805 ORIENTAL', whatsapp: '5511999999997', phone: '(11) 99999-9997', email: 'contato@mundodoiphone.com', active: true },
      { name: 'PRO PHONE 8077 SHOPPING ORIENTAL', whatsapp: '5511999999996', phone: '(11) 99999-9996', email: 'contato@prophone.com', active: true },
      { name: 'iStore Premium SP', whatsapp: '5511999999995', phone: '(11) 99999-9995', email: 'contato@istorepremium.com', active: true },
      { name: 'TechStore Brasil', whatsapp: '5511999999994', phone: '(11) 99999-9994', email: 'vendas@techstore.com.br', active: true },
      { name: 'Apple Store Oficial', whatsapp: '5511999999993', phone: '(11) 99999-9993', email: 'contato@applestore.com', active: true },
    ];

    console.log('📦 Criando fornecedores...');
    const supplierIds = [];

    for (const fornecedor of fornecedores) {
      // Verificar se já existe
      const existing = await query('SELECT id FROM suppliers WHERE name = $1', [fornecedor.name]);
      
      if (existing.rows.length === 0) {
        const result = await query(
          `INSERT INTO suppliers (name, contact_email, contact_phone, whatsapp, is_active)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [fornecedor.name, fornecedor.email, fornecedor.phone, fornecedor.whatsapp, fornecedor.active]
        );
        supplierIds.push(result.rows[0].id);
        console.log(`   ✅ ${fornecedor.name} criado`);
      } else {
        supplierIds.push(existing.rows[0].id);
        // Atualizar WhatsApp se não tiver
        await query('UPDATE suppliers SET whatsapp = $1 WHERE id = $2 AND (whatsapp IS NULL OR whatsapp = \'\')', [fornecedor.whatsapp, existing.rows[0].id]);
        console.log(`   ⏭️  ${fornecedor.name} já existe`);
      }
    }

    // Buscar todos os fornecedores (criados ou existentes)
    const allSuppliers = await query('SELECT id FROM suppliers WHERE is_active = true LIMIT 10');
    const allSupplierIds = allSuppliers.rows.map(row => row.id);

    // Criar produtos variados
    const produtos = [
      // iPhone 17 Pro Max
      { name: 'iPhone 17 Pro Max', model: 'iPhone 17 Pro Max', color: 'Deep Blue', storage: '256GB', condition: 'Novo', price: 8829.00, region: '1ª LINHA' },
      { name: 'iPhone 17 Pro Max', model: 'iPhone 17 Pro Max', color: 'Silver', storage: '256GB', condition: 'Novo', price: 8850.00, region: '1ª LINHA' },
      { name: 'iPhone 17 Pro Max', model: 'iPhone 17 Pro Max', color: 'Deep Blue', storage: '512GB', condition: 'Novo', price: 10200.00, region: 'ORIGINAL' },
      
      // iPhone 16 Pro Max
      { name: 'iPhone 16 Pro Max', model: 'iPhone 16 Pro Max', color: 'Natural Titanium', storage: '256GB', condition: 'Novo', price: 8200.00, region: '1ª LINHA' },
      { name: 'iPhone 16 Pro Max', model: 'iPhone 16 Pro Max', color: 'Blue Titanium', storage: '256GB', condition: 'Novo', price: 8250.00, region: 'COPY' },
      { name: 'iPhone 16 Pro Max', model: 'iPhone 16 Pro Max', color: 'White Titanium', storage: '512GB', condition: 'Novo', price: 9500.00, region: 'ORIGINAL' },
      
      // iPhone 15 Pro Max
      { name: 'iPhone 15 Pro Max', model: 'iPhone 15 Pro Max', color: 'Natural Titanium', storage: '256GB', condition: 'Novo', price: 7500.00, region: '1ª LINHA' },
      { name: 'iPhone 15 Pro Max', model: 'iPhone 15 Pro Max', color: 'Blue Titanium', storage: '256GB', condition: 'Novo', price: 7600.00, region: 'COPY' },
      { name: 'iPhone 15 Pro Max', model: 'iPhone 15 Pro Max', color: 'Natural Titanium', storage: '512GB', condition: 'Novo', price: 8800.00, region: 'ORIGINAL' },
      { name: 'iPhone 15 Pro Max', model: 'iPhone 15 Pro Max', color: 'Blue Titanium', storage: '128GB', condition: 'Seminovo', price: 6800.00, region: 'CHIP VIRTUAL' },
      
      // iPhone 15 Pro
      { name: 'iPhone 15 Pro', model: 'iPhone 15 Pro', color: 'Natural Titanium', storage: '128GB', condition: 'Novo', price: 6800.00, region: '1ª LINHA' },
      { name: 'iPhone 15 Pro', model: 'iPhone 15 Pro', color: 'Blue Titanium', storage: '256GB', condition: 'Novo', price: 7200.00, region: 'COPY' },
      { name: 'iPhone 15 Pro', model: 'iPhone 15 Pro', color: 'White Titanium', storage: '256GB', condition: 'Novo', price: 7300.00, region: 'ORIGINAL' },
      
      // iPhone 15
      { name: 'iPhone 15', model: 'iPhone 15', color: 'Pink', storage: '128GB', condition: 'Novo', price: 5800.00, region: '1ª LINHA' },
      { name: 'iPhone 15', model: 'iPhone 15', color: 'Blue', storage: '256GB', condition: 'Novo', price: 6500.00, region: 'COPY' },
      { name: 'iPhone 15', model: 'iPhone 15', color: 'Black', storage: '128GB', condition: 'Seminovo', price: 5200.00, region: 'CHIP VIRTUAL' },
      
      // iPhone 14 Pro Max
      { name: 'iPhone 14 Pro Max', model: 'iPhone 14 Pro Max', color: 'Deep Purple', storage: '256GB', condition: 'Novo', price: 6500.00, region: '1ª LINHA' },
      { name: 'iPhone 14 Pro Max', model: 'iPhone 14 Pro Max', color: 'Gold', storage: '512GB', condition: 'Novo', price: 7800.00, region: 'ORIGINAL' },
      { name: 'iPhone 14 Pro Max', model: 'iPhone 14 Pro Max', color: 'Space Black', storage: '128GB', condition: 'Seminovo', price: 5500.00, region: 'CHIP VIRTUAL' },
      
      // iPhone 14
      { name: 'iPhone 14', model: 'iPhone 14', color: 'Blue', storage: '128GB', condition: 'Novo', price: 4800.00, region: '1ª LINHA' },
      { name: 'iPhone 14', model: 'iPhone 14', color: 'Purple', storage: '256GB', condition: 'Novo', price: 5500.00, region: 'COPY' },
      
      // iPhone 13
      { name: 'iPhone 13', model: 'iPhone 13', color: 'Pink', storage: '128GB', condition: 'Novo', price: 4200.00, region: '1ª LINHA' },
      { name: 'iPhone 13', model: 'iPhone 13', color: 'Blue', storage: '256GB', condition: 'Seminovo', price: 3800.00, region: 'CHIP VIRTUAL' },
      
      // iPhone 12
      { name: 'iPhone 12', model: 'iPhone 12', color: 'Black', storage: '64GB', condition: 'Seminovo', price: 3200.00, region: 'CHIP VIRTUAL' },
      { name: 'iPhone 12', model: 'iPhone 12', color: 'White', storage: '128GB', condition: 'Seminovo', price: 3500.00, region: 'COPY' },
      
      // Acessórios ACSS
      { name: 'CABO USB-C', model: 'CABO USB-C', color: 'N/A', storage: 'N/A', condition: 'Novo', price: 25.00, region: '1ª LINHA', category: 'ACSS' },
      { name: 'FONTE USB-C 20W', model: 'FONTE USB-C 20W', color: 'N/A', storage: 'N/A', condition: 'Novo', price: 40.00, region: '1ª LINHA', category: 'ACSS' },
      { name: 'FONTE USB-C 20W', model: 'FONTE USB-C 20W', color: 'N/A', storage: 'N/A', condition: 'Novo', price: 50.00, region: 'COPY', category: 'ACSS' },
      { name: 'FONTE USB-C 20W', model: 'FONTE USB-C 20W', color: 'N/A', storage: 'N/A', condition: 'Novo', price: 100.00, region: 'ORIGINAL', category: 'ACSS' },
    ];

    console.log('📱 Criando produtos...');
    let produtosCriados = 0;
    let produtosAtualizados = 0;

    for (const produto of produtos) {
      // Distribuir produtos entre fornecedores aleatoriamente
      const supplierId = allSupplierIds[Math.floor(Math.random() * allSupplierIds.length)];
      
      // Verificar se já existe produto similar
      const existing = await query(
        `SELECT id FROM products 
         WHERE supplier_id = $1 AND model = $2 AND color = $3 AND storage = $4 AND condition = $5 
         LIMIT 1`,
        [supplierId, produto.model, produto.color, produto.storage, produto.condition]
      );

      if (existing.rows.length === 0) {
        const stock = Math.floor(Math.random() * 20) + 5; // 5-25 unidades
        const result = await query(
          `INSERT INTO products (supplier_id, name, model, color, storage, condition, price, stock_quantity, region, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [supplierId, produto.name, produto.model, produto.color, produto.storage, produto.condition, produto.price, stock, produto.region || 'N/A', true]
        );
        const productId = result.rows[0].id;

        // Criar entrada no histórico de preços
        await query(
          `INSERT INTO price_history (product_id, supplier_id, price, recorded_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [productId, supplierId, produto.price]
        );

        produtosCriados++;
      } else {
        // Atualizar preço se existir
        await query(
          'UPDATE products SET price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [produto.price, existing.rows[0].id]
        );
        produtosAtualizados++;
      }
    }

    console.log(`\n✅ População concluída!`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - Fornecedores: ${allSupplierIds.length} disponíveis`);
    console.log(`   - Produtos criados: ${produtosCriados}`);
    console.log(`   - Produtos atualizados: ${produtosAtualizados}`);
    console.log(`   - Total de produtos no banco:`);
    
    const totalProducts = await query('SELECT COUNT(*) as total FROM products WHERE is_active = true');
    console.log(`     ${totalProducts.rows[0].total} produtos ativos`);

  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
    process.exit(1);
  }
};

populateDatabase().then(() => {
  console.log('\n🎉 Processo concluído!');
  process.exit(0);
});

