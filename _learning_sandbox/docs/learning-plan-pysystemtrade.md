****# Learning Plan — pysystemtrade from Zero to Live Trading

#pysystemtrade #learning #plan

---

## How to Use This Plan

- Each **Phase** builds on the previous one — don't skip ahead
- Each **Step** within a phase has: what to do, what to read, what to understand, and a checkpoint
- **Checkpoint** = you should be able to answer the questions before moving on
- Estimated pace: **1–2 hours/day**. Some steps take 1 session, some take 2–3
- Use AI agents to ask questions at any point — paste code and ask "what does this do?"

---

## Phase 1: Get a Backtest Running (Days 1–3)

> **Goal:** Run a working backtest with the provided example system and see P&L output. Don't try to understand all the code yet — just get the dopamine hit of seeing it work.

### Step 1.1 — Verify Your Environment

**Do:**
```python
# In your terminal, from the project root:
uv run python -c "from sysdata.sim.csv_futures_sim_data import csvFuturesSimData; data = csvFuturesSimData(); print(data.get_instrument_list())"
```

**Understand:** If this prints a list of instrument codes (SP500, BUND, etc.), your install works. If it errors, fix the install first.

**Checkpoint:** ✅ You see a list of 100+ instrument codes printed.

---

### Step 1.2 — Run the Chapter 15 System

**Do:** Create a file `aaa_learn/run_my_first_backtest.py`:
```python
from systems.provided.futures_chapter15.basesystem import futures_system
system = futures_system()
print(system)
print(system.accounts.portfolio().sharpe())
```

Run it: `uv run python aaa_learn/run_my_first_backtest.py`

**Understand:** You just ran a full backtesting pipeline — prices → forecasts → positions → P&L. The Sharpe ratio is the key number. It will take a few minutes to compute.

**Checkpoint:** ✅ You see a Sharpe ratio number printed (should be roughly 0.5–1.0).

---

### Step 1.3 — Explore the Output

**Do:** Extend your script:
```python
from systems.provided.futures_chapter15.basesystem import futures_system
system = futures_system()

# What instruments are we trading?
print(system.get_instrument_list())

# Portfolio-level P&L
portfolio = system.accounts.portfolio()
print("Sharpe:", portfolio.sharpe())
print("Annual return:", portfolio.ann_mean())
print("Annual std:", portfolio.ann_std())

# P&L for one instrument
sp500 = system.accounts.pandl_for_instrument("SP500")
print("SP500 Sharpe:", sp500.sharpe())

# What trading rules are used?
rules = system.rules.trading_rules().keys()
print("Trading rules:", list(rules))

# See a forecast
forecast = system.combForecast.get_combined_forecast("SP500")
print(forecast.tail(10))
```

**Understand:** Every `system.XXX.method()` call reaches into the pipeline. You're calling different stages: `system.rules`, `system.combForecast`, `system.accounts`. Each returns pandas data.

**Checkpoint:** ✅ You can print a forecast, see instrument list, and get P&L for a single instrument.

---

## Phase 2: Understand What You Just Ran (Days 4–10)

> **Goal:** Understand the pipeline architecture, what each stage does, and how data flows through the system. Read code, but focus on the *concepts*, not every line.

### Step 2.1 — Read the Architecture Overview

**Read:**
- [[systems-folder-overview]] — your Obsidian note
- [[codebase-architecture-reference]] — Section 4 (Backtesting System)

**Understand:** The pipeline is a chain: `rawdata → rules → forecastScaleCap → combForecast → positionSize → portfolio → accounts`. Each stage is a Python class that inherits from `SystemStage`. They're all connected via `self.parent`.

**Checkpoint:** ✅ You can draw the pipeline from memory and name all 7 stages.

---

### Step 2.2 — Understand System and SystemStage

**Read:**
- [[basesystem-and-stage-line-by-line]] — your existing Obsidian note

**Do:** In a Python REPL:
```python
from systems.provided.futures_chapter15.basesystem import futures_system
system = futures_system()

# See all stages
print(system.stage_names)

# Each stage has a .parent pointing back to system
print(system.rawdata.parent is system)   # True

# Each stage has methods you can call
print(system.rawdata.methods())
```

**Understand:**
- `System` is the container. It owns `data`, `config`, and all stages
- `SystemStage` is the base class. Every stage gets its `self.parent` link via `system_init()`
- `setattr(self, stage.name, stage)` is the magic that makes `system.rawdata` work
- The underscore convention (`_parent` vs `parent`) = private storage + public property

