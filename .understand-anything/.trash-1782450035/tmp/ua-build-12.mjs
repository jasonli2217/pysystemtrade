import fs from "fs";

const ROOT = "/Users/jasonli/Dev/FORKed repo/pysystemtrade";
const inp = JSON.parse(fs.readFileSync(ROOT + "/.understand-anything/tmp/ua-file-analyzer-input-12.json", "utf8"));
const bid = inp.batchImportData;

const nodes = [];
const edges = [];
const nodeIds = new Set();

function addNode(n) {
  if (nodeIds.has(n.id)) return;
  nodeIds.add(n.id);
  nodes.push(n);
}
function addEdge(e) { edges.push(e); }

// ---- File node definitions (curated) ----
const files = {
"sysexecution/stack_handler/completed_orders.py": {
  type:"file", name:"completed_orders.py",
  summary:"Stack-handler mixin that detects fully filled instrument/contract/broker orders, deactivates them on their stacks, and writes the completed-order trio to the historic order store.",
  tags:["execution","order-management","stack-handler","middleware"], complexity:"moderate"},
"sysexecution/stack_handler/create_broker_orders_from_contract_orders.py": {
  type:"file", name:"create_broker_orders_from_contract_orders.py",
  summary:"Stack-handler stage that converts contract orders into live broker orders, allocating an execution algo and managing client IDs before submission.",
  tags:["execution","order-management","stack-handler","broker"], complexity:"complex"},
"sysexecution/stack_handler/fills.py": {
  type:"file", name:"fills.py",
  summary:"Stack-handler mixin that propagates fills upward from broker orders to contract and instrument orders, updating positions and applying split/distributed-order logic.",
  tags:["execution","order-management","stack-handler","fills"], complexity:"complex"},
"sysexecution/stack_handler/roll_orders.py": {
  type:"file", name:"roll_orders.py",
  summary:"Generates and processes futures roll orders (force, flat, and close-near-contract rolls), creating the paired contract orders needed to move positions between expiries.",
  tags:["execution","rolls","stack-handler","futures"], complexity:"complex"},
"sysexecution/stack_handler/spawn_children_from_instrument_orders.py": {
  type:"file", name:"spawn_children_from_instrument_orders.py",
  summary:"Spawns child contract orders from parent instrument orders, choosing the priced contract or roll legs and computing reference, adjusted and limit prices for each child.",
  tags:["execution","order-management","stack-handler","pricing"], complexity:"complex"},
"sysexecution/stack_handler/stackHandlerCore.py": {
  type:"file", name:"stackHandlerCore.py",
  summary:"Base class for all stack-handler mixins, wiring the instrument/contract/broker order stacks and shared data access plus parent/child rollback helpers.",
  tags:["execution","stack-handler","base-class","order-management"], complexity:"moderate"},
"sysexecution/stack_handler/stack_handler.py": {
  type:"file", name:"stack_handler.py",
  summary:"Top-level stackHandler that composes all stack-handler mixins into a single orchestrator running the full order lifecycle.",
  tags:["execution","stack-handler","orchestration","barrel"], complexity:"simple"},
"sysexecution/strategies/classic_buffered_positions.py": {
  type:"file", name:"classic_buffered_positions.py",
  summary:"Order generator that turns optimal positions into instrument trades using buffer zones, only trading when actual position drifts outside the buffer.",
  tags:["execution","strategy","position-sizing","order-generation"], complexity:"moderate"},
"sysexecution/strategies/strategy_order_handling.py": {
  type:"file", name:"strategy_order_handling.py",
  summary:"Base order generator for strategies that converts desired positions into instrument orders, applying overrides, position limits and trade limits before stacking.",
  tags:["execution","strategy","order-generation","base-class"], complexity:"complex"},
"sysexecution/tick_data.py": {
  type:"file", name:"tick_data.py",
  summary:"Tick data structures and the tickerObject abstraction used to analyse live bid/offer ticks, spreads and adverse price movement during execution.",
  tags:["execution","market-data","ticks","data-model"], complexity:"complex"},
"sysinit/futures/get_prices_and_contract_details_from_ib.py": {
  type:"file", name:"get_prices_and_contract_details_from_ib.py",
  summary:"Initialisation script that pulls per-contract historical prices and contract details from Interactive Brokers for inspection.",
  tags:["initialization","script","ib","market-data"], complexity:"simple"},
"sysinit/futures/seed_price_data_from_IB.py": {
  type:"file", name:"seed_price_data_from_IB.py",
  summary:"Seed script that bootstraps per-contract futures price data from Interactive Brokers across multiple sampling frequencies.",
  tags:["initialization","script","ib","market-data"], complexity:"simple"},
"sysinit/futures/strategy_transfer.py": {
  type:"file", name:"strategy_transfer.py",
  summary:"Utility script to transfer instrument positions from one strategy to another by generating balancing trades at last known prices.",
  tags:["initialization","script","positions","strategy"], complexity:"simple"},
"sysobjects/futures_per_contract_prices.py": {
  type:"file", name:"futures_per_contract_prices.py",
  summary:"Domain objects wrapping per-contract futures OHLC price DataFrames, with merge, resampling and final-price extraction helpers.",
  tags:["data-model","market-data","futures","prices"], complexity:"moderate"},
"sysproduction/data/broker.py": {
  type:"file", name:"broker.py",
  summary:"Unified dataBroker facade over all broker data sources (prices, positions, FX, execution, capital), the main production gateway to Interactive Brokers.",
  tags:["production","broker","data-access","facade"], complexity:"complex"},
"sysproduction/data/controls.py": {
  type:"file", name:"controls.py",
  summary:"Production control data layer for trade limits, position limits, overrides, locks and client IDs, gating what orders the system is allowed to place.",
  tags:["production","risk-controls","data-access","limits"], complexity:"complex"},
"sysproduction/data/orders.py": {
  type:"file", name:"orders.py",
  summary:"dataOrders facade exposing the instrument, contract and broker order stacks plus the historic order store to production code.",
  tags:["production","order-management","data-access","facade"], complexity:"moderate"},
"sysproduction/data/positions.py": {
  type:"file", name:"positions.py",
  summary:"Position data layer (diagPositions/updatePositions) reading and writing contract and strategy positions, optimal positions and roll state.",
  tags:["production","positions","data-access","facade"], complexity:"complex"},
"sysproduction/interactive_manual_check_historical_prices.py": {
  type:"file", name:"interactive_manual_check_historical_prices.py",
  summary:"Interactive production script for manually reviewing and approving historical price updates for an instrument before they are stored.",
  tags:["production","script","interactive","market-data"], complexity:"simple"},
"sysproduction/interactive_order_stack.py": {
  type:"file", name:"interactive_order_stack.py",
  summary:"Large interactive menu-driven production tool for inspecting and manipulating the order stacks: manual trades, fills, rolls, locks and balance trades.",
  tags:["production","script","interactive","order-management"], complexity:"complex"},
"sysproduction/reporting/data/pandl.py": {
  type:"file", name:"pandl.py",
  summary:"Reporting layer that computes percentage and capital P&L series per contract, instrument and strategy from fills, prices and FX.",
  tags:["production","reporting","pandl","analytics"], complexity:"complex"},
"sysproduction/reporting/data/positions.py": {
  type:"file", name:"positions.py",
  summary:"Thin reporting helpers fetching optimal, my and broker positions and computing position breaks for reconciliation reports.",
  tags:["production","reporting","positions","reconciliation"], complexity:"simple"},
"sysproduction/update_historical_prices.py": {
  type:"file", name:"update_historical_prices.py",
  summary:"Daily price-update process that downloads broker prices across time zones, merges them with stored data, checks for spikes and writes per-contract prices.",
  tags:["production","market-data","scheduled-job","price-update"], complexity:"complex"},
"systems/provided/scalper/broker.py": {
  type:"file", name:"broker.py",
  summary:"Scalper system broker layer providing a BrokerController and a stripped-down execution algo to submit and manage bracket orders live.",
  tags:["scalper","broker","execution","strategy"], complexity:"moderate"},
"systems/provided/scalper/components.py": {
  type:"file", name:"components.py",
  summary:"Core state-machine components of the mean-reversion scalper: fills, orders, bracket-order construction, running P&L and trade-state transitions.",
  tags:["scalper","state-machine","execution","strategy"], complexity:"complex"},
"systems/provided/scalper/configuration.py": {
  type:"file", name:"configuration.py",
  summary:"Parameter configuration and interactive tuning for the scalper, including R-multiple estimation, horizons and price-based parameter estimation.",
  tags:["scalper","configuration","parameters","strategy"], complexity:"complex"},
"systems/provided/scalper/entry.py": {
  type:"file", name:"entry.py",
  summary:"Entry point and MRRunner driver for the mean-reversion scalper, wiring market data, configuration and broker into a live trading loop.",
  tags:["scalper","entry-point","execution","strategy"], complexity:"complex"},
};

