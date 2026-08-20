# _learning_sandbox/course/lessons/trace_pipeline.py
from systems.provided.futures_chapter15.basesystem import futures_system

system = futures_system()

# This config trades only 6 instruments; pick one that's actually in it.
I = "EUROSTX"  # European equity index (SP500 is NOT in this universe!)

price = system.rawdata.get_daily_prices(I)
raw = system.rules.get_raw_forecast(I, "ewmac8_32")
capped = system.forecastScaleCap.get_capped_forecast(I, "ewmac8_32")
combined = system.combForecast.get_combined_forecast(I)
position = system.portfolio.get_notional_position(I)

for name, series in [
    ("1 price", price),
    ("2 raw fc", raw),
    ("3 capped fc", capped),
    ("4 combined fc", combined),
    ("6 position", position),
]:
    print(name, "->", round(float(series.iloc[-1]), 3))
