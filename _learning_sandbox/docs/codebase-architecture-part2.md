# pysystemtrade — Architecture Reference Part 2

#pysystemtrade #architecture #reference

Related: [[codebase-architecture-reference]] | [[accounts-stage-architecture]] | [[systems-folder-overview]]

---

## Section 6: Broker Interface — `sysbrokers/`

### 6a. Abstract Broker Interfaces (`sysbrokers/*.py`)

These define what ANY broker must implement. Currently only IB is implemented.

| Abstract Class | File | Responsibility |
|---|---|---|
| `brokerFuturesContractPriceData` | `broker_futures_contract_price_data.py` | Get live/historical prices |
| `brokerFuturesContractData` | `broker_futures_contract_data.py` | Contract details, expiry dates, trading hours |
| `brokerContractPositionData` | `broker_contract_position_data.py` | Current broker positions |
| `brokerExecutionStackData` | `broker_execution_stack.py` | Submit/manage orders at broker |
| `brokerCapitalData` | `broker_capital_data.py` | Account value from broker |
| `brokerFxPricesData` | `broker_fx_prices_data.py` | FX rate data |
| `brokerFxHandlingData` | `broker_fx_handling.py` | FX trade execution |
| `brokerInstrumentData` | `broker_instrument_data.py` | Instrument metadata from broker |
| `brokerContractCommissionData` | `broker_contract_commission_data.py` | Commission rates |
| `brokerStaticData` | `broker_static_data.py` | Static reference data |

### 6b. Interactive Brokers Implementation (`sysbrokers/IB/`)

| File | Class | What It Does |
|---|---|---|
| `ib_connection.py` | `connectionIB` | Manages TWS/Gateway TCP connection |
| `ib_futures_contract_price_data.py` | `ibFuturesContractPriceData` | Fetches price bars from IB |
| `ib_futures_contracts_data.py` | `ibFuturesContractData` | Gets contract specs, expiry info |
| `ib_contract_position_data.py` | `ibContractPositionData` | Reads current IB positions |
| `ib_orders.py` | `ibExecutionStackData` | Places/manages orders via IB API |
| `ib_capital_data.py` | `ibCapitalData` | Reads account net liquidation value |
| `ib_Fx_prices_data.py` | `ibFxPricesData` | Gets FX rates from IB |
| `ib_instruments_data.py` | `ibFuturesInstrumentData` | Maps pysystemtrade codes → IB codes |
| `ib_instruments.py` | `ibInstrumentConfigData` | Reads IB instrument config YAML |
| `ib_contracts.py` | `ibContractIdentifier` | Builds `ib_insync` Contract objects |
| `ib_trading_hours.py` | `ibTradingHoursData` | Parses IB trading hours |
| `ib_translate_broker_order_objects.py` | Translation utilities | Converts between pysystemtrade and IB order formats |
| `ib_positions.py` | `ibPositionIdentifier` | Maps IB positions to pysystemtrade contracts |
| `ib_fx_handling.py` | `ibFxHandlingData` | Executes FX cashflow trades |
| `ib_broker_commissions.py` | `ibBrokerCommissionData` | Gets commission estimates |
| `client/` | IB API client wrapper | Low-level ib_insync interaction |
| `config/` | YAML configs | IB instrument mappings, exchange info |

### 6c. Connection Flow

```
connectionIB (ib_connection.py)
    ↓ wraps
ib_insync.IB client
    ↓ connects to
IB TWS / IB Gateway (TCP port 4001 or 7497)
```

`dataBlob` manages the IB connection lifecycle — it creates `connectionIB` once and shares it across all `ib*Data` classes.

---

## Section 7: Order Execution — `sysexecution/`

### 7a. Order Types — Three-Layer Order Model

Orders flow through three layers, each adding detail:

```
instrumentOrder  →  contractOrder  →  brokerOrder
"Buy SP500"         "Buy SP500/202306"   "Buy ES 202306 @ market via IB"
```

| Class | File | What It Represents |
|---|---|---|
| `Order` | `orders/base_orders.py` | Abstract base order |
| `instrumentOrder` | `orders/instrument_orders.py` | Strategy-level: instrument + quantity |
| `contractOrder` | `orders/contract_orders.py` | Contract-level: specific expiry month |
| `brokerOrder` | `orders/broker_orders.py` | Broker-level: all execution details |
| `listOfOrders` | `orders/list_of_orders.py` | Collection of orders |

### 7b. Order Stacks — Three Parallel Queues

Each order layer has its own stack (queue):

```
instrumentOrderStackData  →  contractOrderStackData  →  brokerOrderStackData
         ↑                          ↑                          ↑
    orderStackData (base)      orderStackData (base)     orderStackData (base)
```