for (const [path, meta] of Object.entries(files)) {
  addNode({ id:"file:"+path, type:meta.type, name:meta.name, filePath:path,
    summary:meta.summary, tags:meta.tags, complexity:meta.complexity });
}

// ---- Significant function/class nodes (curated) ----
// helper
function fn(path,name,range,summary,tags,complexity="moderate"){
  const id="function:"+path+":"+name;
  addNode({id,type:"function",name,filePath:path,lineRange:range,summary,tags,complexity});
  addEdge({source:"file:"+path,target:id,type:"contains",direction:"forward",weight:1.0});
  return id;
}
function cls(path,name,range,summary,tags,complexity="moderate"){
  const id="class:"+path+":"+name;
  addNode({id,type:"class",name,filePath:path,lineRange:range,summary,tags,complexity});
  addEdge({source:"file:"+path,target:id,type:"contains",direction:"forward",weight:1.0});
  return id;
}
function exp(path,id){ addEdge({source:"file:"+path,target:id,type:"exports",direction:"forward",weight:0.8}); }

let P;
// completed_orders.py
P="sysexecution/stack_handler/completed_orders.py";
exp(P, cls(P,"stackHandlerForCompletions",[7,204],"Mixin that finds fully filled order trios, deactivates them on each stack and persists them as completed historic orders.",["stack-handler","order-management","execution"],"moderate"));

