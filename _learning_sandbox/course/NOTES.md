# Teaching notes — Jay

## How Jay likes to learn
- Address him as "Jay", "Jay Dog", or "Dr. Li".
- Self-taught Python (books + YouTube), no formal technical background. Explain clearly; don't assume jargon.
- Learns by running real code in his own repo (`uv run python ...`). Every lesson should include a hands-on step.
- Prefers surgical, minimal changes and honest surfacing of tradeoffs (per his global CLAUDE.md).

## Workspace facts
- Course lives in `_learning_sandbox/course/`. Lessons open as local HTML files.
- Uses `uv` for everything (`uv run python ...`), not pip/poetry.
- Chapter-15 config reality-check: `percentage_vol_target: 20.0`, `forecast_cap: 20.0`
  (an older note said 25 — the code says 20. Trust the code.)

## Session log
- 2026-07-14: Set up workspace. Calibrated level = "backtest runs, why is fuzzy";
  end goal = trade live with real money. Delivered Lesson 1 (the 7-stage pipeline).
- 2026-07-14: Jay hit KeyError('SP500') — this config's traded universe is only 6
  instruments: CORN, EUROSTX, MXP, SOFR, US10, V2X. Use EUROSTX as the demo instrument
  in this repo, never SP500. See learning-record 0002. Fixed trace_pipeline.py + Lesson 1.
- 2026-07-14: Jay asked for ALL lessons up front. Decision: built the complete Part 1
  (Lessons 1-7, "understand the backtest") now — verifiable, sequential, self-contained.
  Deferred Parts 2 (customise) & 3 (go live) to build as he reaches them, because they
  depend on his choices/infra and can't be verified by running code yet. Added index.html
  syllabus. All 7 lessons use EUROSTX with numbers verified against the repo; each has a
  runnable trace_*.py. Key connective thread: ewmac8_32 (Lesson 2) is dropped from EUROSTX's
  blend for cost reasons (Lesson 3/7), and EUROSTX alone is a loser (-0.037) yet portfolio
  wins (+0.478) — the diversification lesson (Lesson 6).

## Verified EUROSTX pipeline numbers (chapter15 config, as of 2026-07-14)
- raw ewmac8_32 4.073 → ×5.3 → 21.6 → capped 20
- combined forecast 14.849 (weights carry .5 / ewmac16_64 .21 / 32_128 .08 / 64_256 .21; FDM 1.31)
- avg position 9.813 → subsystem 14.57 → ×weight .20 ×IDM 1.89 → notional 5.519
- portfolio Sharpe 0.478 (gross .498 / net .478); EUROSTX subsystem Sharpe -0.037
- ewmac8_32 turnover 23.13 vs ewmac64_256 5.02; SR cost/trade 0.00116; capital 250k, vol target 20%