| Class | File | Storage |
|---|---|---|
| `orderStackData` | `order_stacks/order_stack.py` | Abstract base — dict-like container |
| `instrumentOrderStackData` | `order_stacks/instrument_order_stack.py` | MongoDB (`mongoInstrumentOrderStackData`) |
| `contractOrderStackData` | `order_stacks/contract_order_stack.py` | MongoDB |
| `brokerOrderStackData` | `order_stacks/broker_order_stack.py` | MongoDB |

### 7c. Stack Handler — The Order Processing Engine

**Folder:** `sysexecution/stack_handler/`

The stack handler is the main loop that processes orders through the three layers:

| File | What It Does |
|---|---|
| `stackHandlerCore.py` | Base class with references to all three stacks |
| `stack_handler.py` | Main `stackHandler` class (inherits all below) |
| `spawn_children_from_instrument_orders.py` | Splits instrument orders → contract orders |
| `create_broker_orders_from_contract_orders.py` | Converts contract orders → broker orders |
| `fills.py` | Monitors broker for fill reports |
| `completed_orders.py` | Archives completed orders |
| `balance_trades.py` | Creates balancing trades for rolls |
| `roll_orders.py` | Handles roll-specific order logic |
| `cancel_and_modify.py` | Cancel/modify existing orders |
| `checks.py` | Pre-trade safety checks |
| `additional_sampling.py` | Samples market data for limit orders |

### 7d. Execution Algorithms (`sysexecution/algos/`)

| File | Class | Strategy |
|---|---|---|
| `algo.py` | `Algo` | Abstract base execution algorithm |
| `algo_market.py` | `algoMarket` | Simple market order |
| `algo_original_best.py` | `algoOriginalBest` | Passive → aggressive: limit then market |
| `algo_limit_orders.py` | `algoLimitOrders` | Limit orders only |
| `algo_snaps.py` | `algoSnap` | Snap-to-midpoint orders |
| `algo_adaptive.py` | `algoAdaptive` | IB adaptive algo |
| `allocate_algo_to_order.py` | — | Selects which algo to use for each order |

### 7e. Strategy Order Generators (`sysexecution/strategies/`)

These bridge backtesting output → live orders:

| File | Class | What It Does |
|---|---|---|
| `strategy_order_handling.py` | `orderGeneratorForStrategy` | Base: generates instrument orders from optimal positions |
| `classic_buffered_positions.py` | `orderGeneratorForBufferedPositions` | Uses buffered positions from backtest |
| `dynamic_optimised_positions.py` | `orderGeneratorForDynamicPositions` | Uses dynamic optimisation (no fixed weights) |

### 7f. Other

| File | Purpose |
|---|---|
| `trade_qty.py` | `tradeQuantity` class — handles multi-leg quantities |
| `tick_data.py` | Tick data collection for execution analysis |

---

## Section 8: Production System — `sysproduction/`

### 8a. Daily Scheduled Processes (`run_*.py`)

These are the cron-scheduled scripts that run the live system:

| Script | What It Does | Runs When |
|---|---|---|
| `run_daily_fx_and_contract_updates.py` | Downloads FX rates, updates contract info | Morning |
| `run_daily_price_updates.py` | Downloads latest prices from IB | Morning |
| `run_daily_update_multiple_adjusted_prices.py` | Recalculates adjusted/multiple prices | After prices |
| `run_systems.py` | Runs the backtest to get optimal positions | After prices |
| `run_strategy_order_generator.py` | Compares optimal vs actual → creates orders | After backtest |
| `run_stack_handler.py` | Processes order stacks → executes at broker | Continuous |
| `run_capital_update.py` | Syncs capital from broker | End of day |
| `run_reports.py` | Generates daily reports (P&L, risk, status) | End of day |
| `run_backups.py` | Backs up DB to CSV, Parquet to remote | Night |
| `run_cleaners.py` | Cleans old logs, echo files, backtest states | Night |

### 8b. Data Update Scripts (`update_*.py`)

Lower-level update functions called by the `run_*.py` scripts:

| Script | What It Updates |
|---|---|
| `update_fx_prices.py` | FX rates from IB → Parquet |
| `update_historical_prices.py` | Per-contract prices from IB → Parquet |
| `update_multiple_adjusted_prices.py` | Multiple prices and adjusted prices |
| `update_sampled_contracts.py` | Which contracts to track (price/carry/forward) |
| `update_total_capital.py` | Total account capital |
| `update_strategy_capital.py` | Per-strategy capital allocation |
| `update_strategy_orders.py` | Order generation from optimal positions |
| `update_system_backtests.py` | Run and save backtest results |

### 8c. Interactive Scripts (`interactive_*.py`)

Manual CLI tools for monitoring and intervention:

