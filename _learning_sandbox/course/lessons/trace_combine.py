# _learning_sandbox/course/lessons/trace_combine.py
# Lesson 3 — how several rules blend into one combined forecast.
from systems.provided.futures_chapter15.basesystem import futures_system

system = futures_system()
I = "EUROSTX"

weights = system.combForecast.get_forecast_weights(I)
fdm = system.combForecast.get_forecast_diversification_multiplier(I)
combined = system.combForecast.get_combined_forecast(I)

print("weights:", {k: round(float(v), 2) for k, v in weights.iloc[-1].items()})
print("FDM    :", round(float(fdm.iloc[-1]), 3))
print("combined:", round(float(combined.iloc[-1]), 3))