// create_broker_orders_from_contract_orders.py
P="sysexecution/stack_handler/create_broker_orders_from_contract_orders.py";
exp(P, cls(P,"stackHandlerCreateBrokerOrders",[21,346],"Mixin that selects contract orders ready to execute, allocates an algo, manages broker client IDs and submits broker orders.",["stack-handler","broker","execution"],"complex"));

// fills.py
P="sysexecution/stack_handler/fills.py";
exp(P, cls(P,"stackHandlerForFills",[22,400],"Mixin that applies broker fills upward to contract and instrument orders and updates stored positions accordingly.",["stack-handler","fills","execution"],"complex"));
exp(P, fn(P,"check_to_see_if_distributed_order",[403,428],"Determines whether a contract order's fill must be distributed across multiple instrument orders.",["fills","helper"],"simple"));

// roll_orders.py
P="sysexecution/stack_handler/roll_orders.py";
exp(P, cls(P,"stackHandlerForRolls",[33,281],"Mixin orchestrating futures roll processing: force rolls, flat rolls and closing the near contract.",["stack-handler","rolls","futures"],"complex"));
exp(P, cls(P,"rollSpreadInformation",[329,342],"Value object holding spread prices used to construct roll orders.",["rolls","data-model"],"simple"));
exp(P, fn(P,"create_force_roll_orders",[284,309],"Builds the instrument and contract roll orders required to force a roll for an instrument.",["rolls","order-generation"],"simple"));
exp(P, fn(P,"get_roll_spread_information",[345,376],"Collects priced/forward contract prices into a rollSpreadInformation object.",["rolls","pricing"],"simple"));
exp(P, fn(P,"create_contract_roll_orders",[481,517],"Creates the pair of contract orders implementing a roll given spread information.",["rolls","order-generation"],"moderate"));
exp(P, fn(P,"create_contract_orders_spread",[565,588],"Constructs a spread contract order spanning the two roll contracts.",["rolls","order-generation"],"simple"));