| Script | What It Does |
|---|---|
| `interactive_controls.py` | Turn trading on/off, set position limits, overrides |
| `interactive_diagnostics.py` | View P&L, positions, risk, instrument status |
| `interactive_order_stack.py` | View/modify/cancel live orders |
| `interactive_update_roll_status.py` | Manage roll state (passive → force → close) |
| `interactive_update_capital_manual.py` | Manually adjust capital |
| `interactive_manual_check_historical_prices.py` | Verify downloaded price data |
| `interactive_manual_check_fx_prices.py` | Verify FX data |

### 8d. Production Data Adapters (`sysproduction/data/`)

These wrap `dataBlob` to provide high-level business logic:

| File | Class | Wraps |
|---|---|---|
| `prices.py` | `diagPrices`, `updatePrices` | Price data access + update logic |
| `positions.py` | `diagPositions`, `updatePositions` | Position tracking |
| `orders.py` | `dataOrders` | Order history and stack access |
| `capital.py` | `dataCapital` | Capital tracking and adjustment |
| `contracts.py` | `dataContracts` | Contract management |
| `broker.py` | `dataBroker` | All broker interactions |
| `controls.py` | `dataControlProcess`, `dataTradeLimits`, `dataPositionLimits` | Trading controls |
| `instruments.py` | `diagInstruments` | Instrument metadata |
| `currency_data.py` | `dataCurrency` | FX data |
| `risk.py` | `dataRisk` | Portfolio risk calculations |
| `optimal_positions.py` | `dataOptimalPositions` | Optimal position storage |
| `backtest.py` | `dataBacktest` | Store/load backtest results |
| `sim_data.py` | `dataSimData` | Create simData from production data |
| `strategies.py` | `dataStrategies` | Strategy configuration |
| `config.py` | `dataConfig` | Production config access |
| `reports.py` | `dataReports` | Report generation |
| `volumes.py` | `dataVolumes` | Volume data |
| `control_process.py` | `dataControlProcess` | Process control state |

### 8e. Strategy Code (`sysproduction/strategy_code/`)

| File | Class | Strategy Type |
|---|---|---|
| `run_system_classic.py` | `futuresSystem` | Standard backtest-based system |
| `run_dynamic_optimised_system.py` | `futuresSystemDynOpt` | Dynamic portfolio optimisation |
| `report_system_classic.py` | — | Generate strategy-specific reports |
| `strategy_allocation.py` | — | Multi-strategy capital allocation |

### 8f. Reporting (`sysproduction/reporting/`)

Generates daily status reports sent via email. Covers P&L, risk, positions, roll status, order status, data quality.

---

## Section 9: Process Control — `syscontrol/`

Manages the lifecycle of production processes.

| File | Class | Purpose |
|---|---|---|
| `run_process.py` | `processToRun` | Base class for any scheduled process — handles start/finish/heartbeat |
| `timer_functions.py` | `timerClassWithFunction`, `repeatingTimer` | Timing logic: "run every N minutes", "run at specific times" |
| `timer_parameters.py` | `timerClassParameters` | Timer configuration |
| `strategy_tools.py` | `strategyRunner` | Run a strategy's methods on schedule |
| `monitor.py` | `processMonitor` | Monitors running processes, kills zombies |
| `report_process_status.py` | — | Reports on process health |
| `list_running_pids.py` | — | Lists active process PIDs |
| `control_config.yaml` | — | Defines all processes, their methods, and schedules |

### Process Lifecycle

```
processToRun.__init__()
    → check if process already running (avoid duplicates)
    → mark process as "running" in MongoDB
    → run methods on timer
    → on exit: mark process as "finished"
    → on crash: remains "running" until monitor kills it
```

---

## Section 10: Logging — `syslogging/` + `syslogdiag/`

### `syslogging/` — Standard Python Logging

| File | Purpose |
|---|---|
| `logger.py` | `get_logger()` function, log label constants (`STAGE_LOG_LABEL`, `TYPE_LOG_LABEL`) |
| `adapter.py` | Custom `LoggingAdapter` that adds structured context to log messages |
| `handlers.py` | Custom log handlers |
| `filters.py` | Log filters |
| `logging_sim.yaml` | Logging config for backtesting (console only) |
| `logging_prod.yaml` | Logging config for production (console + file) |
| `server.py` | Log server for distributed logging |

### `syslogdiag/` — Diagnostic Logging & Email Alerts

| File | Purpose |
|---|---|
| `pst_logger.py` | `pstLogger` — the legacy logger that writes to MongoDB |
| `log_to_file.py` | File-based logging |
| `log_to_screen.py` | Console logging |
| `log_entry.py` | `logEntry` — structured log record |
| `emailing.py` | Send email alerts (via SMTP) |
| `email_via_db_interface.py` | Email with DB-backed tracking |
| `email_control.py` | Rate-limiting for email alerts |
| `mongo_email_control.py` | MongoDB-backed email control |

