"""
Wire a 'realistic' backtest instrument universe into pysystemtrade's own
exclusion machinery, instead of maintaining a separate whitelist.

Combines two of Carver's instrument-selection filters, using only static
CSV data (no broker/production database required):

1. COST -> config.exclude_instrument_lists['bad_markets']
   Any instrument whose risk-adjusted cost per trade is above 0.01 SR
   units (Carver's 'bad market' cost threshold) - where NO family member
   (see below) passes either.

2. DUPLICATES -> config.duplicate_instruments['exclude'] / ['include']
   Detect instrument 'families' that trade the same underlying at
   different contract sizes (e.g. SP500 / SP500_micro) via naming
   convention, then keep the SMALLEST-contract-size family member that
   passes the cost filter (Carver's actual rule from docs/instruments.md).

3. LIQUIDITY / TRADING RESTRICTIONS -> NOT computed here. These map to
   config.exclude_instrument_lists['bad_markets'] (liquidity) and
   ['trading_restrictions'] (regulatory) too, but need data/judgement
   this script doesn't have - fill in manually if relevant to you.

IMPORTANT GOTCHA #1: system.get_instrument_list() does NOT remove
bad_markets or trading_restrictions BY DEFAULT - only duplicates and
ignored instruments (remove_bad_markets=False, remove_trading_restrictions
=False are the literal defaults in systems/basesystem.py). Out of the box,
a 'bad market' just ends up with zero instrument weight later, but is
still present in the base list. If you want it gone from the backtest
itself, you have to ask for that explicitly.

IMPORTANT GOTCHA #2: get_instrument_list() is decorated with
@base_system_cache(), which is called with use_arg_names=False
(systems/system_cache.py) - meaning its cache key does NOT depend on which
arguments you passed. Call it once with defaults, then again with
different remove_bad_markets/remove_trading_restrictions flags on the SAME
system object, and the second call silently returns the FIRST (stale)
result instead of recomputing. This script avoids that by calling
get_instrument_list() with the flags it actually wants as the only call
before locking the result into config.instruments (and building a fresh
system afterwards).
"""

import re
import pandas as pd
import yaml
from systems.provided.futures_chapter15.basesystem import futures_system
from sysdata.config.configdata import Config

MAX_SR_COST = 0.01

SUFFIX_PATTERN = re.compile(r"([_-](micro|mini|large))+$", re.IGNORECASE)

# --- Pass 1: build a throwaway system with NO exclusions yet, just to get
#     cost + contract size for every instrument we have data for ---
scratch_system = futures_system(config=Config())
data = scratch_system.data

tradeable = sorted(scratch_system.get_instrument_list())

rows = []
for instrument_code in tradeable:
    try:
        instrument_costs = data.get_raw_cost_data(instrument_code)
        multiplier = data.get_value_of_block_price_move(instrument_code)
        price = data.get_raw_price(instrument_code).ffill().iloc[-1]
        ann_stdev_price_units = (
            scratch_system.rawdata.annualised_returns_volatility(instrument_code)
            .ffill()
            .iloc[-1]
        )
        sr_cost = instrument_costs.calculate_sr_cost(
            block_price_multiplier=multiplier,
            price=price,
            ann_stdev_price_units=ann_stdev_price_units,
        )
        rows.append(dict(instrument=instrument_code, sr_cost=sr_cost, multiplier=multiplier))
    except Exception:
        continue

df = pd.DataFrame(rows).set_index("instrument")
df["root"] = [SUFFIX_PATTERN.sub("", code) for code in df.index]

# --- Pass 2: resolve families -> bad_markets list + duplicate exclude/include dicts ---
bad_markets = []
duplicate_exclude = {}
duplicate_include = {}

for root, family in df.groupby("root"):
    passing = family[family.sr_cost <= MAX_SR_COST]

    if passing.empty:
        # whole family fails cost -> bad market, not a duplicate issue
        bad_markets.extend(family.index.tolist())
        continue

    best = passing.multiplier.idxmin()
    dropped = [c for c in family.index if c != best]

    if dropped:
        duplicate_exclude[root] = dropped
        duplicate_include[root] = best

bad_markets = sorted(bad_markets)

exclude_instrument_lists = dict(
    bad_markets=bad_markets,
    trading_restrictions=[],   # fill in yourself: markets your broker/account can't trade
    ignore_instruments=[],     # fill in yourself: anything else you want to blocklist
)
duplicate_instruments = dict(
    exclude=duplicate_exclude,
    include=duplicate_include,
)

# --- Save as YAML so it's reusable / inspectable outside this script ---
with open("_learning_sandbox/exclusion_config.yaml", "w") as f:
    yaml.safe_dump(
        dict(
            exclude_instrument_lists=exclude_instrument_lists,
            duplicate_instruments=duplicate_instruments,
        ),
        f,
        default_flow_style=False,
        sort_keys=False,
    )
print("Saved _learning_sandbox/exclusion_config.yaml")

# --- Build the REAL system with these exclusions wired in ---
config = Config("_learning_sandbox/exclusion_config.yaml")
system = futures_system(config=config)

print(f"\nRaw universe: {len(tradeable)}")
print(f"system.get_list_of_bad_markets(): {len(system.get_list_of_bad_markets())}")
print(f"system.get_list_of_duplicate_instruments_to_remove(): "
      f"{len(system.get_list_of_duplicate_instruments_to_remove())}")

# NOTE: this MUST be the first (and only) call to get_instrument_list() on
# this system object - see GOTCHA #2 above. Calling the plain no-args
# version first, then this, would silently return the earlier cached
# result instead of recomputing.
fully_filtered = system.get_instrument_list(
    remove_bad_markets=True, remove_trading_restrictions=True
)
print(f"system.get_instrument_list(remove_bad_markets=True, "
      f"remove_trading_restrictions=True): {len(fully_filtered)}")

# Lock this in as config.instruments so EVERY stage of the system (not just
# a get_instrument_list() call you remember to flag) consistently uses the
# fully filtered set for the actual backtest, and rebuild fresh so there's
# no stale cache left over from the calls above.
config.instruments = fully_filtered
system = futures_system(config=config)
print(f"\nFinal backtest-ready system.get_instrument_list(): "
      f"{len(system.get_instrument_list())}")

print(
    "\nTo reuse this in a new notebook/script:\n"
    "  from sysdata.config.configdata import Config\n"
    "  from systems.provided.futures_chapter15.basesystem import futures_system\n"
    "  config = Config('_learning_sandbox/exclusion_config.yaml')\n"
    "  system = futures_system(config=config)\n"
    "  config.instruments = system.get_instrument_list(\n"
    "      remove_bad_markets=True, remove_trading_restrictions=True)\n"
    "  system = futures_system(config=config)  # rebuild fresh, avoids stale cache"
)