// spawn_children_from_instrument_orders.py
P="sysexecution/stack_handler/spawn_children_from_instrument_orders.py";
exp(P, cls(P,"stackHandlerForSpawning",[38,299],"Mixin that spawns child contract orders from parent instrument orders and attaches reference/limit prices.",["stack-handler","order-generation","pricing"],"complex"));
exp(P, fn(P,"passive_roll_child_order",[302,372],"Builds child contract orders for a passive roll spread across two contracts.",["rolls","order-generation"],"moderate"));
exp(P, fn(P,"contract_order_for_direct_instrument_child_date_and_trade",[418,449],"Creates a direct contract order child for a given contract date and trade quantity.",["order-generation","helper"],"moderate"));
exp(P, fn(P,"calculate_reference_prices_for_direct_child_orders",[500,520],"Computes reference prices to stamp on direct child contract orders.",["pricing","helper"],"simple"));
exp(P, fn(P,"add_reference_price_to_a_direct_child_order",[523,561],"Attaches a computed reference price to a single direct child order.",["pricing","helper"],"moderate"));
exp(P, fn(P,"calculate_adjusted_price_for_a_direct_child_order",[564,596],"Computes the adjusted price for a direct child order from the priced contract.",["pricing","helper"],"moderate"));
exp(P, fn(P,"calculate_limit_prices_for_direct_child_orders",[599,631],"Derives limit prices for direct child contract orders.",["pricing","helper"],"moderate"));
exp(P, fn(P,"add_limit_price_to_a_direct_child_order",[634,674],"Attaches a limit price to a single direct child order.",["pricing","helper"],"moderate"));

// stackHandlerCore.py
P="sysexecution/stack_handler/stackHandlerCore.py";
exp(P, cls(P,"stackHandlerCore",[22,203],"Base stack-handler holding references to the three order stacks and shared data/logging used by all mixins.",["stack-handler","base-class","execution"],"moderate"));
exp(P, fn(P,"rollback_parents_and_children",[206,219],"Rolls back parent and child orders on failure to keep the stacks consistent.",["stack-handler","helper"],"simple"));

// stack_handler.py
P="sysexecution/stack_handler/stack_handler.py";
exp(P, cls(P,"stackHandler",[15,51],"Composed stack handler inheriting all mixins to run the full order lifecycle end to end.",["stack-handler","orchestration"],"simple"));

// classic_buffered_positions.py
P="sysexecution/strategies/classic_buffered_positions.py";
exp(P, cls(P,"orderGeneratorForBufferedPositions",[35,118],"Order generator that produces instrument trades only when actual positions fall outside the buffer around optimal.",["strategy","order-generation","position-sizing"],"moderate"));
exp(P, fn(P,"list_of_trades_given_optimal_and_actual_positions",[121,138],"Builds a list of instrument trades from optimal vs actual positions under buffering.",["order-generation","helper"],"simple"));
exp(P, fn(P,"trade_given_optimal_and_actual_positions",[141,195],"Computes the single trade needed to bring an actual position into the optimal buffer zone.",["order-generation","position-sizing"],"moderate"));

// strategy_order_handling.py
P="sysexecution/strategies/strategy_order_handling.py";
exp(P, cls(P,"orderGeneratorForStrategy",[23,248],"Base order generator converting desired positions into instrument orders while applying overrides, position and trade limits.",["strategy","order-generation","risk-controls"],"complex"));

