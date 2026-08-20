# Mission: Trade Carver's system live with pysystemtrade

## Why
Jay wants to run Robert Carver's systematic futures strategy **live, with his own real
money**, on Interactive Brokers — driven by pysystemtrade. The backtest is only the
means: the real outcome is a running, trustworthy, automated trading system he
understands well enough to operate and debug himself.

## Success looks like
- Can run and correctly interpret a full backtest (P&L, Sharpe, costs) of the chapter-15 system.
- Can customise the system via YAML config — instruments, trading rules, weights, risk target — and judge whether a change actually helped.
- Can write and backtest his own trading rule.
- Can stand up production infra (MongoDB/Parquet, IB Gateway) and run the daily production scripts.
- Paper-trades the live system for weeks, then goes live with real capital — and can debug it when a position looks wrong.

## Constraints
- ~1–2 hours/day pace. Prefers to learn by running real code in his own repo, not abstract theory.
- No formal technical background; self-taught Python (books + YouTube). Explain clearly, build up gradually.
- Currently at: "backtest runs, but the *why* is fuzzy." Start by solidifying the pipeline mental model.

## Out of scope (for now)
- Building a brand-new strategy from scratch (use Carver's proven system first).
- Non-futures asset classes.
- Deep ML / alternative-data signals.
