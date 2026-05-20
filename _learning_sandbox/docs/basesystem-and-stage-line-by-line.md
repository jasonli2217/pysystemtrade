# `basesystem.py` and `stage.py` — Line by Line

#pysystemtrade #backtesting #architecture #systems

Related: [[systems-folder-overview]] | [[accounts-stage-architecture]]

---

## What These Two Files Do Together

`basesystem.py` and `stage.py` are the **skeleton of the entire backtesting framework**. They define just two classes:

- `System` — the container that owns everything
- `SystemStage` — the base class every pipeline stage inherits from

Every single stage (`rawdata`, `rules`, `portfolio`, `accounts`, etc.) is a `SystemStage`. And they all live inside a `System`. These two files define how that relationship works.

---

## `stage.py` — The `SystemStage` base class

**Full file is only 54 lines.** Every pipeline stage inherits from this.

```python
from syscore.objects import get_methods   # utility: lists all public methods of an object
from syslogging.logger import *           # brings in get_logger, STAGE_LOG_LABEL, etc.
from systems.basesystem import System     # type hint only — so SystemStage knows what System is
```

> **Note:** `stage.py` imports `System` only for the type hint on `self.parent`. There is no circular import issue because Python resolves these at runtime, not definition time.

---

### `class SystemStage`

```python
class SystemStage(object):
```

Inherits directly from `object` — the plain Python base. This is the simplest possible class definition.

---

### `name` property

```python
@property
def name(self):
    return "Need to replace method when inheriting"
```

Every stage **must** override this. The name becomes the attribute name on the `System`:
- Stage with `name = "rawdata"` → accessible as `system.rawdata`
- Stage with `name = "accounts"` → accessible as `system.accounts`

If you forget to override `name`, you'll get a confusing error when the system tries to register a stage called `"Need to replace method when inheriting"`.

---

### `__repr__`

```python
def __repr__(self):
    return "SystemStage '%s' Try %s.methods()" % (self.name, self.name)
```

What prints when you type the stage object in a REPL. Just a helpful hint string.

---

### `methods()`

```python
def methods(self):
    return get_methods(self)
```

Returns a list of all public methods on the stage. Useful for exploration: `system.rawdata.methods()` lists everything you can call.

---

### `system_init()` — the critical wiring method

```python
def system_init(self, system: System):
    self._parent = system
    self._log = get_logger("base_system", {STAGE_LOG_LABEL: self.name})
```

This is called by `System._setup_stages()` during `System.__init__()`. It does two things:

1. **`self._parent = system`** — stores a reference back to the parent `System`. This is what makes `self.parent.rawdata`, `self.parent.portfolio`, etc. work from inside any stage.
2. **`self._log = get_logger(...)`** — creates a logger tagged with this stage's name, so log messages say which stage they came from.

> **Key insight:** A stage doesn't know about the system when you construct it — it's just an object. The link is created *after*, when you pass it to `System([stage1, stage2, ...])`. This is what lets you compose stages flexibly.

---

### `log` property

```python
@property
def log(self):
    log = getattr(self, "_log", get_logger("base_system", {STAGE_LOG_LABEL: self.name}))
    return log
```

Returns `self._log` if it exists (i.e., after `system_init()` has been called), otherwise falls back to a default logger. This fallback means stages can log even before being added to a system.

---

### `parent` property

```python
@property
def parent(self) -> System:
    parent = getattr(self, "_parent", None)
    return parent
```

Returns the `System` object this stage belongs to, or `None` if the stage hasn't been added to a system yet. Used everywhere inside stages: `self.parent.rawdata`, `self.parent.config`, etc.

---

## `basesystem.py` — The `System` class

This file is 428 lines but most of it is the instrument list filtering logic. The core is in the first ~120 lines.

---

### Imports

```python
from syscore.constants import arg_not_supplied
```
A sentinel object used instead of `None` as a default argument. Lets you distinguish "user didn't pass anything" from "user explicitly passed `None`".

```python
from sysdata.config.configdata import Config
```
The configuration object — holds all system parameters (forecast weights, instrument weights, risk target, etc.) read from YAML.

```python
from sysdata.config.instruments import (
    get_duplicate_list_of_instruments_to_remove_from_config,
    get_list_of_bad_instruments_in_config,
    get_list_of_ignored_instruments_in_config,
    get_list_of_untradeable_instruments_in_config,
)
```
Four helper functions that read instrument exclusion lists from config. Used by `get_instrument_list()` to filter out instruments you don't want.

```python
from sysdata.sim.sim_data import simData
```
The base class for all data sources (CSV, DB, etc.). Type hint — the `System` accepts anything that IS a `simData`.

```python
from syslogging.logger import *
```
Imports `get_logger` and all log label constants.

```python
from systems.system_cache import systemCache, base_system_cache
```
- `systemCache` — the cache object stored on the system (see [[system-cache-explained]])
- `base_system_cache` — a special cache decorator for `System` methods (different from `@diagnostic` used on stages)

