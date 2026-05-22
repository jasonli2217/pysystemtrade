from sysdata.sim.csv_futures_sim_data import csvFuturesSimData

data = csvFuturesSimData()

from systems.provided.rules.ewmac import ewmac_forecast_with_defaults as ewmac

from systems.forecasting import Rules

my_rules = Rules(ewmac)
my_rules.trading_rules()

my_rules = Rules(dict(ewmac=ewmac))
my_rules.trading_rules()

from systems.basesystem import System

my_system = System([my_rules], data)
my_system

print(my_system.rules.get_raw_forecast("SOFR", "ewmac").tail(5))
