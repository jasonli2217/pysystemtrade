import fs from "fs";

const ROOT = "/Users/jasonli/Dev/FORKed repo/pysystemtrade";
const inp = JSON.parse(fs.readFileSync(ROOT + "/.understand-anything/tmp/ua-file-analyzer-input-13.json", "utf8"));
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

// ---- File node metadata (curated) ----
const fileMeta = {
  "systems/accounts/account_forecast.py": {
    summary: "Accounting stage mixin computing per-trading-rule, per-instrument forecast P&L, including normalised forecast weighting across instruments and trading rules.",
    tags: ["service", "pandl", "backtesting", "forecast", "accounting"], complexity: "complex"
  },
  "systems/accounts/account_inputs.py": {
    summary: "Input adapter mixin that pulls prices, volatility, positions, weights and config from upstream system stages into the accounting layer.",
    tags: ["service", "adapter", "accounting", "data-access", "backtesting"], complexity: "complex"
  },
  "systems/accounts/account_instruments.py": {
    summary: "Accounting stage mixin computing per-instrument portfolio-level P&L with either SR (Sharpe-ratio) costs or cash costs.",
    tags: ["service", "pandl", "accounting", "backtesting", "costs"], complexity: "moderate"
  },
  "systems/accounts/account_portfolio.py": {
    summary: "Accounting stage mixin aggregating per-instrument P&L into a portfolio-level account curve group and total portfolio turnover.",
    tags: ["service", "pandl", "accounting", "portfolio", "backtesting"], complexity: "moderate"
  },
  "systems/accounts/account_subsystem.py": {
    summary: "Accounting stage mixin computing subsystem (single-instrument-as-portfolio) P&L across instruments with SR or cash cost models.",
    tags: ["service", "pandl", "accounting", "subsystem", "backtesting"], complexity: "complex"
  },
  "systems/accounts/account_trading_rules.py": {
    summary: "Accounting stage mixin producing weighted and unweighted P&L for individual and grouped trading rules across the whole system.",
    tags: ["service", "pandl", "accounting", "trading-rules", "backtesting"], complexity: "complex"
  },
  "systems/accounts/account_with_multiplier.py": {
    summary: "Accounting stage mixin applying a dynamic capital multiplier (compounding) to produce actual-capital P&L curves.",
    tags: ["service", "pandl", "accounting", "capital", "backtesting"], complexity: "moderate"
  },
  "systems/accounts/curves/account_curve.py": {
    summary: "Core accountCurve class wrapping a P&L calculator as a returns time series with a large suite of performance statistics (Sharpe, drawdown, Sortino, t-tests).",
    tags: ["data-model", "performance-stats", "accounting", "backtesting", "account-curve"], complexity: "complex"
  },
  "systems/accounts/curves/account_curve_analysis.py": {
    summary: "Helper functions for statistical analysis of account curves, including t-tests comparing two return series and standard statistics extraction.",
    tags: ["utility", "performance-stats", "statistics", "accounting"], complexity: "simple"
  },
  "systems/accounts/curves/account_curve_group.py": {
    summary: "Container grouping multiple account curves (e.g. per-instrument) exposing aggregate net/gross/cost curves and cross-sectional statistics tables.",
    tags: ["data-model", "account-curve", "aggregation", "accounting", "performance-stats"], complexity: "complex"
  },
  "systems/accounts/curves/dict_of_account_curves.py": {
    summary: "Dictionary types mapping codes to P&L calculators that build aggregate account curves, with a nested variant for hierarchical grouping.",
    tags: ["data-model", "account-curve", "container", "accounting"], complexity: "simple"
  },
  "systems/accounts/curves/nested_account_curve_group.py": {
    summary: "Two-level nested account curve group (e.g. trading rule -> instrument) flattening to weighted/unweighted aggregate curves.",
    tags: ["data-model", "account-curve", "aggregation", "accounting"], complexity: "moderate"
  },
  "systems/accounts/curves/stats_dict.py": {
    summary: "statsDict produces and formats cross-sectional performance statistics across an account curve group, including correlation and ranked tables.",
    tags: ["data-model", "performance-stats", "statistics", "accounting"], complexity: "complex"
  },
  "systems/accounts/order_simulator/account_curve_order_simulator.py": {
    summary: "Accounting stage variant that derives instrument P&L from a simulated order/fill stream rather than idealised positions.",
    tags: ["service", "order-simulation", "accounting", "backtesting", "pandl"], complexity: "moderate"
  },
  "systems/accounts/order_simulator/fills_and_orders.py": {
    summary: "Helpers turning simple simulated orders into fills, handling market and limit order fill logic against price series.",
    tags: ["utility", "order-simulation", "fills", "backtesting"], complexity: "moderate"
  },
  "systems/accounts/order_simulator/hourly_limit_orders.py": {
    summary: "Hourly limit-order simulator and accounting stage wiring limit-order fill generation into the order-simulation P&L pipeline.",
    tags: ["service", "order-simulation", "limit-orders", "hourly", "backtesting"], complexity: "moderate"
  },
  "systems/accounts/order_simulator/hourly_market_orders.py": {
    summary: "Hourly market-order simulator and accounting stage building hourly price series data for market-order fill simulation.",
    tags: ["service", "order-simulation", "market-orders", "hourly", "backtesting"], complexity: "moderate"
  },
  "systems/accounts/order_simulator/pandl_order_simulator.py": {
    summary: "Core OrderSimulator engine iterating daily over series data to generate positions, orders and fills, plus the data structures it produces.",
    tags: ["service", "order-simulation", "engine", "backtesting", "fills"], complexity: "complex"
  },
  "systems/accounts/order_simulator/simple_orders.py": {
    summary: "Lightweight dataclasses for simple orders and timestamped orders, with list wrappers used by the order simulator.",
    tags: ["data-model", "order-simulation", "orders", "backtesting"], complexity: "moderate"
  },
  "systems/accounts/pandl_calculators/pandl_SR_cost.py": {
    summary: "P&L calculator applying Sharpe-ratio-based cost deductions per period derived from turnover and a per-trade SR cost.",
    tags: ["service", "pandl", "costs", "sr-cost", "accounting"], complexity: "moderate"
  },
  "systems/accounts/pandl_calculators/pandl_calculation.py": {
    summary: "Base pandlCalculation class turning positions, prices, fx and capital into a raw (pre-cost) P&L return series across frequencies.",
    tags: ["service", "pandl", "engine", "accounting", "backtesting"], complexity: "complex"
  },
  "systems/accounts/pandl_calculators/pandl_calculation_dict.py": {
    summary: "Dictionary of generic-cost P&L calculators able to sum a collection of P&L curves into an aggregate without explicit positions.",
    tags: ["data-model", "pandl", "aggregation", "accounting"], complexity: "moderate"
  },
  "systems/accounts/pandl_calculators/pandl_cash_costs.py": {
    summary: "P&L calculator computing realistic cash costs (commission, spread, slippage) from individual fills using an instrument cost object.",
    tags: ["service", "pandl", "costs", "cash-costs", "accounting"], complexity: "complex"
  },
  "systems/accounts/pandl_calculators/pandl_generic_costs.py": {
    summary: "Generic-cost P&L mixin combining gross returns with cost series to expose net, gross and cost return curves.",
    tags: ["service", "pandl", "costs", "accounting", "backtesting"], complexity: "moderate"
  },
  "systems/accounts/pandl_calculators/pandl_using_fills.py": {
    summary: "P&L calculation mixin that infers positions from a stream of fills, merging fill prices with market prices for mark-to-market.",
    tags: ["service", "pandl", "fills", "accounting", "order-simulation"], complexity: "moderate"
  },
  "systems/provided/rules/factors.py": {
    summary: "Provided trading rules that build a factor signal and a volatility-conditioned variant of it for use in forecasts.",
    tags: ["trading-rule", "forecast", "factor", "provided"], complexity: "simple"
  },
};

