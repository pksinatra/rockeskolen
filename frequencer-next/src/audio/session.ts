import type { Session } from "../state/exploration";
export interface SessionPosition {
  remaining: number | null;
  step: number;
  done: boolean;
}
/** Derive progress from elapsed time rather than counting interval callbacks. */
export function sessionPosition(
  s: Session,
  elapsed: number,
  sequence: boolean,
): SessionPosition {
  const sequenceEnd =
    sequence && !s.loop ? s.steps.length * s.stepSeconds : Infinity;
  const end = Math.min(s.seconds > 0 ? s.seconds : Infinity, sequenceEnd);
  return {
    remaining: Number.isFinite(end) ? Math.max(0, end - elapsed) : null,
    step:
      sequence && s.steps.length
        ? Math.floor(elapsed / s.stepSeconds) % s.steps.length
        : -1,
    done: elapsed >= end,
  };
}