**Checkpoint:** ✅ You can explain in your own words: how does `system.rawdata` come to exist? What does `self.parent` give you?

---

### Step 2.3 — Understand Config

**Read:** `sysdata/config/configdata.py` (just the first 100 lines)

**Do:**
```python
system = futures_system()
config = system.config

# See what's in the config
print(config)
print(config.forecast_weights)
print(config.instrument_weights)
print(config.percentage_vol_target)
print(config.forecast_cap)
```

**Read the YAML:** Open `systems/provided/futures_chapter15/futuresconfig.yaml` and compare what you see in the YAML with what `config.forecast_weights` returns.

**Understand:**
- `Config` loads a YAML file and turns every top-level key into an attribute
- Missing values fall back to `sysdata/config/defaults.yaml`
- Config merge order: your YAML → private config → defaults

**Checkpoint:** ✅ You can find where `forecast_cap` is defined (defaults.yaml), and you understand how a YAML key becomes `config.forecast_cap`.

---

### Step 2.4 — Understand Data Flow (simData)

**Read:** `sysdata/sim/sim_data.py` (lines 1–100)

**Do:**
```python
system = futures_system()
data = system.data

# These are the raw data methods
prices = data.daily_prices("SP500")
print(type(prices))   # pd.Series
print(prices.tail())

# The data object reads from CSV files in data/futures/
```

**Understand:**
- `simData` is the data access layer for backtesting
- `csvFuturesSimData` reads from CSV files in `data/futures/`
- It provides methods like `daily_prices()`, `get_raw_price()`, `get_fx_for_instrument()`
- It's not a DataFrame itself — it's a class with methods that *return* DataFrames

**Checkpoint:** ✅ You can fetch prices and FX data for any instrument. You understand that `data` is an object with methods, not a DataFrame.

---

### Step 2.5 — Trace One Forecast Through the Pipeline

**Do:** Pick SP500 and trace the EWMAC8_32 signal step by step:
```python
system = futures_system()

# Step 1: Raw price (from data)
price = system.rawdata.get_daily_prices("SP500")
print("1. Raw price:", price.tail(3))

# Step 2: Raw forecast (from rules stage)
raw = system.rules.get_raw_forecast("SP500", "ewmac8_32")
print("2. Raw forecast:", raw.tail(3))

# Step 3: Scaled forecast (from forecastScaleCap)
scaled = system.forecastScaleCap.get_scaled_forecast("SP500", "ewmac8_32")
print("3. Scaled forecast:", scaled.tail(3))

# Step 4: Capped forecast
capped = system.forecastScaleCap.get_capped_forecast("SP500", "ewmac8_32")
print("4. Capped forecast (max ±20):", capped.tail(3))

# Step 5: Combined forecast (weighted average of all rules)
combined = system.combForecast.get_combined_forecast("SP500")
print("5. Combined forecast:", combined.tail(3))

# Step 6: Subsystem position (contracts, before portfolio weights)
subpos = system.positionSize.get_subsystem_position("SP500")
print("6. Subsystem position:", subpos.tail(3))

# Step 7: Portfolio position (after instrument weights + IDM)
pos = system.portfolio.get_notional_position("SP500")
print("7. Portfolio position:", pos.tail(3))
```

**Understand:** Each line calls a method on a different stage. Each stage uses `self.parent.previous_stage.method()` internally to get its input. The data flows forward through the pipeline, transforming at each stage.

**Checkpoint:** ✅ You can explain what each of the 7 outputs represents and roughly how each transforms the previous one.

---

### Step 2.6 — Understand the Cache

**Do:**
```python
system = futures_system()

# Trigger some calculations
system.rawdata.get_daily_prices("SP500")
system.combForecast.get_combined_forecast("SP500")

# Now look at what's cached
print(system.cache)
```

**Understand:**
- `@diagnostic` and `@output` decorators cache results so they're computed once
- `@input` and `@dont_cache` do NOT cache — they're just documentation labels
- Cache key = `(stage_name, method_name, instrument_code)`
- This is why the first run is slow and subsequent calls are instant

**Checkpoint:** ✅ You can explain why calling `system.rawdata.get_daily_prices("SP500")` twice only computes once.

---

## Phase 3: Understand Trading Rules (Days 11–16)

