'use client';

// Cross-component signals on a single page, without a global store.

export type Goal = 'spoken' | 'ielts' | 'pte';

export const GOAL_EVENT = 'lw:select-goal';

/** Preselects the goal in the registration form and scrolls to it. */
export function selectGoal(goal: Goal) {
  window.dispatchEvent(new CustomEvent<Goal>(GOAL_EVENT, { detail: goal }));
  document.getElementById('register')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