// tick_data.py
P="sysexecution/tick_data.py";
exp(P, cls(P,"dataFrameOfRecentTicks",[14,31],"DataFrame subclass holding recent bid/offer tick data with analysis helpers.",["ticks","data-model"],"simple"));
exp(P, cls(P,"tickerObject",[168,349],"Abstraction over a live broker ticker exposing bid/offer, spreads and adverse-movement analysis used during execution.",["ticks","market-data","execution"],"complex"));
exp(P, fn(P,"analyse_tick",[115,158],"Analyses a single tick to produce mid price, spread and side information.",["ticks","analytics"],"moderate"));
exp(P, fn(P,"average_bid_offer_spread",[96,109],"Computes the average bid/offer spread across a tick DataFrame.",["ticks","analytics"],"simple"));

// seed_price_data_from_IB.py
P="sysinit/futures/seed_price_data_from_IB.py";
exp(P, fn(P,"seed_price_data_from_IB",[13,31],"Seeds price data for an instrument from IB across required contracts.",["initialization","ib","market-data"],"simple"));
exp(P, fn(P,"seed_price_data_for_contract_at_frequency",[50,83],"Downloads and stores IB prices for one contract at a specific sampling frequency.",["initialization","ib","market-data"],"moderate"));

// strategy_transfer.py
P="sysinit/futures/strategy_transfer.py";
exp(P, fn(P,"transfer_positions_between_strategies",[13,30],"Transfers all instrument positions from one strategy to another via balancing trades.",["positions","strategy","script"],"simple"));
exp(P, fn(P,"transfer_position_instrument",[42,65],"Transfers a single instrument's position between two strategies.",["positions","strategy","helper"],"moderate"));
exp(P, fn(P,"balance_trade",[75,89],"Records a balancing trade to move a position without going to the broker.",["positions","helper"],"simple"));

// futures_per_contract_prices.py
P="sysobjects/futures_per_contract_prices.py";
exp(P, cls(P,"futuresContractPrices",[21,216],"Wraps a per-contract OHLC price DataFrame with merge, resample and validation helpers.",["data-model","prices","futures"],"complex"));
exp(P, cls(P,"futuresContractFinalPrices",[219,225],"Series of final (close) prices derived from per-contract price data.",["data-model","prices"],"simple"));

// broker.py
P="sysproduction/data/broker.py";
exp(P, cls(P,"dataBroker",[47,538],"Unified facade aggregating all broker data sources for production, the main gateway to Interactive Brokers.",["broker","data-access","facade","production"],"complex"));

// controls.py
P="sysproduction/data/controls.py";
exp(P, cls(P,"dataTradeLimits",[121,218],"Data access for per-instrument/strategy trade limits used to throttle trading volume.",["risk-controls","limits","data-access"],"moderate"));
exp(P, cls(P,"diagOverrides",[224,427],"Read access to instrument/strategy overrides that scale or block trading.",["risk-controls","overrides","data-access"],"complex"));
exp(P, cls(P,"updateOverrides",[430,509],"Write access for applying and clearing trading overrides.",["risk-controls","overrides","data-access"],"moderate"));
exp(P, cls(P,"dataPositionLimits",[512,821],"Data access enforcing maximum position limits per instrument and strategy.",["risk-controls","limits","data-access"],"complex"));
exp(P, cls(P,"dataLocks",[97,118],"Manages per-instrument trading locks to prevent concurrent processing.",["risk-controls","locks","data-access"],"simple"));
exp(P, cls(P,"dataBrokerClientIDs",[83,94],"Allocates and releases broker client IDs.",["broker","data-access"],"simple"));

// orders.py
P="sysproduction/data/orders.py";
exp(P, cls(P,"dataOrders",[38,229],"Facade exposing the instrument, contract and broker order stacks and historic order store.",["order-management","data-access","facade"],"complex"));

// positions.py (production data)
P="sysproduction/data/positions.py";
exp(P, cls(P,"diagPositions",[47,386],"Read access for contract and strategy positions, optimal positions and roll state.",["positions","data-access","production"],"complex"));
exp(P, cls(P,"updatePositions",[389,539],"Write access for updating contract/strategy positions and roll state.",["positions","data-access","production"],"moderate"));
exp(P, fn(P,"get_list_of_instruments_with_current_positions",[561,565],"Returns instruments that currently hold a non-zero position.",["positions","helper"],"simple"));