> **Goal:** Understand how trading rules work in the code, how forecasts are generated, scaled, and combined.

### Step 3.1 — Read the TradingRule Class

**Read:** `systems/trading_rules.py` — focus on the `TradingRule` class (first ~100 lines)

**Do:**
```python
system = futures_system()
rules = system.rules.trading_rules()
print(list(rules.keys()))

# Inspect one rule
ewmac = rules["ewmac8_32"]
print(ewmac)
print("Function:", ewmac.function)
print("Data:", ewmac.data)
print("Other args:", ewmac.other_args)
```

**Understand:** A `TradingRule` is just a container: a function + what data to feed it + extra parameters. The `Rules` stage calls this function for each instrument to produce a raw forecast.

**Checkpoint:** ✅ You can name the 3 components of a `TradingRule` and explain what each one is.

---

### Step 3.2 — Read the Actual EWMAC Function

**Read:** `systems/provided/rules/ewmac.py`

**Understand:**
- EWMAC = difference between fast EMA and slow EMA of price
- Divided by price volatility to normalise
- Output is a raw forecast (not yet scaled to ±20)

**Do:** Implement EWMAC yourself in plain pandas to verify you understand:
```python
import pandas as pd
system = futures_system()
price = system.rawdata.get_daily_prices("SP500")
vol = system.rawdata.daily_returns_volatility("SP500")

fast_ema = price.ewm(span=8).mean()
slow_ema = price.ewm(span=32).mean()
raw_forecast = (fast_ema - slow_ema) / vol

# Compare with pysystemtrade
pst_forecast = system.rules.get_raw_forecast("SP500", "ewmac8_32")
print(raw_forecast.tail(5))
print(pst_forecast.tail(5))
# They should be very similar (not identical due to vol calc differences)
```

**Checkpoint:** ✅ You can write EWMAC from scratch in 5 lines of pandas.

---

### Step 3.3 — Understand Forecast Scaling and Capping

**Read:** `systems/forecast_scale_cap.py` — just the main methods (search for `get_forecast_scalar`)

**Do:**
```python
system = futures_system()

# The scalar makes the average absolute forecast = 10
scalar = system.forecastScaleCap.get_forecast_scalar("SP500", "ewmac8_32")
print("Forecast scalar:", scalar)

# Raw × scalar = scaled, then capped at ±20
raw = system.rules.get_raw_forecast("SP500", "ewmac8_32")
scaled = system.forecastScaleCap.get_scaled_forecast("SP500", "ewmac8_32")
capped = system.forecastScaleCap.get_capped_forecast("SP500", "ewmac8_32")

print("Raw mean abs:", raw.abs().mean())
print("Scaled mean abs:", scaled.abs().mean())   # should be ~10
print("Max capped:", capped.max(), "Min:", capped.min())  # ±20
```

**Understand:** Scaling ensures all rules speak the same "language" — a forecast of +10 always means the same thing regardless of which rule produced it. Capping at ±20 prevents extreme bets.

**Checkpoint:** ✅ You understand why we scale (normalisation) and cap (risk control).

---

### Step 3.4 — Understand Forecast Combination

**Read:** `systems/forecast_combine.py` — just search for `get_combined_forecast` and `get_forecast_weights`

**Do:**
```python
system = futures_system()
weights = system.combForecast.get_forecast_weights("SP500")
print(weights.tail(3))

fdm = system.combForecast.get_forecast_diversification_multiplier("SP500")
print("FDM:", fdm.tail(3))

combined = system.combForecast.get_combined_forecast("SP500")
print(combined.tail(3))
```

**Understand:**
- Combined forecast = Σ(weight × capped forecast) × FDM
- FDM > 1 because diversified forecasts have lower vol than the sum of parts
- Weights can be fixed (from config YAML) or estimated (fitted from data)

**Checkpoint:** ✅ You can explain what FDM does and why it's > 1.

---

### Step 3.5 — Understand Position Sizing

**Read:** `systems/positionsizing.py` — search for `get_subsystem_position` and `get_volatility_scalar`

**Do:**
```python
system = futures_system()

vol_scalar = system.positionSize.get_volatility_scalar("SP500")
print("Vol scalar (avg):", vol_scalar.mean())

subpos = system.positionSize.get_subsystem_position("SP500")
print("Subsystem position:", subpos.tail(5))

# The formula:
# position = combined_forecast/10 × (capital × risk_target%) / (daily_vol × value_per_point × fx_rate)
```