---

## Section 11: Configuration — `sysdata/config/`

| File | Class | Purpose |
|---|---|---|
| `configdata.py` | `Config` | Main config object — loads YAML, merges defaults |
| `defaults.py` | — | Loads `sysdata/config/defaults.yaml` |
| `instruments.py` | — | Instrument list filtering (duplicates, ignored, bad, restricted) |
| `production_config.py` | — | Production-specific config loading |
| `private_config.py` | — | Private config loading (DB credentials, API keys) |
| `fill_config_dict_with_defaults.py` | — | Recursive dict merge logic |

### Config Merge Order (highest priority first)

```
1. Your backtest YAML        (e.g. futuresconfig.yaml)
2. private_config.yaml        (private/ directory — DB passwords, etc.)
3. defaults.yaml              (sysdata/config/defaults.yaml — sensible defaults)
```

---

## Section 12: Initialisation — `sysinit/`

One-time setup scripts for adding new instruments:

| Subfolder | Purpose |
|---|---|
| `futures/` | Scripts to build roll calendars, multiple prices, adjusted prices for new futures |
| `configtools/` | Tools to update instrument config files |
| `transfer/` | Transfer data between backends (CSV ↔ Arctic ↔ Parquet) |

---

## Full System Data Flow — Backtesting

```
CSV files (data/futures/)
    ↓
csvFuturesSimData
    ↓
System([RawData, Rules, ForecastScaleCap, ForecastCombine,
        PositionSizing, Portfolios, Account], data, config)
    ↓
system.accounts.portfolio()  →  accountCurveGroup (P&L)
```

## Full System Data Flow — Production (Daily)

```
1. IB API → update_historical_prices → Parquet (per-contract prices)
2. Parquet → update_multiple_adjusted_prices → Parquet (adjusted prices)
3. Parquet → run_systems (backtest) → optimal positions → MongoDB
4. MongoDB → run_strategy_order_generator → instrument orders → order stacks
5. Order stacks → run_stack_handler:
      instrumentOrder → contractOrder → brokerOrder → IB API
6. IB API → fills → update positions → Parquet
7. IB API → run_capital_update → Parquet (capital)
8. All data → run_reports → email
```

---

## Quick Lookup: "Where Is X Defined?"

| Concept | Class | File |
|---|---|---|
| The System container | `System` | `systems/basesystem.py` |
| A pipeline stage | `SystemStage` | `systems/stage.py` |
| The cache | `systemCache` | `systems/system_cache.py` |
| A trading rule | `TradingRule` | `systems/trading_rules.py` |
| Config object | `Config` | `sysdata/config/configdata.py` |
| Data container | `dataBlob` | `sysdata/data_blob.py` |
| Sim data source | `simData` | `sysdata/sim/sim_data.py` |
| Futures sim data | `futuresSimData` | `sysdata/sim/futures_sim_data.py` |
| CSV sim data | `csvFuturesSimData` | `sysdata/sim/csv_futures_sim_data.py` |
| DB sim data | `dbFuturesSimData` | `sysdata/sim/db_futures_sim_data.py` |
| Base data interface | `baseData` | `sysdata/base_data.py` |
| An order | `Order` | `sysexecution/orders/base_orders.py` |
| Order stack | `orderStackData` | `sysexecution/order_stacks/order_stack.py` |
| Stack handler | `stackHandler` | `sysexecution/stack_handler/stack_handler.py` |
| Execution algo | `Algo` | `sysexecution/algos/algo.py` |
| IB connection | `connectionIB` | `sysbrokers/IB/ib_connection.py` |
| Process runner | `processToRun` | `syscontrol/run_process.py` |
| Instrument object | `futuresInstrument` | `sysobjects/instruments.py` |
| Contract object | `futuresContract` | `sysobjects/contracts.py` |
| Adjusted prices | `futuresAdjustedPrices` | `sysobjects/adjusted_prices.py` |
| Multiple prices | `futuresMultiplePrices` | `sysobjects/multiple_prices.py` |
| FX prices | `fxPrices` | `sysobjects/spot_fx_prices.py` |
| Cost data | `instrumentCosts` | `sysobjects/instruments.py` |
| Roll parameters | `rollParameters` | `sysobjects/rolls.py` |
| Volatility estimation | `robust_vol_calc` | `sysquant/estimators/vol.py` |
| Correlation estimation | `CorrelationList` | `sysquant/estimators/correlations.py` |
| Portfolio optimisation | `portfolioOptimiser` | `sysquant/optimisation/portfolio_optimiser.py` |
| Handcrafting optimiser | `handcraftingOptimiser` | `sysquant/optimisation/full_handcrafting.py` |

---

*Created: 2026-05-04*
