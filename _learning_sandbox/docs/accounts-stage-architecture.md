# Account Stage Architecture — `systems/accounts/`

#pysystemtrade #backtesting #architecture #accounts

---

## Overview

The `Account` class — accessed as `system.accounts` in a running `System` — is the **final pipeline stage** that handles all P&L calculation, cost accounting, and performance analysis.

It is built by composing **many focused mixin classes** through multiple inheritance. Each layer adds one specific responsibility. There are two parallel inheritance chains that both root from `accountInputs`, which then merge together into the final `Account` class.

Related files:
- [[systems-pipeline-overview]] *(if you create this)*
- [[dataBlob-explained]] *(if you create this)*

---

## Layer 0 — `SystemStage` (the base)

**File:** `systems/stage.py`

Every pipeline stage inherits from `SystemStage`. It provides:
- `self.parent` → reference back to the `System` object (so any stage can call any other stage)
- `self.log` → logging
- The `@diagnostic`, `@input`, `@output` cache decorators via `system_cache.py`

---

## Layer 1 — `accountInputs`

**File:** `systems/accounts/account_inputs.py`
**Inherits from:** `SystemStage`

**Role:** A pure data-fetching adapter. It has **no calculations of its own** — it just pulls data from all the other pipeline stages and exposes it in one place.

| Method | Calls Into |
|---|---|
| `get_daily_prices()` / `get_hourly_prices()` | `rawdata` stage |
| `get_daily_returns_volatility()` | `rawdata` stage |
| `get_raw_cost_data()` | `rawdata` stage |
| `get_rolls_per_year()` | `rawdata` stage |
| `get_capped_forecast()` | `forecastScaleCap` stage |
| `get_subsystem_position()` | `positionSize` stage |
| `get_notional_capital()` | `positionSize` stage |
| `get_annual_risk_target()` | `positionSize` stage |
| `get_notional_position()` | `portfolio` stage |
| `get_instrument_weights()` | `portfolio` stage |
| `get_instrument_diversification_multiplier()` | `portfolio` stage |
| `forecast_diversification_multiplier()` | `combForecast` stage |
| `forecast_weights_for_instrument()` | `combForecast` stage |

> Think of `accountInputs` as the **wiring harness** — without it, every downstream class would have to know how to talk to 5+ other stages.

---

## Layer 2 — `accountCosts`

**File:** `systems/accounts/account_costs.py`
**Inherits from:** `accountInputs`

**Role:** Calculates **Sharpe Ratio (SR) costs** — the cost of trading expressed as a fraction of annualised volatility. This is pysystemtrade's preferred cost representation because it's dimensionless and comparable across instruments.

### Two Cost Components

**1. Transaction costs** — how much it costs every time you trade:
```
SR cost per trade = (spread + commission) / annual_price_volatility
```

**2. Holding costs** — the cost of rolling contracts:
```
SR holding cost = rolls_per_year × 2 × SR_cost_per_trade
```

**Total SR cost for a rule:**
```
SR_cost = turnover × SR_cost_per_trade + holding_cost
```

### Pooling Logic

If `use_pooled_costs: True` in config, turnover and SR costs are averaged across all instruments that share the same trading rules, weighted by history length. This improves statistical estimation for rules with short histories.

If `use_pooled_turnover: True`, turnover itself is also pooled separately.

### Key Methods

| Method | What It Computes |
|---|---|
| `get_SR_cost_per_trade_for_instrument()` | Annualised vol-normalised cost for one round-trip trade |
| `get_SR_holding_cost_only()` | Cost of rolling contracts |
| `forecast_turnover()` | Annual turnover rate for a specific forecast/rule |
| `get_SR_cost_for_instrument_forecast()` | Total SR cost = transaction + holding |
| `get_SR_cost_given_turnover()` | SR cost given an externally provided turnover number |

---

## Layer 3 — `accountForecast`

**File:** `systems/accounts/account_forecast.py`
**Inherits from:** `accountCosts`

**Role:** Computes **P&L for a single forecast** (one trading rule applied to one instrument). This is the most fundamental unit of performance analysis.

### How a Forecast Becomes a P&L

A forecast (e.g. EWMAC signal ranging −20 to +20) is converted to a position:

```
normalised_forecast = forecast / target_abs_forecast   (e.g. /10)

average_notional_position = (capital × daily_risk_target) / (daily_vol × value_per_point)

notional_position = normalised_forecast × average_notional_position
```