**Understand:** This is where forecasts become contract counts. The vol targeting formula ensures each instrument contributes roughly the same risk to the portfolio.

**Checkpoint:** ✅ You can explain how a forecast of +10 becomes a number of contracts.

---

## Phase 4: Modify the Config (Days 17–22)

> **Goal:** Learn to customise the system by editing the YAML config — change instruments, rules, weights, risk target. No code changes yet, just config.

### Step 4.1 — Create Your Own Config

**Do:** Copy the chapter 15 config and make a small modification:
```bash
cp systems/provided/futures_chapter15/futuresconfig.yaml aaa_learn/myconfig.yaml
```

Edit `aaa_learn/myconfig.yaml`:
- Change `percentage_vol_target` from 25 to 12 (halve the risk)
- Remove some instruments from `instrument_weights`

**Run it:**
```python
from sysdata.sim.csv_futures_sim_data import csvFuturesSimData
from sysdata.config.configdata import Config
from systems.provided.futures_chapter15.basesystem import futures_system

system = futures_system(config=Config("aaa_learn/myconfig.yaml"))
print("Risk target:", system.config.percentage_vol_target)
print("Instruments:", system.get_instrument_list())
print("Sharpe:", system.accounts.portfolio().sharpe())
```

**Checkpoint:** ✅ You can modify config and see the effect on output.

---

### Step 4.2 — Add/Remove Trading Rules

**Do:** Edit your config to use only EWMAC rules (remove carry):
```yaml
trading_rules:
  ewmac8_32:
    function: systems.provided.rules.ewmac.ewmac_forecast_with_defaults
    data:
      - rawdata.get_daily_prices
      - rawdata.daily_returns_volatility
    other_args:
      Lfast: 8
      Lslow: 32
  ewmac16_64:
    function: systems.provided.rules.ewmac.ewmac_forecast_with_defaults
    data:
      - rawdata.get_daily_prices
      - rawdata.daily_returns_volatility
    other_args:
      Lfast: 16
      Lslow: 64
```

Run the backtest and compare Sharpe.

**Understand:** Trading rules are defined entirely in YAML. The `function` key points to a Python function using dotted path notation. `data` specifies which stage methods to call. `other_args` are extra keyword arguments.

**Checkpoint:** ✅ You can define a trading rule in YAML and understand what each key means.

---

### Step 4.3 — Experiment with Weights

**Do:** Try different forecast weights and instrument weights. Compare results:
```python
# Equal weight vs optimised
# Fixed weights vs estimated weights
```

**Understand:** The config file is the primary way users customise the system. Code changes are for structural modifications; config changes are for parameter tuning.

---

## Phase 5: Understand Costs and P&L (Days 23–28)

> **Goal:** Understand the accounts module — how P&L is calculated, how costs work.

### Step 5.1 — Explore P&L at Different Levels

**Read:** [[accounts-stage-architecture]]

**Do:**
```python
system = futures_system()

# Level 1: One forecast, one instrument
f_pnl = system.accounts.pandl_for_instrument_forecast("SP500", "ewmac8_32")
print("EWMAC8 on SP500:", f_pnl.sharpe())

# Level 2: All rules on one instrument
r_pnl = system.accounts.pandl_for_instrument_rules("SP500")
print("All rules on SP500:", r_pnl.sharpe())

# Level 3: One instrument in portfolio
i_pnl = system.accounts.pandl_for_instrument("SP500")
print("SP500 in portfolio:", i_pnl.sharpe())

# Level 4: One instrument as subsystem
s_pnl = system.accounts.pandl_for_subsystem("SP500")
print("SP500 subsystem:", s_pnl.sharpe())

# Level 5: Whole portfolio
p_pnl = system.accounts.portfolio()
print("Portfolio:", p_pnl.sharpe())

# Gross vs net
print("Gross:", p_pnl.gross.sharpe())
print("Net:", p_pnl.net.sharpe())
print("Costs:", p_pnl.costs.ann_mean())
```

**Checkpoint:** ✅ You understand the difference between subsystem, instrument, and portfolio level P&L. You know what gross vs net means.

---

### Step 5.2 — Understand SR Costs