```python
from systems.tools.autogroup import (
    calculate_autogroup_weights_given_parameters,
    config_is_auto_group,
    resolve_config_into_parameters_and_weights_for_autogrouping,
)
```
Autogroup is a feature that automatically calculates instrument weights by grouping instruments into asset classes rather than specifying each weight manually.

---

### `ALL_KEYNAME = "all"`

```python
ALL_KEYNAME = "all"
```

A module-level constant. Used in the cache as a key when a cached value applies to the whole system (not a single instrument). For example, `get_instrument_list()` caches under this key because it returns a system-wide result.

---

### `class System`

```python
class System(object):
```

Plain Python base class. Every backtesting system in pysystemtrade IS a `System` (or something that inherits from it).

---

### `__init__()` — Construction

```python
def __init__(
    self,
    stage_list: list,
    data: simData,
    config: Config = arg_not_supplied,
    log=get_logger("base_system"),
):
```

Three required concepts:
- **`stage_list`** — a list of stage objects (e.g., `[rawdata, rules, forecastScaleCap, ...]`)
- **`data`** — a data source (e.g., `csvFuturesSimData()` or `dbFuturesSimData()`)
- **`config`** — optional; if not provided, a blank `Config()` is created (fine for simple experiments)

```python
if config is arg_not_supplied:
    config = Config()
```
If no config is passed, create a blank one. The blank config will still load values from `sysdata/config/defaults.yaml`.

```python
self._data = data
self._config = config
self._log = log
```
Store all three on the instance with underscore prefix (private convention — exposed via properties below).

```python
self.config.system_init()
```
Tells the config it's now attached to a live system. This triggers it to merge user config with system defaults.

```python
self.data.system_init(self)
```
Tells the data source about the system (passes a reference). Some data sources use `self.parent` too, just like stages.

```python
self._setup_stages(stage_list)
```
Registers each stage on the system. This is where `system.rawdata`, `system.accounts`, etc. get created.

```python
self._cache = systemCache(self)
```
Creates the cache object. All `@diagnostic`-decorated method results are stored here.

---

### `_setup_stages()` — Stage Registration

```python
def _setup_stages(self, stage_list: list):
    stage_names = []

    try:
        iter(stage_list)
    except AssertionError:
        raise Exception("You didn't pass a list...")
```

Validates that `stage_list` is actually iterable (catches the common mistake of passing a single stage instead of `[stage]`).

```python
    for stage in stage_list:
        current_stage_name = stage.name
        stage.system_init(self)               # ← wires the stage to this system
```

For each stage:
1. Gets its name string (e.g., `"rawdata"`)
2. Calls `stage.system_init(self)` — this is what gives the stage its `self.parent` link

```python
        if current_stage_name in stage_names:
            raise Exception("You have duplicate subsystems with the name %s..." % current_stage_name)

        setattr(self, current_stage_name, stage)   # ← system.rawdata = rawdata_stage
        stage_names.append(current_stage_name)
```

`setattr(self, current_stage_name, stage)` is the magic line: it makes the stage accessible as `system.rawdata`, `system.accounts`, etc. The stage's `name` property determines the attribute name.

---

### `__repr__`

```python
def __repr__(self):
    sslist = ", ".join(self.stage_names)
    description = "System %s with .config, .data, and .stages: " % self.name
    return description + sslist
```

What prints when you type `system` in a REPL. Example output:
```
System base_system with .config, .data, and .stages: rawdata, rules, forecastScaleCap, combForecast, positionSize, portfolio, accounts
```

---

### Properties

```python
@property
def log(self):    return self._log
@property
def data(self):   return self._data
@property
def config(self): return self._config
@property
def name(self):   return "base_system"
@property
def cache(self):  return self._cache
@property
def stage_names(self): return self._stage_names
```

Simple read-only accessors for the private `_` attributes. The `name` property returns `"base_system"` — subclasses (like the provided full system) override this.

---

### `get_instrument_list()` — The Only Real Method on System

```python
@base_system_cache()
def get_instrument_list(
    self,
    remove_duplicates=True,
    remove_ignored=True,
    remove_trading_restrictions=False,
    remove_bad_markets=False,
    remove_short_history=False,
    days_required=750,
    force_to_passed_list=arg_not_supplied,
) -> list:
```

**`@base_system_cache()`** — a special cache decorator (different from `@diagnostic`). Results are stored in `self._cache` so the list is computed only once per system lifetime.

This method is the only significant computation on `System` itself. All other computation lives in the stages. It answers: "Given my config and data, which instruments am I actually trading?"

**The filtering hierarchy:**

```python
if force_to_passed_list is not arg_not_supplied:
    instrument_list = force_to_passed_list   # ← override everything
else:
    instrument_list = self._get_instrument_list_from_config(...)
```

If you pass `force_to_passed_list=["SP500", "BUND"]`, that overrides all config logic. Otherwise, it runs the filtering chain.

---

### `_get_raw_instrument_list_from_config()` — Where Does the List Come From?

