# pysystemtrade + Carver Resources

## Knowledge

- **Book: _Systematic Trading_ — Robert Carver.**
  The foundational text. The chapter-15 system Jay runs *is* the worked example from this book.
  Use for: forecasts, vol targeting, forecast/instrument diversification, the "why" behind every stage.
- **Book: _Advanced Futures Trading Strategies_ — Robert Carver.**
  Deeper menu of trading rules and refinements. Use for: designing/choosing rules beyond EWMAC + carry.
- **Book: _Leveraged Trading_ — Robert Carver.**
  Gentler on-ramp to the same framework. Use for: intuition when a concept feels too dense.
- [Carver's blog — qoppac.blogspot.com](https://qoppac.blogspot.com/)
  Primary source from the author himself. Use for: pysystemtrade design decisions, production war-stories, costs, rolls.
- **In-repo: `docs/backtesting.md`** (and `docs/userguide.md`, `docs/production.md`).
  The official docs, versioned with the exact code Jay runs. Use for: authoritative API and pipeline detail.
- **In-repo: `_learning_sandbox/docs/*.md`** (Jay's own architecture notes).
  Use for: line-by-line internals of System/SystemStage, accounts, data hierarchy.

## Wisdom (Communities)

- [pysystemtrade GitHub Discussions & Issues](https://github.com/robcarver17/pysystemtrade)
  Carver responds directly. Use for: real bugs, "is this expected?", production setup gotchas.
- [Elitetrader — Carver's long-running systematic futures thread](https://www.elitetrader.com/)
  Use for: real practitioners running this exact system live. (Search "Carver systematic".)
- [r/algotrading](https://reddit.com/r/algotrading)
  Broader, noisier. Use for: general systematic-trading sanity checks, not pysystemtrade specifics.

## Gaps
- No vetted step-by-step "IB Gateway + MongoDB on macOS" walkthrough yet beyond Jay's own
  `production-setup-macos.md` — verify against official docs when we reach Phase 9.
