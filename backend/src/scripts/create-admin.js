import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

console.log('🔐 Criando/Atualizando usuário admin...');

const createAdmin = async () => {
  try {
    const email = 'igestorphone@gmail.com';
    const password = 'admin123';
    const name = 'Administrador';

    // Verificar se usuário já existe
    const existingUser = await query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      console.log(`📝 Usuário ${email} já existe. Atualizando senha e configurando como admin...`);
      
      const userId = existingUser.rows[0].id;
      
      // Atualizar senha
      const passwordHash = await bcrypt.hash(password, 12);
      await query(`
        UPDATE users 
        SET 
          password_hash = $1,
          name = $2,
          tipo = 'admin',
          role = 'admin',
          is_active = true,
          approval_status = 'approved',
          subscription_status = 'active'
        WHERE id = $3
      `, [passwordHash, name, userId]);
      
      console.log(`✅ Usuário ${email} atualizado!`);
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${password}`);
      console.log(`   Tipo: admin`);
      console.log(`   Status: ativo e aprovado`);
      
    } else {
      console.log(`➕ Criando novo usuário admin ${email}...`);
      
      // Criar novo usuário
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await query(`
        INSERT INTO users (
          email, password_hash, name, tipo, role, 
          is_active, approval_status, subscription_status,
          subscription_expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, email, name
      `, [
        email,
        passwordHash,
        name,
        'admin',
        'admin',
        true,
        'approved',
        'active',
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
      ]);
      
      const user = result.rows[0];
      
      // Garantir permissões de admin
      const adminPermissions = ['consultar_listas', 'medias_preco', 'buscar_iphone_barato', 'envio_fora_sp'];
      for (const permission of adminPermissions) {
        await query(`
          INSERT INTO user_permissions (user_id, permission_name, granted)
          VALUES ($1, $2, true)
          ON CONFLICT (user_id, permission_name) DO UPDATE SET granted = true
        `, [user.id, permission]);
      }
      
      console.log(`✅ Usuário admin criado com sucesso!`);
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${password}`);
      console.log(`   Tipo: admin`);
      console.log(`   Status: ativo e aprovado`);
    }
    
    // Fechar conexão
    const pool = (await import('../config/database.js')).default;
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar admin:', error);
    process.exit(1);
  }
};

createAdmin();

