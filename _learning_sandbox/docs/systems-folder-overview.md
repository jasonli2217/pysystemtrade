# `systems/` Folder — Overview of All Scripts and Connections

#pysystemtrade #backtesting #architecture #systems

---

## What is the `systems/` Folder?

The `systems/` folder is the **backtesting engine** of pysystemtrade. It implements a **composable pipeline** — a chain of processing stages where each stage does one job, and passes results to the next. All stages share one parent object (`System`) and can reach each other through it.

Think of it like a factory assembly line:
```
Raw Data → Trading Rules → Scale/Cap → Combine → Size Positions → Portfolio → P&L
```

---

## File Map

### Core Infrastructure (start here)

| File | Class | Role |
|---|---|---|
| `basesystem.py` | `System` | The container that holds all stages together. The "factory floor". |
| `stage.py` | `SystemStage` | Base class every stage inherits from. Gives stages their `self.parent` link. |
| `system_cache.py` | `systemCache` | Caching system. Stores computed results so stages don't recompute unnecessarily. |

### Pipeline Stages (in execution order)

| File | Class | Stage Name | Role |
|---|---|---|---|
| `rawdata.py` | `RawData` | `rawdata` | Loads prices, computes volatility, carry data, FX rates |
| `forecasting.py` | `Rules` | `rules` | Applies trading rules (EWMAC, carry, etc.) to get raw forecasts |
| `forecast_scale_cap.py` | `ForecastScaleCap` | `forecastScaleCap` | Scales forecasts to a target level, caps at ±20 |
| `forecast_combine.py` | `ForecastCombine` | `combForecast` | Combines multiple forecasts with weights and FDM |
| `positionsizing.py` | `PositionSizing` | `positionSize` | Converts combined forecast to a contract position using vol targeting |
| `portfolio.py` | `Portfolios` | `portfolio` | Applies instrument weights and IDM across all instruments |
| `accounts/` | `Account` | `accounts` | Calculates P&L, costs, Sharpe ratio, performance statistics |

### Supporting Files

| File | Role |
|---|---|
| `buffering.py` | Functions for position buffer calculations (shared by portfolio + accounts stages) |
| `trading_rules.py` | `TradingRule` class — defines a trading rule as a function + data + parameters |
| `forecast_mapping.py` | Maps forecasts (e.g., binary signal → continuous), used by `forecastScaleCap` |
| `diagoutput.py` | Diagnostic output — inspect cached system data for debugging |
| `risk.py` | Risk calculation helpers (used by `portfolio` stage) |
| `risk_overlay.py` | Risk overlay logic — reduce positions when portfolio risk exceeds a cap |

### Subdirectories

| Folder | Contents |
|---|---|
| `accounts/` | All P&L and cost accounting logic (see [[accounts-stage-architecture]]) |
| `provided/` | Pre-built system configurations (e.g., `futures_chapter15` — the full book system) |
| `tools/` | Utilities: autogroup weight calculation, etc. |
| `tests/` | Unit tests for the pipeline stages |

---

## How the Stages Connect

Every stage holds a reference `self.parent` pointing back to the `System`. So any stage can call any other stage's methods:

```python
# Inside positionsizing.py, to get a combined forecast:
self.parent.combForecast.get_combined_forecast("SP500")

# Inside portfolio.py, to get a subsystem position:
self.parent.positionSize.get_subsystem_position("SP500")

# Inside accounts/, to get prices:
self.parent.rawdata.get_daily_prices("SP500")
```

The `System` object makes each stage available as an attribute using the stage's `name` property (e.g., `system.rawdata`, `system.accounts`).

---

## Data Flow Diagram

```
csvFuturesSimData / dbFuturesSimData
        │  (prices, carry, FX, costs, instrument metadata)
        ▼
    [rawdata]  →  daily prices, % vol, carry data, cost data
        │
        ▼
    [rules]    →  raw forecasts (e.g., EWMAC8, EWMAC16, carry)
        │
        ▼
    [forecastScaleCap]  →  scaled + capped forecasts (range ±20)
        │
        ▼
    [combForecast]  →  combined forecast per instrument (weighted + FDM)
        │
        ▼
    [positionSize]  →  subsystem position (contracts, using vol targeting)
        │
        ▼
    [portfolio]  →  final portfolio position (instrument weights + IDM applied)
        │
        ▼
    [accounts]  →  daily P&L, SR, costs, drawdown, performance stats
```

---

*Next notes: [[basesystem-and-stage-line-by-line]] | [[system-cache-explained]]*