const fileNames = {};
for (const p of Object.keys(bid)) fileNames[p] = p.split("/").pop();

// ---- Significant function/class node curation ----
// classes: emit if >=2 methods or >=20 lines; functions: >=10 lines or exported.
// Provide summaries for the important ones; generic fallback otherwise.

const classSummaries = {
  "accountForecast": "Mixin computing forecast-level P&L and the normalised forecast weights used to combine rules and instruments.",
  "accountInputs": "Adapter mixin exposing ~37 accessor methods that fetch prices, vol, positions, weights and config from other system stages.",
  "accountInstruments": "Mixin producing per-instrument portfolio-level P&L with SR or cash cost models and turnover.",
  "accountPortfolio": "Mixin aggregating instrument P&L into a portfolio account curve group and computing total turnover.",
  "accountSubsystem": "Mixin computing per-instrument subsystem P&L across the instrument list with SR or cash costs.",
  "accountTradingRules": "Mixin producing weighted/unweighted P&L curves for individual rules and grouped across all rules.",
  "accountWithMultiplier": "Mixin applying a compounding capital multiplier to convert notional P&L into actual-capital P&L.",
  "accountCurve": "Returns-series wrapper exposing performance statistics (Sharpe, drawdown, Sortino, t-tests) over a P&L calculator.",
  "AccountTTestResult": "Dataclass holding the result of a two-sample t-test on account curve returns.",
  "accountCurveGroup": "Group of account curves exposing aggregate net/gross/cost curves and cross-sectional stats tables.",
  "dictOfAccountCurves": "Dict of code->P&L-calculator that builds an aggregate account curve.",
  "nestedDictOfAccountCurves": "Two-level dict of account curves for hierarchical (rule->instrument) grouping.",
  "nestedAccountCurveGroup": "Two-level nested account curve group flattening to weighted/unweighted aggregate curves.",
  "statsDict": "Computes and formats cross-sectional statistics and correlations across an account curve group.",
  "AccountWithOrderSimulator": "Accounting stage deriving instrument P&L from a simulated order/fill stream.",
  "HourlyOrderSimulatorOfLimitOrders": "Order simulator specialised for hourly limit orders.",
  "AccountWithOrderSimulatorForLimitOrders": "Accounting stage wiring hourly limit-order simulation into P&L.",
  "HourlyOrderSimulatorOfMarketOrders": "Order simulator specialised for hourly market orders.",
  "AccountWithOrderSimulatorForHourlyMarketOrders": "Accounting stage wiring hourly market-order simulation into P&L.",
  "OrderSimulator": "Core engine iterating over daily series data to generate positions, orders and fills.",
  "OrdersSeriesData": "Container of the price/position series consumed by the order simulator.",
  "SimpleOrder": "Dataclass for a simple order (quantity plus optional limit price).",
  "ListOfSimpleOrders": "List wrapper of SimpleOrder objects.",
  "SimpleOrderWithDate": "Dataclass for a timestamped simple order.",
  "ListOfSimpleOrdersWithDate": "List wrapper of timestamped simple orders.",
  "pandlCalculationWithSRCosts": "P&L calculator deducting Sharpe-ratio-based costs derived from turnover.",
  "pandlCalculation": "Base P&L calculator converting positions/prices/fx/capital into a raw return series.",
  "pandlCalculationWithoutPositions": "P&L calculator for aggregating pre-computed P&L curves without explicit positions.",
  "dictOfPandlCalculatorsWithGenericCosts": "Dict of generic-cost P&L calculators that sums to an aggregate curve.",
  "pandlCalculationWithCashCostsAndFills": "P&L calculator computing realistic cash costs from individual fills.",
  "pandlCalculationWithGenericCosts": "Mixin combining gross returns and costs into net/gross/cost curves.",
  "pandlCalculationWithFills": "Mixin inferring positions from fills and marking to market.",
};