```python
def _get_raw_instrument_list_from_config(self) -> list:
    config = self.config
    try:
        instrument_weights = get_instrument_weights_from_config(config)
        instrument_list = list(instrument_weights.keys())      # ← from instrument_weights in config
    except:
        try:
            instrument_list = config.instruments               # ← from instruments: list in config
        except:
            try:
                instrument_list = self.data.get_instrument_list()  # ← from data source
            except:
                raise Exception("Can't find instrument_list anywhere!")
```

Three fallback sources in priority order:
1. **`config.instrument_weights`** — if you define instrument weights in YAML, the keys are your instruments
2. **`config.instruments`** — a plain list of instrument codes in YAML
3. **`data.get_instrument_list()`** — whatever instruments exist in your data files

---

### Instrument Filtering Methods

These methods read config flags to exclude instruments from the active list:

| Method | Config Key | What It Excludes |
|---|---|---|
| `get_list_of_duplicate_instruments_to_remove()` | `duplicate_markets` | Instruments that are near-duplicates (e.g., two micro contracts of the same thing) |
| `get_list_of_ignored_instruments_to_remove()` | `ignore_instruments` | Instruments you want in data but not in the system |
| `get_list_of_markets_with_trading_restrictions()` | `trading_restrictions` | Instruments with legal/practical restrictions |
| `get_list_of_bad_markets()` | `bad_markets` | Instruments marked as having bad data quality |
| `get_list_of_short_history()` | `days_required` param | Instruments with fewer than N days of price history |

By default, `remove_duplicates=True` and `remove_ignored=True`. The others are `False` by default — they're used for portfolio construction but not in the default backtest list.

---

### Module-Level Functions at the Bottom

```python
def get_instrument_weights_from_config(config: Config) -> dict:
    instrument_weights_config = getattr(config, "instrument_weights", None)
    if instrument_weights_config is None:
        raise Exception("Instrument config not available")

    if config_is_auto_group(instrument_weights_config):
        instrument_weights_dict = _get_instrument_weights_with_autogrouping(...)
    else:
        instrument_weights_dict = instrument_weights_config

    return instrument_weights_dict
```

Reads instrument weights from config. If `config_is_auto_group()` is `True` (meaning you used the autogroup feature in your YAML instead of specifying each weight), it calculates weights automatically from asset class groups.

```python
def _get_instrument_weights_with_autogrouping(instrument_weights_config: dict) -> dict:
    (auto_group_parameters, auto_group_weights) = resolve_config_into_parameters_and_weights_for_autogrouping(...)
    group_weights = calculate_autogroup_weights_given_parameters(...)
    return group_weights
```

The autogroup feature lets you write in YAML something like:
```yaml
instrument_weights:
  auto_group: True
  Equity: [SP500, NASDAQ, EUROSTX]
  Bond: [BUND, US10, US2]
```
And it computes equal weights within each group and between groups, rather than requiring you to manually specify 50+ individual weights.

```python
if __name__ == "__main__":
    import doctest
    doctest.testmod()
```

Standard pattern — allows running doctests in the file directly. Since the code has doctests embedded in docstrings (e.g., the `__init__` docstring), this makes them runnable.

---

## How `System` and `SystemStage` Work Together — The Full Picture

```
System.__init__(stage_list, data, config)
│
├─ stores data, config, log
├─ config.system_init()  ← config loads defaults, merges
├─ data.system_init(self) ← data gets reference to system
│
├─ _setup_stages(stage_list):
│       for each stage:
│           stage.system_init(self)    ← stage gets self.parent = system
│           setattr(system, stage.name, stage)  ← system.rawdata = rawdata_stage
│
└─ self._cache = systemCache(self)  ← caching ready
```

After construction, the relationship is:
```
system.rawdata.parent  →  system        (stage → system)
system.rawdata         →  rawdata_stage  (system → stage)
```

Every stage can reach every other stage:
```python
# Inside positionsizing.py:
self.parent.combForecast.get_combined_forecast("SP500")
#    ↑ system   ↑ another stage    ↑ its method
```

---

## Typical Usage

```python
from sysdata.sim.csv_futures_sim_data import csvFuturesSimData
from sysdata.config.configdata import Config
from systems.rawdata import RawData
from systems.forecasting import Rules
from systems.forecast_scale_cap import ForecastScaleCap
from systems.forecast_combine import ForecastCombine
from systems.positionsizing import PositionSizing
from systems.portfolio import Portfolios
from systems.accounts.accounts_stage import Account

data = csvFuturesSimData()
config = Config("systems/provided/futures_chapter15/futuresconfig.yaml")

system = System(
    [RawData(), Rules(), ForecastScaleCap(), ForecastCombine(),
     PositionSizing(), Portfolios(), Account()],
    data,
    config
)

# Now all stages are wired up:
system.rawdata           # → RawData stage
system.rules             # → Rules stage
system.accounts          # → Account stage
system.get_instrument_list()  # → ["AEX", "BUND", "SP500", ...]
system.accounts.portfolio()   # → full P&L accountCurveGroup
```

---

*Next: [[system-cache-explained]] | [[rawdata-stage-line-by-line]]*
