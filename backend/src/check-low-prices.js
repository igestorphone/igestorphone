import dotenv from 'dotenv';
import { query } from './config/database.js';

dotenv.config();

async function checkLowPrices() {
  try {
    console.log('🔍 Verificando produtos com preços suspeitosamente baixos...\n');
    
    // Listar todos os fornecedores
    const suppliers = await query('SELECT id, name FROM suppliers WHERE is_active = true ORDER BY name');
    console.log('📋 Fornecedores ativos:');
    suppliers.rows.forEach(s => console.log(`   ID ${s.id}: ${s.name}`));
    
    // Buscar produtos com preços muito baixos (possíveis vitrine)
    const suspiciousQuery = `
      SELECT p.id, p.name, p.model, p.condition, p.price, p.condition_detail, s.name as supplier_name
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = true
        AND (
          (p.name ILIKE '%iPhone 11%' AND p.price < 2000)
          OR (p.name ILIKE '%iPhone 12%' AND p.price < 3000)
          OR (p.name ILIKE '%iPhone 13%' AND p.price < 3500)
          OR (p.name ILIKE '%iPhone 14%' AND p.price < 4000)
          OR (p.name ILIKE '%iPhone 15%' AND p.price < 5000)
          OR (p.name ILIKE '%iPhone 16%' AND p.price < 6000)
        )
        AND p.condition = 'Novo'
      ORDER BY p.price ASC
    `;
    
    const suspicious = await query(suspiciousQuery);
    
    console.log(`\n⚠️  ${suspicious.rows.length} produtos com preços SUSPEITOSAMENTE BAIXOS encontrados:\n`);
    
    if (suspicious.rows.length > 0) {
      suspicious.rows.forEach((p, index) => {
        console.log(`   ${index + 1}. ID ${p.id}: ${p.name} (${p.model || 'sem modelo'})`);
        console.log(`      Fornecedor: ${p.supplier_name}`);
        console.log(`      Preço: R$ ${p.price} | Condition: ${p.condition} ${p.condition_detail || ''}`);
        console.log('');
      });
      
      // Perguntar se quer desativar
      const ids = suspicious.rows.map(p => p.id).join(', ');
      console.log(`\n💡 Para desativar estes produtos, execute:`);
      console.log(`   UPDATE products SET is_active = false WHERE id IN (${ids});`);
    } else {
      console.log('✅ Nenhum produto com preço suspeito encontrado!');
    }
    
    // Buscar produtos do fornecedor "Só Iphone" ou similar
    const soIphoneQuery = `
      SELECT p.id, p.name, p.model, p.condition, p.price, p.condition_detail, s.name as supplier_name
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = true
        AND (s.name ILIKE '%só%iphone%' OR s.name ILIKE '%so%iphone%' OR s.name ILIKE '%só%celular%')
      ORDER BY p.price ASC
      LIMIT 50
    `;
    
    const soIphoneProducts = await query(soIphoneQuery);
    
    if (soIphoneProducts.rows.length > 0) {
      console.log(`\n📱 ${soIphoneProducts.rows.length} produtos do fornecedor "Só Iphone" (ou similar) encontrados:\n`);
      soIphoneProducts.rows.forEach((p, index) => {
        console.log(`   ${index + 1}. ID ${p.id}: ${p.name} (${p.model || 'sem modelo'})`);
        console.log(`      Fornecedor: ${p.supplier_name}`);
        console.log(`      Preço: R$ ${p.price} | Condition: ${p.condition} ${p.condition_detail || ''}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkLowPrices();




