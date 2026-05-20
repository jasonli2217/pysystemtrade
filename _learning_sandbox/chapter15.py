from systems.provided.futures_chapter15.basesystem import futures_system

system = futures_system()

print(system)
print(system.accounts.portfolio().sharpe())