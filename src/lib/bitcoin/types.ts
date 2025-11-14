import { z } from 'zod';

/**
 * Bitcoin block header schema for validation
 */
export const BlockHeaderSchema = z.object({
  version: z.number().int().min(1),
  previousBlockHash: z.string().length(64).regex(/^[0-9a-f]+$/i),
  merkleRoot: z.string().length(64).regex(/^[0-9a-f]+$/i),
  timestamp: z.number().int().positive(),
  bits: z.number().int().positive(),
  nonce: z.number().int().min(0),
});

/**
 * Mining attempt result schema
 */
export const MiningResultSchema = z.object({
  hash: z.string().length(64).regex(/^[0-9a-f]+$/i),
  nonce: z.number().int().min(0),
  isWinner: z.boolean(),
  attempts: z.number().int().positive(),
  timestamp: z.number().int().positive(),
});

/**
 * Bitcoin network difficulty schema
 */
export const NetworkDifficultySchema = z.object({
  difficulty: z.number().positive(),
  target: z.string().length(64).regex(/^[0-9a-f]+$/i),
  hashRate: z.number().positive(),
  blockHeight: z.number().int().positive(),
});

/**
 * Winner record schema for Firebase storage
 */
export const WinnerSchema = z.object({
  id: z.string().uuid(),
  hash: z.string().length(64).regex(/^[0-9a-f]+$/i),
  nonce: z.number().int().min(0),
  timestamp: z.number().int().positive(),
  blockHeight: z.number().int().positive(),
  difficulty: z.number().positive(),
  sessionId: z.string().min(1),
  bitcoinAddress: z.string().min(26).max(62),
});

export type BlockHeader = z.infer<typeof BlockHeaderSchema>;
export type MiningResult = z.infer<typeof MiningResultSchema>;
export type NetworkDifficulty = z.infer<typeof NetworkDifficultySchema>;
export type Winner = z.infer<typeof WinnerSchema>;