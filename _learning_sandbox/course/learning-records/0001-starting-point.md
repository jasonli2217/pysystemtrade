# Starting point: can run a backtest, pipeline "why" is fuzzy; goal is live trading

Jay self-assessed (2026-07-14) as able to run `futures_system()` and get a Sharpe, but
hazy on *why* the 7-stage pipeline produces what it does. His end goal is trading Carver's
system **live with real money** on IB — so production reliability and self-sufficient
debugging matter, not just academic understanding.

Prior context: he already built a detailed 10-phase learning plan and five architecture
notes, and has asked advanced questions before (forecast-scalar mean vs median, why
`SP500_micro`/gasoline weren't generating orders, portfolio weight differences). So he has
real exposure — but exposure ≠ solid mental model. Teaching should start by *consolidating*
the pipeline (Lesson 1), not re-introducing basics, and move quickly once he demonstrates
the mental model. Zone of proximal development: Phase 2-3 (pipeline → forecasts → config),
with production (Phase 9-10) as the north star.