// interactive_manual_check_historical_prices.py
P="sysproduction/interactive_manual_check_historical_prices.py";
exp(P, fn(P,"interactive_manual_check_historical_prices",[20,53],"Interactive loop to review and approve historical price updates for an instrument.",["interactive","market-data","script"],"moderate"));

// interactive_order_stack.py - selected significant functions
P="sysproduction/interactive_order_stack.py";
exp(P, fn(P,"get_broker_order_details_for_balance_trade",[214,279],"Collects broker order details from the user to build a balance trade.",["interactive","order-management","script"],"moderate"));
exp(P, fn(P,"create_manual_trade",[386,441],"Drives the interactive creation of a manual order across the stacks.",["interactive","order-management","script"],"moderate"));
exp(P, fn(P,"enter_manual_contract_order",[481,543],"Prompts the user to enter a manual contract order and places it on the stack.",["interactive","order-management","script"],"moderate"));
exp(P, fn(P,"generate_generic_manual_fill",[546,599],"Interactively records a manual fill against an order on a chosen stack.",["interactive","fills","script"],"moderate"));
exp(P, fn(P,"create_fx_trade",[628,681],"Interactively creates and submits an FX trade through the broker.",["interactive","broker","script"],"moderate"));
exp(P, fn(P,"view_positions",[899,929],"Displays optimal, my and broker positions plus breaks for review.",["interactive","positions","script"],"simple"));

// pandl.py
P="sysproduction/reporting/data/pandl.py";
exp(P, cls(P,"pandlCalculateAndStore",[68,307],"Computes and caches percentage and capital P&L series across contracts, instruments and strategies.",["reporting","pandl","analytics"],"complex"));
exp(P, fn(P,"get_perc_pandl_series_for_contract",[364,385],"Builds the percentage P&L series for a single contract from fills and prices.",["pandl","analytics"],"moderate"));
exp(P, fn(P,"get_perc_pandl_series_for_strategy_instrument_vs_total_capital",[388,422],"Computes percentage P&L for a strategy/instrument relative to total capital.",["pandl","analytics"],"moderate"));

// reporting positions.py
P="sysproduction/reporting/data/positions.py";
exp(P, fn(P,"get_position_breaks",[30,46],"Computes mismatches between optimal, my and broker positions for reconciliation.",["positions","reconciliation","reporting"],"simple"));

// update_historical_prices.py
P="sysproduction/update_historical_prices.py";
exp(P, cls(P,"downloadTimeManager",[185,277],"Manages the timing window for downloading prices across multiple time zones.",["market-data","scheduled-job"],"moderate"));
exp(P, fn(P,"update_historical_prices_for_instrument_and_contract",[335,360],"Updates stored prices for one contract by downloading and merging broker data.",["market-data","price-update"],"moderate"));
exp(P, fn(P,"get_and_add_prices_for_frequency",[363,425],"Downloads broker prices at a frequency, checks for spikes and writes merged prices.",["market-data","price-update"],"complex"));
exp(P, fn(P,"manage_download_given_dict_of_instrument_codes",[142,182],"Drives price downloads for a grouped set of instrument codes within a time window.",["market-data","price-update"],"moderate"));
exp(P, fn(P,"report_price_spike",[457,472],"Detects and reports an abnormal price spike during a price update.",["market-data","validation"],"simple"));

// scalper/broker.py
P="systems/provided/scalper/broker.py";
exp(P, cls(P,"BrokerController",[28,146],"Controls live submission and management of scalper bracket orders through the broker.",["scalper","broker","execution"],"complex"));
exp(P, cls(P,"StrippedDownAlgo",[175,218],"Minimal execution algo used by the scalper to place orders directly.",["scalper","execution","algo"],"moderate"));
exp(P, fn(P,"get_contract_order_from_simple_order",[149,172],"Translates a simple scalper order into a full contract order for the broker.",["scalper","order-generation","helper"],"moderate"));

