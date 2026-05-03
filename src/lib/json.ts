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
  
  // Handle Prisma.Decimal (check for the constructor or the internal structure)
  if (data instanceof Prisma.Decimal) {
    return Number(data);
  }
  
  // Fallback: objects that look like Prisma.Decimal (has d array + e number + s boolean)
  if (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    typeof (data as Record<string, unknown>).constructor === 'function' &&
    (data as Record<string, unknown>).constructor.name === 'Decimal'
  ) {
    return Number(data);
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
  return JSON.stringify(safeJson(data), undefined, space);
}

/**
 * Drop-in replacement for NextResponse.json that handles BigInt and Decimal serialization.
 * 
 * Usage:
 *   import { json } from '@/lib/json';
 *   return json({ data: prismaResult });  // instead of NextResponse.json(...)
 */
export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(safeJson(data), init);
}
