import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Utilitários de autenticação e segurança
 */

// Número de rounds para o bcrypt (10 é um bom equilíbrio entre segurança e performance)
const SALT_ROUNDS = 10;

// Chave secreta do JWT (deve estar no .env em produção)
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura_aqui_mude_em_producao';

// Tempo de expiração do token (7 dias)
const JWT_EXPIRES_IN = '7d';

/**
 * Gera hash bcrypt de uma senha
 * @param password Senha em texto plano
 * @returns Hash bcrypt da senha
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara uma senha em texto plano com um hash bcrypt
 * @param password Senha em texto plano
 * @param hash Hash bcrypt para comparar
 * @returns true se a senha corresponde ao hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Gera um token JWT para um usuário
 * @param userId ID do usuário
 * @param whatsapp WhatsApp do usuário
 * @returns Token JWT assinado
 */
export function generateToken(userId: number, whatsapp: string): string {
  return jwt.sign(
    { 
      userId, 
      whatsapp,
      type: 'access'
    },
    JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'hz-solucoes',
      subject: userId.toString()
    }
  );
}

/**
 * Verifica e decodifica um token JWT
 * @param token Token JWT para verificar
 * @returns Payload decodificado do token
 * @throws Error se o token for inválido ou expirado
 */
export function verifyToken(token: string): { userId: number; whatsapp: string; type: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      whatsapp: decoded.whatsapp,
      type: decoded.type
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado. Faça login novamente.');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido.');
    }
    throw new Error('Erro ao verificar token.');
  }
}

/**
 * Extrai o token do header Authorization
 * @param authHeader Header Authorization (formato: "Bearer TOKEN")
 * @returns Token extraído ou null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Valida se uma senha atende aos requisitos mínimos
 * @param password Senha para validar
 * @returns true se a senha é válida
 */
export function isPasswordValid(password: string): boolean {
  // Mínimo 4 caracteres (para uso pessoal, pode ser mais flexível)
  return password.length >= 4;
}

/**
 * Gera uma senha aleatória (útil para testes ou reset de senha)
 * @param length Comprimento da senha (padrão: 12)
 * @returns Senha aleatória
 */
export function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
