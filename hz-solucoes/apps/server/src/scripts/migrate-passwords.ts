/**
 * Script de Migração de Senhas
 * 
 * Este script migra senhas existentes em texto plano para hash bcrypt.
 * Execute apenas UMA VEZ após implementar as correções de segurança.
 * 
 * Uso:
 *   tsx src/scripts/migrate-passwords.ts
 */

import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword, comparePassword } from '../lib/auth.js';
import { eq } from 'drizzle-orm';

async function migratePasswords() {
  console.log('🔐 Iniciando migração de senhas...\n');

  try {
    // Busca todos os usuários
    const allUsers = await db.select().from(users).all();
    
    if (allUsers.length === 0) {
      console.log('✅ Nenhum usuário encontrado. Nada para migrar.');
      return;
    }

    console.log(`📊 Encontrados ${allUsers.length} usuário(s).\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of allUsers) {
      try {
        // Verifica se a senha já está hasheada
        // Senhas bcrypt começam com $2a$, $2b$ ou $2y$ e têm 60 caracteres
        const isHashed = user.password.startsWith('$2') && user.password.length === 60;

        if (isHashed) {
          console.log(`⏭️  Usuário ${user.whatsapp} já tem senha hasheada. Pulando...`);
          skipped++;
          continue;
        }

        // Hash da senha atual
        console.log(`🔄 Migrando senha do usuário ${user.whatsapp}...`);
        const hashedPassword = await hashPassword(user.password);

        // Atualiza no banco usando Drizzle
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));

        // Verifica se a migração funcionou
        const updatedUser = await db.select().from(users).where(eq(users.id, user.id)).get();
        if (updatedUser && await comparePassword(user.password, updatedUser.password)) {
          console.log(`✅ Senha do usuário ${user.whatsapp} migrada com sucesso!`);
          migrated++;
        } else {
          console.error(`❌ Erro ao verificar migração do usuário ${user.whatsapp}`);
          errors++;
        }
      } catch (error: any) {
        console.error(`❌ Erro ao migrar usuário ${user.whatsapp}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumo da Migração:');
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log('\n✅ Migração concluída!');

  } catch (error: any) {
    console.error('❌ Erro fatal na migração:', error);
    process.exit(1);
  }
}

// Executa a migração
migratePasswords()
  .then(() => {
    console.log('\n🎉 Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