**Do:**
```python
system = futures_system()

# Cost per trade (in SR units)
sr_cost = system.accounts.get_SR_cost_per_trade_for_instrument("SP500")
print("SR cost per trade:", sr_cost)

# Turnover for a rule
turnover = system.accounts.forecast_turnover("SP500", "ewmac8_32")
print("EWMAC8 turnover:", turnover)

# Total cost for this rule
total = system.accounts.get_SR_cost_for_instrument_forecast("SP500", "ewmac8_32")
print("Total SR cost:", total)
```

**Understand:** SR cost = cost expressed as a fraction of annual volatility. It's dimensionless, so you can compare costs across instruments. Higher turnover = higher costs.

**Checkpoint:** ✅ You can calculate the SR cost drag for any rule/instrument combination.

---

## Phase 6: Write Your First Custom Rule (Days 29–35)

> **Goal:** Write a new trading rule function and add it to the system.

### Step 6.1 — Study Existing Rule Functions

**Read these files:**
- `systems/provided/rules/ewmac.py`
- `systems/provided/rules/carry.py`

**Understand the pattern:** Every rule function:
1. Takes price data (and optionally vol) as input
2. Returns a `pd.Series` — the raw forecast
3. Is a plain function (not a class method)

---

### Step 6.2 — Write a Simple Momentum Rule

**Do:** Create `aaa_learn/my_rules.py`:
```python
import pandas as pd

def simple_momentum(price: pd.Series, vol: pd.Series, lookback: int = 64) -> pd.Series:
    """
    Simple price momentum: current price vs price N days ago,
    normalised by volatility.
    """
    momentum = price - price.shift(lookback)
    forecast = momentum / vol
    return forecast
```

---

### Step 6.3 — Add Your Rule to the Config

**Do:** Add to your `myconfig.yaml`:
```yaml
trading_rules:
  my_momentum_64:
    function: aaa_learn.my_rules.simple_momentum
    data:
      - rawdata.get_daily_prices
      - rawdata.daily_returns_volatility
    other_args:
      lookback: 64
  # keep existing rules too...
```

Run the backtest. Check the forecast scalar and Sharpe.

**Checkpoint:** ✅ You have written and backtested your own trading rule.

---

### Step 6.4 — Add Multiple Variations

**Do:** Add `my_momentum_32` and `my_momentum_128` with different lookbacks. Set forecast weights. Compare performance.

**Checkpoint:** ✅ You understand how to create a family of rules from one function.

---

## Phase 7: Deep Dive — Python Patterns (Days 36–45)

> **Goal:** Now that you've used the system, go deeper into the Python patterns that make it work. These will make you comfortable reading *any* part of the codebase.

### Step 7.1 — Inheritance in Practice

**Study:** How `Account` inherits from 6+ classes. Read [[accounts-stage-architecture]].

**Key insight:** Inheritance in pysystemtrade is used as **composition** — each parent class adds one set of methods. The child doesn't override anything; it just collects them all.

**Exercise:** Open `systems/rawdata.py`. Find its parent class. Trace how `self.parent.data.daily_prices()` works across the class boundary.

---

### Step 7.2 — Decorators in Practice

**Study:** `systems/system_cache.py` — lines 717–793 (the decorator definitions)

**Key insight:** A decorator is just a function that wraps another function. `@diagnostic` wraps stage methods so their results are cached. That's all it does.

**Exercise:** Add a `print("CACHE MISS")` to the cache's `calc_or_cache` method, then run a backtest and watch when it prints.

---

### Step 7.3 — Properties in Practice

**Study:** The `_parent` / `parent` pattern used everywhere.

**Key insight:** `@property` lets you define what happens when someone reads `self.parent`. It's like a function disguised as an attribute. Used for: safe fallbacks, lazy computation, read-only access.

---

## Phase 8: Data Management (Days 46–55)

> **Goal:** Understand how data flows into the system, learn to add new instruments, manage data updates.

### Step 8.1 — Understand CSV Data Layout

**Explore:**
- `data/futures/adjusted_prices_csv/` — one CSV per instrument
- `data/futures/multiple_prices_csv/` — PRICE, CARRY, FORWARD columns
- `data/futures/fx_prices_csv/` — FX rates
- `data/futures/csvconfig/instrumentconfig.csv` — instrument metadata
- `data/futures/csvconfig/spreadcosts.csv` — cost data

**Checkpoint:** ✅ You can find the raw data file for any instrument and understand its columns.

---

### Step 8.2 — Understand the Data Class Hierarchy

