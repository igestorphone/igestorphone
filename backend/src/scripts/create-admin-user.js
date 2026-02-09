import dotenv from 'dotenv';
dotenv.config();

import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    console.log('🔧 Criando/atualizando usuário admin...\n');

    const email = process.env.ADMIN_EMAIL || 'igestorphone@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Administrador';

    // Verificar se o usuário já existe
    const existingUser = await query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      console.log(`✅ Usuário ${email} já existe. Atualizando senha...`);
      
      // Atualizar senha
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      await query(`
        UPDATE users 
        SET password_hash = $1,
            name = $2,
            tipo = 'admin',
            subscription_status = 'active',
            is_active = true,
            subscription_expires_at = $3,
            updated_at = NOW()
        WHERE email = $4
      `, [
        passwordHash,
        name,
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        email
      ]);

      console.log(`✅ Senha atualizada para: ${password}`);
    } else {
      console.log(`📝 Criando novo usuário admin: ${email}`);
      
      // Criar novo usuário
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      await query(`
        INSERT INTO users (email, password_hash, name, tipo, subscription_status, subscription_expires_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        email,
        passwordHash,
        name,
        'admin',
        'active',
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        true
      ]);

      console.log(`✅ Usuário criado com sucesso!`);
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${password}`);
    }

    console.log('\n✅ Pronto! Agora você pode fazer login.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    process.exit(1);
  }
}

createAdminUser();

