import bcrypt from 'bcrypt';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { sql } from 'drizzle-orm';

/**
 * Script para migrar senhas em texto plano para hash bcrypt
 * 
 * IMPORTANTE: Execute este script apenas UMA VEZ após aplicar a migration 002
 * 
 * Como executar:
 * cd apps/server
 * tsx src/scripts/migrate-passwords.ts
 */

async function migratePasswords() {
  console.log('🔐 Iniciando migração de senhas...\n');

  try {
    // Buscar todos os usuários
    const allUsers = await db.select().from(users).all();
    
    if (allUsers.length === 0) {
      console.log('ℹ️  Nenhum usuário encontrado no banco de dados.');
      return;
    }

    console.log(`📊 Encontrados ${allUsers.length} usuário(s) para migrar.\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of allUsers) {
      try {
        // Verificar se já tem password_hash
        const hasHash = await db.select({ 
          passwordHash: users.passwordHash 
        })
        .from(users)
        .where(sql`id = ${user.id}`)
        .get();

        // Se já tem hash e não é igual ao password, pular
        if (hasHash?.passwordHash && hasHash.passwordHash !== (user as any).password) {
          console.log(`⏭️  Usuário ${user.name} (${user.whatsapp}) já possui hash. Pulando...`);
          skipped++;
          continue;
        }

        // Pegar a senha em texto plano (coluna antiga)
        const plainPassword = (user as any).password;
        
        if (!plainPassword) {
          console.log(`⚠️  Usuário ${user.name} não tem senha. Pulando...`);
          skipped++;
          continue;
        }

        // Gerar hash bcrypt
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

        // Atualizar no banco
        await db.update(users)
          .set({ passwordHash })
          .where(sql`id = ${user.id}`)
          .run();

        console.log(`✅ Usuário ${user.name} (${user.whatsapp}) migrado com sucesso!`);
        migrated++;

      } catch (error) {
        console.error(`❌ Erro ao migrar usuário ${user.name}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   📊 Total: ${allUsers.length}\n`);

    if (migrated > 0) {
      console.log('🎉 Migração concluída com sucesso!');
      console.log('⚠️  IMPORTANTE: As senhas antigas ainda estão na coluna "password".');
      console.log('   O sistema agora usa apenas "password_hash".\n');
    }

  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    process.exit(1);
  }
}

// Executar migração
migratePasswords()
  .then(() => {
    console.log('✅ Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  });
