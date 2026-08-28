"""
Which instruments are too expensive to trade, on cost grounds?

Carver's rule (docs/instruments.md): a 'bad market' has a risk-adjusted
cost per trade > 0.01 SR units.

This uses instrumentCosts.calculate_sr_cost(), the exact function pysystemtrade
uses internally, fed with STATIC data only:
  - commission/spread from data/futures/csvconfig/instrumentconfig.csv
  - real bid/ask spread estimates from data/futures/csvconfig/spreadcosts.csv
  - price + volatility from the CSV price history

No broker connection or production database needed for the COST side.
(Liquidity/volume checks still need real broker/production data - see note
at the bottom.)
"""

import pandas as pd
from systems.provided.futures_chapter15.basesystem import futures_system
from sysdata.config.configdata import Config

MAX_SR_COST = 0.01  # Carver's threshold for a 'bad market'

config = Config()
system = futures_system(config=config)
data = system.data

tradeable = sorted(system.get_instrument_list())

rows = []
for instrument_code in tradeable:
    try:
        instrument_costs = data.get_raw_cost_data(instrument_code)
        multiplier = data.get_value_of_block_price_move(instrument_code)
        price = data.get_raw_price(instrument_code).ffill().iloc[-1]

        # annualised vol in PRICE units (not %) - what calculate_sr_cost expects
        ann_stdev_price_units = (
            system.rawdata.annualised_returns_volatility(instrument_code)
            .ffill()
            .iloc[-1]
        )

        sr_cost_per_trade = instrument_costs.calculate_sr_cost(
            block_price_multiplier=multiplier,
            price=price,
            ann_stdev_price_units=ann_stdev_price_units,
        )

        rows.append(
            dict(
                instrument=instrument_code,
                sr_cost_per_trade=sr_cost_per_trade,
            )
        )
    except Exception:
        # missing/short data for this instrument - skip it
        continue

df = pd.DataFrame(rows).set_index("instrument")
df["bad_on_cost"] = df.sr_cost_per_trade > MAX_SR_COST

cheap = df[~df.bad_on_cost].sort_values("sr_cost_per_trade")
expensive = df[df.bad_on_cost].sort_values("sr_cost_per_trade", ascending=False)

print(f"Checked {len(df)} instruments (of {len(tradeable)} in universe, "
      f"some skipped for missing cost/price data)")
print(f"{len(cheap)} pass the {MAX_SR_COST} SR-cost threshold, "
      f"{len(expensive)} are 'bad markets' on cost alone")

print("\n--- 15 most expensive instruments (candidates to exclude) ---")
print(expensive.head(15).to_string())

print("\n--- 15 cheapest instruments ---")
print(cheap.head(15).to_string())

df.to_csv("_learning_sandbox/cost_check_results.csv")
print("\nFull results saved to _learning_sandbox/cost_check_results.csv")

print(
    "\nNOTE: this only screens on COST. Carver's other 'bad market' filters"
    " - <100 contracts/day and <$1.5m risk volume/day - need real traded"
    " volume data, which isn't in the CSV price files. Those need a live"
    " broker feed or Carver's production database (sysproduction interactive_controls)."
)
