import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, generateToken, verifyToken, extractTokenFromHeader } from './auth';

describe('Auth Functions', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBe(60); // bcrypt hash length
      expect(hash.startsWith('$2')).toBe(true); // bcrypt format
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'samePassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword('wrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 1,
        whatsapp: '5511999999999',
        name: 'Test User',
      };
      
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload = {
        userId: 1,
        whatsapp: '5511999999999',
        name: 'Test User',
      };
      
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.whatsapp).toBe(payload.whatsapp);
      expect(decoded.name).toBe(payload.name);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow('Token inválido ou expirado');
    });

    it('should throw error for tampered token', () => {
      const payload = {
        userId: 1,
        whatsapp: '5511999999999',
        name: 'Test User',
      };
      
      const token = generateToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx'; // Modify signature
      
      expect(() => verifyToken(tamperedToken)).toThrow('Token inválido ou expirado');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const authHeader = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for invalid format', () => {
      const extracted = extractTokenFromHeader('InvalidFormat token');
      expect(extracted).toBeNull();
    });

    it('should return null for missing Bearer prefix', () => {
      const extracted = extractTokenFromHeader('token-without-bearer');
      expect(extracted).toBeNull();
    });
  });

  describe('Integration: Full Auth Flow', () => {
    it('should complete full authentication cycle', async () => {
      // 1. Hash password
      const originalPassword = 'userPassword123';
      const hashedPassword = await hashPassword(originalPassword);
      
      // 2. Verify password
      const isPasswordValid = await comparePassword(originalPassword, hashedPassword);
      expect(isPasswordValid).toBe(true);
      
      // 3. Generate token
      const userPayload = {
        userId: 42,
        whatsapp: '5511987654321',
        name: 'Integration Test User',
      };
      const token = generateToken(userPayload);
      
      // 4. Verify token
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(userPayload.userId);
      expect(decoded.whatsapp).toBe(userPayload.whatsapp);
      
      // 5. Extract from header
      const authHeader = `Bearer ${token}`;
      const extractedToken = extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
    });
  });
});
