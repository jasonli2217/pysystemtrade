# _learning_sandbox/course/lessons/trace_portfolio.py
# Lesson 5 — subsystem position -> final notional position (contracts held).
from systems.provided.futures_chapter15.basesystem import futures_system

system = futures_system()
I = "EUROSTX"

subpos = system.positionSize.get_subsystem_position(I)
weights = system.portfolio.get_instrument_weights()
idm = system.portfolio.get_instrument_diversification_multiplier()
notional = system.portfolio.get_notional_position(I)

print("subsystem position:", round(float(subpos.iloc[-1]), 3))
print("instrument weight :", round(float(weights.iloc[-1][I]), 3))
print("IDM               :", round(float(idm.iloc[-1]), 3))
print("notional position :", round(float(notional.iloc[-1]), 3),
      " (= subsystem x weight x IDM)")