function classTagsFor(p, name) {
  if (p.includes("/curves/")) return ["account-curve", "performance-stats", "accounting"];
  if (p.includes("/order_simulator/")) return ["order-simulation", "backtesting", "accounting"];
  if (p.includes("/pandl_calculators/")) return ["pandl", "costs", "accounting"];
  if (name.startsWith("account")) return ["service", "accounting", "backtesting"];
  return ["accounting", "backtesting", "data-model"];
}

const results = JSON.parse(fs.readFileSync(ROOT + "/.understand-anything/tmp/ua-file-extract-results-13.json","utf8")).results;
const byPath = {};
for (const r of results) byPath[r.path] = r;

// Build file nodes
for (const p of Object.keys(bid)) {
  const m = fileMeta[p];
  addNode({
    id: "file:" + p, type: "file", name: fileNames[p], filePath: p,
    summary: m.summary, tags: m.tags, complexity: m.complexity
  });
}

// exported names set per file (from extract results)
function exportedSet(r){ return new Set((r.exports||[]).map(e=>e.name)); }

// Build class & function nodes + contains/exports edges
for (const r of results) {
  const p = r.path;
  const exp = exportedSet(r);
  for (const c of (r.classes||[])) {
    const lines = c.endLine - c.startLine + 1;
    const sig = (c.methods||[]).length >= 2 || lines >= 20;
    if (!sig) continue;
    const id = `class:${p}:${c.name}`;
    addNode({
      id, type: "class", name: c.name, filePath: p,
      lineRange: [c.startLine, c.endLine],
      summary: classSummaries[c.name] || `Class ${c.name} defined in ${fileNames[p]}.`,
      tags: classTagsFor(p, c.name),
      complexity: lines >= 200 ? "complex" : lines >= 60 ? "moderate" : "simple"
    });
    addEdge({source:"file:"+p, target:id, type:"contains", direction:"forward", weight:1.0});
    if (exp.has(c.name)) addEdge({source:"file:"+p, target:id, type:"exports", direction:"forward", weight:0.8});
  }
  for (const fn of (r.functions||[])) {
    const lines = fn.endLine - fn.startLine + 1;
    const sig = lines >= 10 || exp.has(fn.name);
    if (!sig) continue;
    const id = `function:${p}:${fn.name}`;
    addNode({
      id, type: "function", name: fn.name, filePath: p,
      lineRange: [fn.startLine, fn.endLine],
      summary: `Function ${fn.name} in ${fileNames[p]}.`,
      tags: ["accounting","backtesting","utility"],
      complexity: lines >= 40 ? "moderate" : "simple"
    });
    addEdge({source:"file:"+p, target:id, type:"contains", direction:"forward", weight:1.0});
    if (exp.has(fn.name)) addEdge({source:"file:"+p, target:id, type:"exports", direction:"forward", weight:0.8});
  }
}

