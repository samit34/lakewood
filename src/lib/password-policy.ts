import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as common from '@zxcvbn-ts/language-common';
import * as en from '@zxcvbn-ts/language-en';

// Shared by the browser (strength meter) and the server (enforcement).
// The dictionaries include lists of the most common leaked passwords.
let factory: ZxcvbnFactory | null = null;
const getFactory = () =>
  (factory ??= new ZxcvbnFactory({
    dictionary: { ...common.dictionary, ...en.dictionary },
    graphs: common.adjacencyGraphs,
    translations: en.translations,
  }));

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export type PasswordCheck = { ok: boolean; score: 0 | 1 | 2 | 3 | 4; problems: string[] };

export function checkPassword(password: string, userInputs: string[] = []): PasswordCheck {
  const problems: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) problems.push(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (password.length > MAX_PASSWORD_LENGTH) problems.push(`Use at most ${MAX_PASSWORD_LENGTH} characters.`);
  const result = getFactory().check(password.slice(0, MAX_PASSWORD_LENGTH), [...userInputs.filter(Boolean), 'lakewood', 'ielts', 'admin']);
  if (result.score < 3) {
    problems.push(result.feedback.warning || 'This password is too easy to guess.');
    problems.push(...result.feedback.suggestions);
  }
  return { ok: problems.length === 0, score: result.score as PasswordCheck['score'], problems: [...new Set(problems)] };
}
