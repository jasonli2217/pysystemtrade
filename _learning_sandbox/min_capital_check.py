"""
Which instruments can I trade with $1,000,000?

Combines two of Carver's instrument-selection constraints, using only the
CSV sim data (no MongoDB / IB production setup needed):

1. Bad markets / trading restrictions / duplicates -> pulled straight from
   config (these are properties of the instrument, not of your capital).
2. Minimum capital (the "4 contract rule") -> calculated per instrument from
   price, volatility and contract multiplier, using the exact formula from
   sysproduction/reporting/data/risk.py.
"""

import pandas as pd
from systems.provided.futures_chapter15.basesystem import futures_system
from sysdata.config.configdata import Config
from syscore.dateutils import ROOT_BDAYS_INYEAR

MY_CAPITAL = 1_000_000
RISK_TARGET_PCT = 25       # Carver/pysystemtrade default: 25% annualised
MIN_CONTRACTS_HELD = 4.0   # the "4 contract" rule of thumb

# Default Config() = no instrument list restriction, so we see the FULL
# instrument universe (252 instruments), not just the 6-instrument demo
# set built into futures_system()'s example config.
config = Config()
system = futures_system(config=config)
data = system.data

# --- Step 1: instruments already excluded regardless of capital ---
tradeable = set(system.get_instrument_list())
bad_markets = set(system.get_list_of_bad_markets())
trading_restricted = set(system.get_list_of_markets_with_trading_restrictions())
duplicates = set(system.get_list_of_duplicate_instruments_to_remove())

print(f"Instruments after removing bad/restricted/duplicate: {len(tradeable)}")

# --- Step 2: minimum capital per instrument ---
rows = []
for instrument_code in sorted(tradeable):
    try:
        price = data.get_raw_price(instrument_code).ffill().iloc[-1]
        multiplier = data.get_value_of_block_price_move(instrument_code)
        fx_rate = data.get_fx_for_instrument(
            instrument_code, system.config.base_currency
        ).ffill().iloc[-1]

        # get_daily_percentage_volatility already returns values in "20 = 20%"
        # units (it multiplies by 100 internally) - do NOT multiply by 100 again
        daily_pct_vol = system.rawdata.get_daily_percentage_volatility(
            instrument_code
        ).ffill().iloc[-1]
        ann_pct_vol = daily_pct_vol * ROOT_BDAYS_INYEAR  # e.g. 20.0 = 20%

        point_size_base = multiplier * fx_rate

        min_capital_one_contract = (
            point_size_base * price * ann_pct_vol / RISK_TARGET_PCT
        )
        min_capital_standalone = min_capital_one_contract * MIN_CONTRACTS_HELD

        rows.append(
            dict(
                instrument=instrument_code,
                price=price,
                ann_pct_vol=ann_pct_vol,
                min_capital_standalone=min_capital_standalone,
            )
        )
    except Exception:
        # missing/short data for this instrument - skip it
        continue

df = pd.DataFrame(rows).set_index("instrument")
df["affordable"] = df.min_capital_standalone <= MY_CAPITAL

affordable = df[df.affordable].sort_values("min_capital_standalone")
too_expensive = df[~df.affordable].sort_values("min_capital_standalone")

print(f"\nWith ${MY_CAPITAL:,.0f}: {len(affordable)} affordable, "
      f"{len(too_expensive)} too expensive (of {len(df)} priced instruments)")

print("\n--- Cheapest 15 instruments you CAN afford (standalone) ---")
print(affordable.head(15).to_string())

print("\n--- Cheapest 15 instruments you CANNOT yet afford ---")
print(too_expensive.head(15).to_string())

df.to_csv("_learning_sandbox/min_capital_results.csv")
print("\nFull results saved to _learning_sandbox/min_capital_results.csv")