Then daily P&L = position × daily_price_change × fx_rate, minus SR costs.

### Weighting Methods

These compute how much of the total portfolio's risk a given forecast contributes:

| Method | What It Computes |
|---|---|
| `_unnormalised_weight` | `forecast_weight × FDM × instrument_weight × IDM` |
| `_normalised_weight_for_forecast_and_instrument` | Divide by total weight across all instruments |
| `_normalised_weight_for_forecast_and_instrument_within_trading_rule` | Normalise only within that rule — used to evaluate a rule's performance in isolation |

### Module-Level Standalone Functions

These live in the file but outside any class — they do the actual math:

| Function | Purpose |
|---|---|
| `pandl_for_instrument_forecast()` | Entry point: forecast series → `accountCurve` |
| `pandl_for_position()` | Core: position series → `pandlCalculationWithSRCosts` → `accountCurve` |
| `_get_average_notional_position()` | Computes vol-scaled position size |
| `_get_normalised_forecast()` | Divides forecast by target absolute forecast |

---

## Two Parallel Buffering Classes

At this point the chain **splits**. Two buffering classes both inherit from `accountInputs` and handle position buffering — the logic that says "don't trade unless position drifts outside a band".

### `accountBufferingSubSystemLevel`

**File:** `systems/accounts/account_buffering_subsystem.py`
**Inherits from:** `accountCosts`

Handles **subsystem-level positions** (before portfolio weights/IDM are applied). A subsystem treats each instrument as if it had all the capital.

- `get_buffered_subsystem_position()` — applies buffer to raw subsystem position
- `subsystem_turnover()` — annual turnover rate at subsystem level
- `apply_buffer()` — standalone function with the core buffer logic

### `accountBufferingSystemLevel`

**File:** `systems/accounts/account_buffering_system.py`
**Inherits from:** `accountInputs`

Handles **portfolio-level positions** (after IDM and instrument weights are applied).

- `get_buffered_position()` — applies buffer to notional portfolio position
- `get_buffers_for_position()` — fetches buffer bands from `portfolio` stage
- `instrument_turnover()` — actual annual turnover at portfolio level

### The Buffer Logic

```
If last_position > top_pos:  → trade to top_pos (or optimal, depending on buffer_trade_to_edge)
If last_position < bot_pos:  → trade to bot_pos (or optimal)
Otherwise:                   → hold, no trade
```

The `apply_buffer()` function is **shared** between both buffering classes via import.

---

## Layer 4 — `accountInstruments`

**File:** `systems/accounts/account_instruments.py`
**Inherits from:** `accountCosts` + `accountBufferingSystemLevel`

**Role:** Computes **P&L for one instrument at the portfolio level** — using actual portfolio positions (with IDM and instrument weights applied), not subsystem positions.

Supports two cost modes (controlled by `use_SR_costs` in config):

| Mode | Calculator Used | Description |
|---|---|---|
| SR costs | `pandlCalculationWithSRCosts` | Cost = SR cost × actual turnover |
| Cash costs | `pandlCalculationWithCashCostsAndFills` | Cost = actual spread + commission per trade |

Key method: `pandl_for_instrument(instrument_code)` → returns `accountCurve`

---

## Layer 4b — `accountPortfolio`

**File:** `systems/accounts/account_portfolio.py`
**Inherits from:** `accountInstruments`

**Role:** Aggregates all instruments into a full portfolio P&L.

- `portfolio()` → calls `pandl_for_instrument()` for every instrument, returns `accountCurveGroup`
- `total_portfolio_level_turnover()` → sums turnover across all instruments

---

## Layer 4c — `accountWithMultiplier`

**File:** `systems/accounts/account_with_multiplier.py`
**Inherits from:** `accountPortfolio` + `accountBufferingSystemLevel`

**Role:** Handles **variable/compounding capital** — where capital grows or shrinks over time.

- `portfolio_with_multiplier()` → like `portfolio()` but with compounded capital
- `get_actual_capital()` → `capital_multiplier × notional_capital` (shifted 1 day to avoid lookahead)
- `capital_multiplier()` → calls a configurable function (e.g. compounding based on cumulative returns)

---

## Layer 5a — `accountSubsystem`

**File:** `systems/accounts/account_subsystem.py`
**Inherits from:** `accountBufferingSubSystemLevel`

**Role:** Computes **P&L for each instrument as an independent subsystem** — as if all capital were allocated to it, ignoring portfolio weights. Useful for evaluating individual strategy performance.

