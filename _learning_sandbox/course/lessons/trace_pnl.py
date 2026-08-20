# _learning_sandbox/course/lessons/trace_pnl.py
# Lesson 6 — P&L: portfolio Sharpe, gross vs net, and the diversification win.
from systems.provided.futures_chapter15.basesystem import futures_system

system = futures_system()
I = "EUROSTX"

p = system.accounts.portfolio()
print("portfolio Sharpe :", round(float(p.sharpe()), 3))
print("  gross / net    :", round(float(p.gross.sharpe()), 3),
      "/", round(float(p.net.sharpe()), 3))
print("EUROSTX alone    :", round(float(system.accounts.pandl_for_subsystem(I).sharpe()), 3),
      " (loser, yet portfolio wins)")
