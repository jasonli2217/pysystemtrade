# Corrected misconception: "has price data" ≠ "in the traded universe"

Jay hit `KeyError('SP500')` on `system.portfolio.get_notional_position("SP500")` while
running the Lesson 1 trace (2026-07-14). Root cause: this chapter-15 config trades only
**6 instruments** — `CORN, EUROSTX, MXP, SOFR, US10, V2X`. SP500 has a price CSV on disk,
so stages 1–5 compute a forecast and even a subsystem position for it, but stage 6
(`portfolio`, at `systems/portfolio.py:258`) indexes `instr_weights[instrument_code]`,
which only has columns for the 6 universe instruments → KeyError.

Why it matters for future sessions: (1) Jay now understands the distinction between an
instrument *having data* and being *in the traded universe* — a prerequisite for the
config/instrument-weights lessons (Phase 4) and for debugging live positions later.
(2) He experienced the lesson's own debugging heuristic working ("the error landed at
stage 6 → it's a portfolio/universe problem, not a data problem"). (3) Practical fact for
all future lessons in THIS repo: default demo instrument should be `EUROSTX` (or another of
the 6), never SP500. Confirmed the old learning-plan doc's SP500 examples are stale for this
config.