**Read:** [[codebase-architecture-reference]] — Section 3

**Key pattern:**
```
baseData (abstract)
    → futuresAdjustedPricesData (abstract interface)
        → csvFuturesAdjustedPricesData (reads CSV)
        → parquetFuturesAdjustedPricesData (reads Parquet)
```

**Checkpoint:** ✅ You understand why there are 3 layers and how to swap backends.

---

### Step 8.3 — Update Data from IB

**Do:** (requires IB account + TWS running)
```bash
# Download latest prices for all instruments
uv run python sysproduction/update_historical_prices.py
```

This is a preview of what production does. Don't worry about running it yet — just read the script to understand the flow.

---

## Phase 9: Production Setup (Days 56–75)

> **Goal:** Set up the production infrastructure to run live.

### Step 9.1 — Understand the Production Architecture

**Read:** [[codebase-architecture-part2]] — Sections 6, 7, 8

**Key concepts:**
- `dataBlob` replaces `simData` in production — provides DB + broker connections
- Orders flow through 3 layers: instrument → contract → broker
- Cron jobs run daily scripts in sequence

---

### Step 9.2 — Set Up MongoDB and Parquet Storage

**Do:** Follow the pysystemtrade docs to:
1. Install MongoDB
2. Set up `private_config.yaml` with DB connection strings
3. Transfer CSV data to Parquet: `sysinit/transfer/` scripts

---

### Step 9.3 — Set Up IB Connection

**Do:**
1. Configure IB Gateway (not TWS — more stable)
2. Set up `private_config.yaml` with IB connection settings
3. Test connection:
```python
from sysbrokers.IB.ib_connection import connectionIB
conn = connectionIB()
print(conn)
```

---

### Step 9.4 — Run Each Production Script Manually

Run each `sysproduction/run_*.py` script one at a time, in order, and inspect what it did:
1. `run_daily_fx_and_contract_updates.py`
2. `run_daily_price_updates.py`
3. `run_daily_update_multiple_adjusted_prices.py`
4. `run_systems.py`
5. `run_strategy_order_generator.py`
6. `run_stack_handler.py` (paper trade first!)
7. `run_capital_update.py`

---

### Step 9.5 — Set Up Cron/Scheduler

Automate the daily sequence. Use the schedule from `syscontrol/control_config.yaml`.

---

## Phase 10: Go Live (Days 76+)

> **Goal:** Paper trade first, then go live with real money.

### Step 10.1 — Paper Trade for 2+ Weeks

Run the full production system against IB paper trading account. Monitor via:
- `sysproduction/interactive_diagnostics.py`
- `sysproduction/interactive_order_stack.py`
- Daily reports from `run_reports.py`

### Step 10.2 — Verify Everything

Before real money, confirm:
- [ ] Positions match what backtest suggests
- [ ] Costs are reasonable
- [ ] Roll handling works correctly
- [ ] Capital tracking is accurate
- [ ] Email alerts are working

### Step 10.3 — Go Live

Switch to live IB account. Start with low capital. Scale up gradually.

---

## Quick Reference: Which Phase Am I In?

| I want to...                                         | Go to    |
| ---------------------------------------------------- | -------- |
| Just run something and see output                    | Phase 1  |
| Understand the pipeline and stages                   | Phase 2  |
| Understand trading rules and forecasts               | Phase 3  |
| Change config (instruments, rules, weights)          | Phase 4  |
| Understand P&L and costs                             | Phase 5  |
| Write my own trading rule                            | Phase 6  |
| Understand Python patterns (inheritance, decorators) | Phase 7  |
| Manage data and add instruments                      | Phase 8  |
| Set up production infrastructure                     | Phase 9  |
| Go live                                              | Phase 10 |

---

## Companion Obsidian Notes

As you progress, build your knowledge base with these notes:

- [[basesystem-and-stage-line-by-line]] ✅ (done)
- [[systems-folder-overview]] ✅ (done)
- [[accounts-stage-architecture]] ✅ (done)
- [[codebase-architecture-reference]] ✅ (done)
- [[codebase-architecture-part2]] ✅ (done)
- [[trading-rules-explained]] (create in Phase 3)
- [[config-reference]] (create in Phase 4)
- [[data-management-guide]] (create in Phase 8)
- [[production-setup-guide]] (create in Phase 9)

---

*Created: 2026-05-05*
