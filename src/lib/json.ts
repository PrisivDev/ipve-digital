/**
 * IPVE Digital — JSON Serialization Utility
 * 
 * Prisma returns BigInt and Decimal fields which cannot be
 * serialized by JSON.stringify by default. This utility provides
 * a safe serialization helper and a drop-in replacement for NextResponse.json.
 */

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

/**
 * Convert a value to a JSON-safe format by replacing BigInt and Decimal with numbers/strings.
 * Works recursively on objects and arrays.
 */
export function safeJson(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'bigint') {
    return data.toString();
  }
  
  // Handle Prisma.Decimal (which has .toNumber() and .toFixed())
  if (data instanceof Prisma.Decimal || (data && typeof data === 'object' && 's' in data && 'e' in data && 'd' in data)) {
    return Number(data);
  }
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => safeJson(item));
  }
  
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = safeJson(value);
    }
    return result;
  }
  
  return data;
}

/**
 * Stringify data safely, handling BigInt and Decimal values.
 */
export function safeStringify(data: unknown, space?: string | number): string {
  return JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , space);
}

/**
 * Drop-in replacement for NextResponse.json that handles BigInt serialization.
 * 
 * Usage:
 *   import { json } from '@/lib/json';
 *   return json({ data: prismaResult });  // instead of NextResponse.json(...)
 */
export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(safeJson(data), init);
}
