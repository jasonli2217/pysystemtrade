# _learning_sandbox/course/lessons/trace_position.py
# Lesson 4 — how a combined forecast becomes a subsystem position (contracts).
from systems.provided.futures_chapter15.basesystem import futures_system

system = futures_system()
I = "EUROSTX"

combined = system.combForecast.get_combined_forecast(I)
avg_pos = system.positionSize.get_average_position_at_subsystem_level(I)
subpos = system.positionSize.get_subsystem_position(I)

print("capital / vol target:", system.positionSize.get_notional_trading_capital(),
      "/", system.positionSize.get_percentage_vol_target(), "%")
print("combined forecast :", round(float(combined.iloc[-1]), 3))
print("average position  :", round(float(avg_pos.iloc[-1]), 3), " (bet at forecast=10)")
print("subsystem position:", round(float(subpos.iloc[-1]), 3),
      " (= forecast/10 x avg)")
