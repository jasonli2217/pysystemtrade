# _learning_sandbox/course/lessons/trace_costs.py
# Lesson 7 — turnover and SR cost: why fast rules can be too expensive to trade.
from systems.provided.futures_chapter15.basesystem import futures_system

system = futures_system()
I = "EUROSTX"

fast_turnover = system.accounts.forecast_turnover(I, "ewmac8_32")
slow_turnover = system.accounts.forecast_turnover(I, "ewmac64_256")
sr_cost = system.accounts.get_SR_cost_per_trade_for_instrument(I)

print("ewmac8_32  turnover:", round(float(fast_turnover), 2), " (fast, churny)")
print("ewmac64_256 turnover:", round(float(slow_turnover), 2), " (slow, calm)")
print("SR cost per trade   :", round(float(sr_cost), 5))