- `pandl_for_subsystem(instrument_code)` → one instrument, subsystem-level position
- `pandl_across_subsystems()` → all instruments, unweighted `accountCurveGroup`

---

## Layer 5b — `accountTradingRules`

**File:** `systems/accounts/account_trading_rules.py`
**Inherits from:** `accountForecast`

**Role:** Aggregates forecast-level P&L up to **trading rule level** — how a rule performs across all instruments.

| Method | What It Returns |
|---|---|
| `pandl_for_trading_rule(rule)` | Rule's P&L normalised within that rule across instruments |
| `pandl_for_trading_rule_weighted(rule)` | Rule's contribution to total portfolio risk |
| `pandl_for_trading_rule_unweighted(rule)` | Each instrument treated independently |
| `pandl_for_all_trading_rules()` | All rules → `nestedAccountCurveGroup` |
| `pandl_for_instrument_rules(instrument)` | All rules for one instrument |
| `pandl_for_instrument_rules_unweighted(instrument)` | Same, unweighted |

---

## The Final Class — `Account`

**File:** `systems/accounts/accounts_stage.py`

```python
class Account(accountTradingRules, accountWithMultiplier, accountSubsystem):
    @property
    def name(self):
        return "accounts"
```

This combines all three top-level branches via Python's MRO (Method Resolution Order). Because of Python's diamond inheritance, each mixin's methods are resolved left-to-right without duplication. The final `Account` object exposes **every method from every layer**.

---

## Supporting Types

### `pandl_calculators/`

These are not stages — they are calculation engines:

| Class | Description |
|---|---|
| `pandlCalculationWithSRCosts` | Computes daily returns using SR-based cost deductions |
| `pandlCalculationWithCashCostsAndFills` | Computes daily returns using actual cash costs per trade |

### `curves/`

These are result containers:

| Class | Description |
|---|---|
| `accountCurve` | A pandas-like series with extra methods: `.sharpe()`, `.ann_std()`, `.curve()`, `.percent`, `.gross`, `.net`, `.costs` |
| `accountCurveGroup` | A dict of `accountCurve`s (e.g. one per instrument); summing gives combined curve |
| `nestedAccountCurveGroup` | A group of `accountCurveGroup`s (e.g. one per trading rule) |

---

## Full Inheritance Diagram

```
SystemStage
    └── accountInputs  ──────────────────────────────────────────┐
            │                                                     │
            └── accountCosts              accountBufferingSystemLevel
                    │                              │
                    ├── accountBufferingSubSystemLevel
                    │           │
                    │           └── accountSubsystem  [5a]
                    │
                    └── accountForecast  [3]       accountInstruments  [4]
                                │                          │
                                └── accountTradingRules    └── accountPortfolio  [4b]
                                    [5b]                           │
                                                       accountWithMultiplier  [4c]
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    │
        Account(accountTradingRules, accountWithMultiplier, accountSubsystem)
```

---

## What Each Layer Answers

| Class | Question Answered |
|---|---|
| `accountForecast` | "How good is this one trading rule signal on this instrument?" |
| `accountTradingRules` | "How good is this rule across all instruments?" |
| `accountSubsystem` | "How would this instrument do if it had all my capital?" |
| `accountInstruments` | "How is this instrument actually performing in my portfolio?" |
| `accountPortfolio` | "How is my whole portfolio doing?" |
| `accountWithMultiplier` | "How is my portfolio doing with compounding capital?" |

---

## Common Usage Examples

```python
# Full portfolio P&L (notional capital)
system.accounts.portfolio()

# Full portfolio P&L (compounding capital)
system.accounts.portfolio_with_multiplier()

# One instrument at portfolio level
system.accounts.pandl_for_instrument("SP500")

# One instrument as independent subsystem
system.accounts.pandl_for_subsystem("SP500")

# One forecast's P&L
system.accounts.pandl_for_instrument_forecast("SP500", "ewmac16_64")

# How a trading rule performs across all instruments
system.accounts.pandl_for_trading_rule("ewmac16_64")

# All rules for one instrument
system.accounts.pandl_for_instrument_rules("SP500")

# SR cost for a given rule on an instrument
system.accounts.get_SR_cost_for_instrument_forecast("SP500", "ewmac16_64")

# Turnover of a rule for an instrument
system.accounts.forecast_turnover("SP500", "ewmac16_64")
```

---

*Source: pysystemtrade codebase — `systems/accounts/`*
*Created: 2026-04-27*