// Function summaries (curated for module-level functions)
function fsum(){}
const funcSummaries = {
  "function:systems/accounts/account_forecast.py:pandl_for_instrument_forecast": "Module-level function computing the P&L return series for a single instrument's forecast given price, capital, vol and SR cost.",
  "function:systems/accounts/account_forecast.py:pandl_for_position": "Module-level function computing position-level P&L from a notional position, price and SR cost.",
  "function:systems/accounts/account_forecast.py:_get_average_notional_position": "Derives the average notional position from vol target, capital and contract value.",
  "function:systems/accounts/curves/account_curve_analysis.py:account_t_test": "Runs a two-sample t-test comparing returns of two account curves.",
  "function:systems/accounts/curves/account_curve_analysis.py:standard_statistics": "Extracts a standard dictionary of performance statistics from an account curve.",
  "function:systems/accounts/order_simulator/fills_and_orders.py:fill_list_of_simple_orders": "Generates fills for a list of simple orders against a price series.",
  "function:systems/accounts/order_simulator/fills_and_orders.py:fill_from_simple_limit_order": "Determines whether a simple limit order fills and at what price for a bar.",
  "function:systems/accounts/order_simulator/fills_and_orders.py:fill_from_simple_order": "Routes a simple order to the appropriate market or limit fill logic.",
  "function:systems/accounts/order_simulator/fills_and_orders.py:fill_from_simple_market_order": "Computes the fill for a simple market order at the bar price.",
  "function:systems/accounts/order_simulator/pandl_order_simulator.py:build_daily_series_data_for_order_simulator": "Assembles the daily price/position series data consumed by the order simulator.",
  "function:systems/accounts/order_simulator/pandl_order_simulator.py:generate_positions_orders_and_fills_from_series_data": "Iterates the series data to produce positions, orders and fills for the backtest.",
  "function:systems/accounts/order_simulator/pandl_order_simulator.py:generate_order_and_fill_at_idx_point_for_market_orders": "Generates a market order and its fill at a single time index point.",
  "function:systems/accounts/order_simulator/hourly_limit_orders.py:generate_order_and_fill_at_idx_point_for_limit_orders": "Generates a limit order and its fill at a single hourly index point.",
  "function:systems/accounts/order_simulator/hourly_market_orders.py:_build_hourly_series_data_for_order_simulator": "Builds the hourly series data feeding the market-order simulator.",
  "function:systems/accounts/curves/account_curve.py:quant_ratio_lower_curve": "Computes the lower quantile ratio statistic for an account curve.",
  "function:systems/accounts/curves/account_curve.py:quant_ratio_upper_curve": "Computes the upper quantile ratio statistic for an account curve.",
  "function:systems/accounts/pandl_calculators/pandl_SR_cost.py:calculate_SR_cost_per_period_of_position_data_match_price_index": "Computes per-period SR-based cost aligned to the price index from position turnover.",
  "function:systems/accounts/pandl_calculators/pandl_calculation.py:calculate_pandl": "Core routine turning positions and price changes into a P&L series.",
  "function:systems/accounts/pandl_calculators/pandl_calculation.py:apply_weighting": "Applies a weighting series to a P&L curve.",
  "function:systems/accounts/pandl_calculators/pandl_cash_costs.py:calculate_cost_from_fill_with_cost_object": "Calculates cash cost for a set of fills using an instrument cost object.",
  "function:systems/accounts/pandl_calculators/pandl_using_fills.py:merge_fill_prices_with_prices": "Merges fill prices into a market price series for mark-to-market P&L.",
  "function:systems/accounts/pandl_calculators/pandl_using_fills.py:infer_positions_from_fills": "Reconstructs a position series by cumulating signed fill quantities.",
  "function:systems/accounts/pandl_calculators/pandl_using_fills.py:unique_trades_df": "Collapses fills into a dataframe of unique trades.",
  "function:systems/accounts/pandl_calculators/pandl_calculation_dict.py:sum_list_of_pandl_curves": "Sums a list of P&L curves into a single aggregate curve.",
  "function:systems/provided/rules/factors.py:conditioned_factor_trading_rule": "Trading rule producing a factor signal conditioned on (divided by) volatility.",
  "function:systems/provided/rules/factors.py:factor_trading_rule": "Trading rule producing a raw factor-based forecast signal.",
  "function:systems/accounts/curves/stats_dict.py:_from_freq_str_to_frequency": "Maps a frequency string to a Frequency enum value.",
};
// re-run function nodes with summaries now available: patch existing nodes
for (const n of nodes) {
  if (n.type === "function" && funcSummaries[n.id]) n.summary = funcSummaries[n.id];
  if (n.type === "function") {
    if (n.id.includes("factors.py")) n.tags = ["trading-rule","forecast","factor"];
    else if (n.id.includes("order_simulator")) n.tags = ["order-simulation","fills","backtesting"];
    else if (n.id.includes("curves/account_curve")) n.tags = ["performance-stats","statistics","account-curve"];
    else if (n.id.includes("pandl_")) n.tags = ["pandl","costs","accounting"];
    else n.tags = ["accounting","backtesting","utility"];
  }
}

// ---- Import edges (all 109) ----
for (const p of Object.keys(bid)) {
  for (const tgt of bid[p]) {
    addEdge({source:"file:"+p, target:"file:"+tgt, type:"imports", direction:"forward", weight:0.7});
  }
}

fs.writeFileSync(ROOT + "/.understand-anything/tmp/graph-13-full.json", JSON.stringify({nodes, edges}, null, 2));
const importCount = edges.filter(e=>e.type==="imports").length;
console.log("nodes:", nodes.length, "edges:", edges.length, "imports:", importCount);
