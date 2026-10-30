// Copy-me template for a deep module: delete it, or copy it to start a new package.
// This file is an entry point; the work happens in lib/, which outsiders cannot import.
import { joinWords } from './lib/impl';

export function greet(name: string): string {
  return joinWords(['Merhaba', name]);
}
