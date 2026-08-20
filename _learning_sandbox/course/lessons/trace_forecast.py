# _learning_sandbox/course/lessons/trace_forecast.py
# Lesson 2 — prove the EWMAC forecast to yourself, then watch scale -> cap.
from systems.provided.futures_chapter15.basesystem import futures_system

system = futures_system()
I, R = "EUROSTX", "ewmac8_32"

price = system.rawdata.get_daily_prices(I)
vol = system.rawdata.daily_returns_volatility(I)

# EWMAC by hand — the whole rule in three lines
my_raw = (price.ewm(span=8).mean() - price.ewm(span=32).mean()) / vol

pst_raw = system.rules.get_raw_forecast(I, R)
scaled = system.forecastScaleCap.get_scaled_forecast(I, R)
capped = system.forecastScaleCap.get_capped_forecast(I, R)

print("my raw    :", round(float(my_raw.iloc[-1]), 3))
print("pst raw   :", round(float(pst_raw.iloc[-1]), 3), "  <- should match!")
print("scaled    :", round(float(scaled.iloc[-1]), 3), "  (raw x 5.3)")
print("capped    :", round(float(capped.iloc[-1]), 3), "  (clipped at +/-20)")