// scalper/components.py
P="systems/provided/scalper/components.py";
exp(P, cls(P,"State",[263,396],"Core state object of the scalper state machine tracking current trade, fills and P&L.",["scalper","state-machine","execution"],"complex"));
exp(P, cls(P,"ListOfOrders",[98,160],"Collection of scalper orders with helpers to find and manage bracket legs.",["scalper","data-model"],"moderate"));
exp(P, cls(P,"RunningPandL",[190,225],"Tracks running profit and loss of the scalper as fills occur.",["scalper","pandl"],"moderate"));
exp(P, cls(P,"ActionFromState",[229,259],"Maps the current scalper state to the next trading action.",["scalper","state-machine"],"moderate"));
exp(P, cls(P,"CurrentTrade",[26,48],"Represents the scalper's currently open trade and its fills.",["scalper","data-model"],"simple"));
exp(P, fn(P,"get_bracket_orders",[163,176],"Builds the entry/stop/target bracket of orders for a scalper trade.",["scalper","order-generation"],"simple"));
exp(P, fn(P,"action_given_current_state",[399,439],"Computes the action the scalper should take given its current state.",["scalper","state-machine"],"moderate"));
exp(P, fn(P,"get_stop_loss_order_given_current_trade",[65,89],"Derives the stop-loss order for the scalper's current open trade.",["scalper","order-generation"],"moderate"));

// scalper/configuration.py
P="systems/provided/scalper/configuration.py";
exp(P, cls(P,"StratParameters",[19,58],"Holds the scalper's tunable strategy parameters.",["scalper","configuration","parameters"],"moderate"));
exp(P, fn(P,"interactively_modify_parameters",[149,175],"Interactively edits scalper parameters with defaults.",["scalper","configuration","interactive"],"moderate"));
exp(P, fn(P,"display_diags",[185,248],"Prints diagnostic information about the scalper configuration and R estimates.",["scalper","configuration","diagnostics"],"moderate"));
exp(P, fn(P,"estimate_R_from_prices",[251,263],"Estimates the R-multiple parameter from a recent price series.",["scalper","configuration","analytics"],"simple"));
exp(P, fn(P,"describe_max_R_calculation",[112,128],"Explains the maximum-R calculation for the scalper parameters.",["scalper","configuration","diagnostics"],"simple"));

// scalper/entry.py
P="systems/provided/scalper/entry.py";
exp(P, cls(P,"MRRunner",[48,591],"Driver class running the live mean-reversion scalper loop, wiring data, config, state and broker.",["scalper","entry-point","execution"],"complex"));
exp(P, fn(P,"pre_start_checks_okay_to_start",[594,633],"Validates that all prerequisites are satisfied before the scalper starts trading.",["scalper","validation","entry-point"],"moderate"));

// ---- Import edges (1:1 from batchImportData) ----
let importCount = 0;
for (const [path, targets] of Object.entries(bid)) {
  for (const t of (targets||[])) {
    addEdge({source:"file:"+path, target:"file:"+t, type:"imports", direction:"forward", weight:0.7});
    importCount++;
  }
}

// ---- Selected depends_on / related semantic edges (within batch, high confidence) ----
function dep(s,t){ addEdge({source:"file:"+s,target:"file:"+t,type:"depends_on",direction:"forward",weight:0.6}); }
// stack_handler composes the mixins (already imports; add depends_on for clarity on key ones)
// scalper entry depends on its components/config/broker (already imported) -> rely on imports.

console.log("nodeCount", nodes.length, "edgeCount", edges.length, "importEdges", importCount);

// expected import total check
let expected = 0;
for (const k of Object.keys(bid)) expected += (bid[k]||[]).length;
console.log("expected imports", expected, importCount===expected ? "OK" : "MISMATCH");

fs.writeFileSync(ROOT+"/.understand-anything/tmp/ua-graph-12-full.json", JSON.stringify({nodes,edges}, null, 1));
