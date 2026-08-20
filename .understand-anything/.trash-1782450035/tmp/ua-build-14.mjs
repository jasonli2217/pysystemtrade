import fs from "fs";

const ROOT = "/Users/jasonli/Dev/FORKed repo/pysystemtrade";
const imp = JSON.parse(fs.readFileSync(ROOT + "/.understand-anything/tmp/ua-batch-14-import.json", "utf8"));

const fileNode = (path, name, summary, tags, complexity, languageNotes) => {
  const n = { id: "file:" + path, type: "file", name, filePath: path, summary, tags, complexity };
  if (languageNotes) n.languageNotes = languageNotes;
  return n;
};
const fnNode = (path, name, range, summary, tags, complexity) => ({
  id: "function:" + path + ":" + name, type: "function", name, filePath: path,
  lineRange: range, summary, tags, complexity,
});
const clsNode = (path, name, range, summary, tags, complexity) => ({
  id: "class:" + path + ":" + name, type: "class", name, filePath: path,
  lineRange: range, summary, tags, complexity,
});

const nodes = [];
const subEdges = []; // contains/exports/calls etc (non-import)

function addFile(node, subs) {
  nodes.push(node);
  for (const s of subs) {
    nodes.push(s);
    subEdges.push({ source: node.id, target: s.id, type: "contains", direction: "forward", weight: 1.0 });
    if (s.exported) {
      subEdges.push({ source: node.id, target: s.id, type: "exports", direction: "forward", weight: 0.8 });
      delete s.exported;
    }
  }
}

// ---------- syscore/genutils.py ----------
addFile(
  fileNode("syscore/genutils.py", "genutils.py",
    "General-purpose Python utility helpers (list set operations, number formatting, sign/NaN handling, HCF math, interval intersection) used pervasively across the codebase.",
    ["utility", "helpers", "list-operations", "math"], "complex",
    "Pure-stdlib helpers with a mix of typed and untyped functions; a frequent low-level dependency."),
  [
    Object.assign(fnNode("syscore/genutils.py", "return_another_value_if_nan", [161,193],
      "Returns a fallback value when the input is NaN/None, handling scalars and various nan-like representations.",
      ["utility", "nan-handling", "validation"], "simple"), {exported:true}),
    Object.assign(fnNode("syscore/genutils.py", "list_of_ints_with_highest_common_factor_positive_first", [315,347],
      "Reduces a list of ints by their highest common factor, normalising sign so the first element is positive.",
      ["utility", "math", "normalisation"], "moderate"), {exported:true}),
    Object.assign(fnNode("syscore/genutils.py", "intersection_intervals", [363,384],
      "Computes the overlapping intersection across a collection of numeric intervals.",
      ["utility", "intervals", "math"], "moderate"), {exported:true}),
    Object.assign(fnNode("syscore/genutils.py", "str_of_int", [115,135],
      "Formats an integer to a string with sensible handling of large/edge values.",
      ["utility", "formatting"], "simple"), {exported:true}),
    Object.assign(clsNode("syscore/genutils.py", "quickTimer", [216,239],
      "Lightweight timer that tracks elapsed time against a limit to flag finished/unfinished states.",
      ["utility", "timer"], "simple"), {exported:true}),
  ]);

// ---------- syscore/interactive/progress_bar.py ----------
addFile(
  fileNode("syscore/interactive/progress_bar.py", "progress_bar.py",
    "Console progress bar with time-remaining estimation, iterated over long-running batch jobs across production and estimation code.",
    ["utility", "progress-bar", "cli", "interactive"], "moderate"),
  [
    Object.assign(clsNode("syscore/interactive/progress_bar.py", "progressBar", [7,175],
      "Stateful progress bar that renders blocks and elapsed/remaining time estimates as iterations advance.",
      ["progress-bar", "cli", "stateful"], "complex"), {exported:true}),
  ]);

// ---------- syscore/pandas/find_data.py ----------
addFile(
  fileNode("syscore/pandas/find_data.py", "find_data.py",
    "Pandas helpers for locating the row of a DataFrame or Series aligned to (or just before) a given date.",
    ["utility", "pandas", "time-series"], "moderate"),
  [
    fnNode("syscore/pandas/find_data.py", "get_row_of_df_aligned_to_weights_as_dict", [9,28],
      "Returns the DataFrame row nearest a date as a dict, used to align data to weight dates.",
      ["pandas", "time-series", "lookup"], "simple"),
    fnNode("syscore/pandas/find_data.py", "get_row_of_series", [31,50],
      "Returns the Series value aligned to a relevant date.",
      ["pandas", "time-series", "lookup"], "simple"),
    fnNode("syscore/pandas/find_data.py", "get_row_of_series_before_date", [53,70],
      "Returns the most recent Series value strictly before a given date.",
      ["pandas", "time-series", "lookup"], "simple"),
  ]);

// ---------- sysexecution/strategies/dynamic_optimised_positions.py ----------
addFile(
  fileNode("sysexecution/strategies/dynamic_optimised_positions.py", "dynamic_optimised_positions.py",
    "Order-generator strategy that converts raw optimal positions into integer-contract optimised positions via a dynamic small-system optimiser, then emits the trades needed to reach them.",
    ["strategy", "optimisation", "order-generation", "execution"], "complex",
    "Bridges the estimation/optimisation layer (correlations, covariance, weights) with live order generation."),
  [
    Object.assign(clsNode("sysexecution/strategies/dynamic_optimised_positions.py", "orderGeneratorForDynamicPositions", [64,140],
      "Order generator that builds, writes and returns optimised positions data and the required orders to reach them.",
      ["order-generation", "strategy", "execution"], "complex"), {exported:true}),
    Object.assign(clsNode("sysexecution/strategies/dynamic_optimised_positions.py", "dataForObjectiveInstance", [168,197],
      "Container bundling prior/optimal weights and constraints fed into the optimisation objective.",
      ["data-model", "optimisation"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysexecution/strategies/dynamic_optimised_positions.py", "get_data_for_objective_instance", [200,288],
      "Assembles all inputs (per-contract values, costs, constraints, covariance) into a dataForObjectiveInstance for the optimiser.",
      ["optimisation", "data-assembly"], "complex"), {exported:true}),
    Object.assign(fnNode("sysexecution/strategies/dynamic_optimised_positions.py", "get_optimised_positions_data_dict_given_optimisation", [547,590],
      "Runs the optimisation objective and maps the resulting weights back to per-instrument optimised position entries.",
      ["optimisation", "positions"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysexecution/strategies/dynamic_optimised_positions.py", "trade_given_optimal_and_actual_positions", [700,739],
      "Computes the trade for one instrument by differencing its optimised target against the current position.",
      ["order-generation", "positions"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysexecution/strategies/dynamic_optimised_positions.py", "get_covariance_matrix_for_instrument_returns_for_optimisation", [463,477],
      "Builds the covariance matrix of instrument returns used by the optimiser.",
      ["optimisation", "covariance", "risk"], "simple"), {exported:true}),
  ]);

// ---------- sysinit/futures/check_instrument_lists.py ----------
addFile(
  fileNode("sysinit/futures/check_instrument_lists.py", "check_instrument_lists.py",
    "Initialisation/diagnostic script that audits the configured instrument universe for high correlations, zero commissions, and missing or no-trade markets.",
    ["script", "diagnostics", "instruments", "initialisation"], "moderate"),
  [
    Object.assign(fnNode("sysinit/futures/check_instrument_lists.py", "check_for_high_correlations", [22,54],
      "Reports instrument pairs whose return correlation exceeds a threshold, flagging near-duplicate markets.",
      ["diagnostics", "correlation", "instruments"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysinit/futures/check_instrument_lists.py", "print_missing_and_no_trade_markets", [79,102],
      "Prints instruments that are missing from data or configured as no-trade.",
      ["diagnostics", "instruments", "reporting"], "moderate"), {exported:true}),
  ]);

// ---------- sysproduction/data/instruments.py ----------
addFile(
  fileNode("sysproduction/data/instruments.py", "instruments.py",
    "Production data access layer for instrument metadata and trading costs (spread/commission, point size, currency, asset class) backed by the data blob.",
    ["data-access", "instruments", "service", "costs"], "moderate"),
  [
    Object.assign(clsNode("sysproduction/data/instruments.py", "diagInstruments", [38,152],
      "Diagnostic accessor exposing instrument metadata and cost objects (spread, commission, point size, currency, asset class).",
      ["data-access", "instruments", "costs"], "complex"), {exported:true}),
    Object.assign(clsNode("sysproduction/data/instruments.py", "updateSpreadCosts", [18,35],
      "Writer that updates stored spread-cost data for instruments.",
      ["data-access", "instruments", "costs", "writer"], "simple"), {exported:true}),
  ]);

// ---------- sysproduction/data/risk.py ----------
addFile(
  fileNode("sysproduction/data/risk.py", "risk.py",
    "Production risk-data helpers: builds covariance/correlation matrices for instrument returns, per-instrument annualised/daily stdevs, and per-contract exposure used by risk reporting and position sizing.",
    ["data-access", "risk", "covariance", "volatility"], "complex",
    "Deliberately replicates the simulation's correlation-list construction so production risk matches backtest risk."),
  [
    Object.assign(fnNode("sysproduction/data/risk.py", "get_covariance_matrix_for_instrument_returns", [26,44],
      "Builds the covariance matrix for a list of instruments from correlation and stdev estimates.",
      ["risk", "covariance", "estimation"], "simple"), {exported:true}),
    Object.assign(fnNode("sysproduction/data/risk.py", "get_correlation_matrix_for_instrument_returns", [47,60],
      "Estimates the correlation matrix of instrument returns using configured estimation parameters.",
      ["risk", "correlation", "estimation"], "simple"), {exported:true}),
    Object.assign(fnNode("sysproduction/data/risk.py", "_replicate_creation_of_correlation_list_in_sim", [63,76],
      "Re-creates the simulation's correlation-list construction so production risk numbers match the backtest.",
      ["risk", "correlation", "consistency"], "simple"), {exported:false}),
  ]);

// ---------- sysproduction/interactive_controls.py ----------
addFile(
  fileNode("sysproduction/interactive_controls.py", "interactive_controls.py",
    "Interactive operator menu for managing trade/position limits, instrument and strategy overrides, process controls, slippage cost updates, and instrument deletion in the live production system.",
    ["interactive", "cli", "controls", "production", "entry-point"], "complex",
    "Large menu-driven control surface wiring together many production data accessors and reporting modules."),
  [
    Object.assign(fnNode("sysproduction/interactive_controls.py", "get_list_of_changes_to_make_to_slippage", [846,917],
      "Compares configured vs sampled slippage and builds the list of cost changes an operator can apply.",
      ["controls", "costs", "slippage"], "complex"), {exported:true}),
    Object.assign(fnNode("sysproduction/interactive_controls.py", "get_auto_population_parameters", [309,352],
      "Prompts the operator for the parameters used to auto-populate trade limits.",
      ["controls", "limits", "interactive"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/interactive_controls.py", "get_maximum_position_given_risk_concentration_limit", [469,506],
      "Derives the maximum allowed position for an instrument given a risk-concentration limit.",
      ["controls", "risk", "limits"], "moderate"), {exported:false}),
    Object.assign(fnNode("sysproduction/interactive_controls.py", "check_price_multipliers_consistent_for_instrument", [977,1027],
      "Validates that an instrument's price multipliers are internally consistent across data sources.",
      ["controls", "validation", "instruments"], "complex"), {exported:false}),
    Object.assign(fnNode("sysproduction/interactive_controls.py", "set_trade_limit_for_instrument", [255,278],
      "Computes and stores an auto-populated trade limit for a single instrument.",
      ["controls", "limits"], "moderate"), {exported:true}),
  ]);

// ---------- sysproduction/reporting/adhoc/instrument_list.py ----------
addFile(
  fileNode("sysproduction/reporting/adhoc/instrument_list.py", "instrument_list.py",
    "Ad-hoc report compiling per-instrument metadata (broker/contract details, costs) into a DataFrame for the instrument-list report.",
    ["reporting", "instruments", "adhoc"], "moderate"),
  [
    Object.assign(fnNode("sysproduction/reporting/adhoc/instrument_list.py", "instrument_list_report", [21,59],
      "Builds the full instrument-list report by gathering metadata across the instrument universe.",
      ["reporting", "instruments"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/adhoc/instrument_list.py", "instrument_results_as_pd_df_row", [62,88],
      "Assembles one instrument's metadata into a single report DataFrame row.",
      ["reporting", "instruments", "pandas"], "moderate"), {exported:true}),
  ]);

// ---------- sysproduction/reporting/data/constants.py ----------
addFile(
  fileNode("sysproduction/reporting/data/constants.py", "constants.py",
    "Shared constants for the reporting data modules (e.g. column labels and default thresholds).",
    ["constants", "reporting", "configuration"], "simple"),
  []);

// ---------- sysproduction/reporting/data/costs.py ----------
addFile(
  fileNode("sysproduction/reporting/data/costs.py", "costs.py",
    "Trading-cost reporting data: estimates per-instrument SR costs by blending configured, sampled, and actual-trade spread/commission data into a comparison table.",
    ["reporting", "costs", "estimation"], "complex"),
  [
    Object.assign(fnNode("sysproduction/reporting/data/costs.py", "best_estimate_from_cost_data", [182,249],
      "Blends bid/ask, actual-trade, sampling, and configured cost estimates into a single best-estimate spread, weighting by sample counts.",
      ["costs", "estimation", "blending"], "complex"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/costs.py", "get_SR_cost_calculation_for_instrument", [32,73],
      "Computes the Sharpe-ratio cost of trading an instrument from spread and commission components.",
      ["costs", "sharpe-ratio"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/costs.py", "get_combined_df_of_costs", [140,179],
      "Combines configured, sampled, and estimated cost series into one comparison DataFrame.",
      ["costs", "pandas", "reporting"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/costs.py", "get_table_of_SR_costs", [315,344],
      "Produces the report table of SR costs across instruments, optionally excluding some.",
      ["costs", "reporting", "sharpe-ratio"], "moderate"), {exported:true}),
  ]);

// ---------- sysproduction/reporting/data/duplicate_remove_markets.py ----------
addFile(
  fileNode("sysproduction/reporting/data/duplicate_remove_markets.py", "duplicate_remove_markets.py",
    "Logic for identifying duplicate/expensive/low-volume markets and recommending a bad-market exclusion list, rendered as YAML and report tables.",
    ["reporting", "instruments", "market-selection", "data-quality"], "complex"),
  [
    Object.assign(clsNode("sysproduction/reporting/data/duplicate_remove_markets.py", "RemoveMarketData", [41,291],
      "Aggregates expensive, low-volume, and duplicate markets into recommended bad-market lists with YAML-formatted output.",
      ["market-selection", "data-quality", "reporting"], "complex"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/duplicate_remove_markets.py", "table_of_duplicate_markets_for_dict_entry", [459,491],
      "Builds a comparison table for a group of duplicate markets, applying cost/volume filters.",
      ["market-selection", "reporting"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/duplicate_remove_markets.py", "get_remove_market_data", [307,336],
      "Assembles the RemoveMarketData object from production data sources.",
      ["market-selection", "data-assembly"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/duplicate_remove_markets.py", "calculate_threshold_factor", [546,569],
      "Computes the multiplicative threshold factor applied when filtering markets by cost/volume.",
      ["market-selection", "thresholds"], "moderate"), {exported:false}),
  ]);

// ---------- sysproduction/reporting/data/risk.py ----------
addFile(
  fileNode("sysproduction/reporting/data/risk.py", "risk.py",
    "Comprehensive risk-reporting data layer: minimum-capital tables, per-instrument and portfolio risk as percent of capital, beta loadings by asset class, and correlation/clustering across strategies.",
    ["reporting", "risk", "portfolio", "beta"], "complex",
    "The largest module in the batch; computes portfolio risk decomposition and asset-class beta loadings from weights, correlations and stdevs."),
  [
    Object.assign(clsNode("sysproduction/reporting/data/risk.py", "portfolioRisks", [214,318],
      "Computes portfolio-level risk and beta loadings by asset class from weights, correlation matrix and instrument stdevs.",
      ["risk", "portfolio", "beta"], "complex"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/risk.py", "from_risk_table_to_min_capital", [96,148],
      "Derives minimum required capital per instrument from a risk table given risk target, min contracts, IDM and instrument weight.",
      ["risk", "capital", "sizing"], "complex"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/risk.py", "minimum_capital_table", [73,93],
      "Builds the minimum-capital report table across instruments.",
      ["risk", "capital", "reporting"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/risk.py", "get_instrument_risk_table", [151,175],
      "Assembles the per-instrument risk table used throughout the risk report.",
      ["risk", "reporting", "data-assembly"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/risk.py", "calculate_beta_loadings_across_asset_classes", [714,732],
      "Computes beta loadings of each instrument relative to its asset class.",
      ["risk", "beta", "asset-class"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/risk.py", "portfolio_beta_for_asset_class", [937,961],
      "Computes the portfolio beta contribution for a single asset class given weights and returns.",
      ["risk", "beta", "portfolio"], "moderate"), {exported:true}),
  ]);

// ---------- sysproduction/reporting/data/trades.py ----------
addFile(
  fileNode("sysproduction/reporting/data/trades.py", "trades.py",
    "Trade-reporting data layer: pulls recent broker orders and computes raw, cash, and vol-normalised slippage plus execution delays for the trades report.",
    ["reporting", "trades", "slippage", "execution"], "complex"),
  [
    Object.assign(fnNode("sysproduction/reporting/data/trades.py", "cash_slippage_row", [209,251],
      "Converts a raw-slippage row into cash terms using contract value and FX.",
      ["slippage", "trades", "cash"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/trades.py", "vol_slippage_row", [291,333],
      "Normalises a slippage row by recent annual volatility to express slippage in vol units.",
      ["slippage", "trades", "volatility"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysproduction/reporting/data/trades.py", "price_calculations_for_order_row", [143,178],
      "Derives mid/fill/limit price metrics for one order row used in slippage calculation.",
      ["slippage", "trades", "pricing"], "moderate"), {exported:false}),
    Object.assign(fnNode("sysproduction/reporting/data/trades.py", "delay_row", [390,411],
      "Computes the timing-delay metrics (submit to fill) for one order row.",
      ["trades", "execution", "timing"], "moderate"), {exported:false}),
  ]);

// ---------- sysproduction/reporting/data/volume.py ----------
addFile(
  fileNode("sysproduction/reporting/data/volume.py", "volume.py",
    "Liquidity-reporting helpers computing average daily contract volume and per-instrument liquidity for the volume report.",
    ["reporting", "volume", "liquidity"], "moderate"),
  [
    fnNode("sysproduction/reporting/data/volume.py", "get_liquidity_data_df", [15,36],
      "Builds the per-instrument liquidity DataFrame for the volume report.",
      ["volume", "liquidity", "reporting"], "moderate"),
    fnNode("sysproduction/reporting/data/volume.py", "get_best_average_daily_volume_for_instrument", [63,78],
      "Selects the best available average daily volume estimate for an instrument across its contracts.",
      ["volume", "liquidity"], "moderate"),
  ]);

// ---------- sysquant/estimators/clustering_correlations.py ----------
addFile(
  fileNode("sysquant/estimators/clustering_correlations.py", "clustering_correlations.py",
    "Hierarchical clustering of a correlation matrix into groups of a target size, returning assets ordered by cluster.",
    ["estimation", "correlation", "clustering"], "moderate"),
  [
    fnNode("sysquant/estimators/clustering_correlations.py", "cluster_correlation_matrix", [16,29],
      "Clusters a correlation matrix into groups of the requested size and returns assets in cluster order.",
      ["correlation", "clustering"], "moderate"),
    fnNode("sysquant/estimators/clustering_correlations.py", "get_list_of_clusters_for_correlation_matrix", [48,63],
      "Runs hierarchical clustering on the numpy correlation matrix and returns cluster index assignments.",
      ["correlation", "clustering"], "moderate"),
  ]);

// ---------- sysquant/estimators/correlation_estimator.py ----------
addFile(
  fileNode("sysquant/estimators/correlation_estimator.py", "correlation_estimator.py",
    "Concrete correlation estimator subclassing the generic estimator, with a helper to estimate the correlation for a single sub-period.",
    ["estimation", "correlation"], "moderate"),
  [
    Object.assign(clsNode("sysquant/estimators/correlation_estimator.py", "correlationEstimator", [15,46],
      "Generic-estimator subclass that produces cleaned correlation estimates, falling back gracefully when data is missing.",
      ["estimation", "correlation"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysquant/estimators/correlation_estimator.py", "correlation_estimator_for_subperiod", [49,73],
      "Estimates and cleans the correlation matrix for one fit sub-period with shrinkage and flooring options.",
      ["estimation", "correlation", "cleaning"], "moderate"), {exported:true}),
  ]);

// ---------- sysquant/estimators/correlation_over_time.py ----------
addFile(
  fileNode("sysquant/estimators/correlation_over_time.py", "correlation_over_time.py",
    "Rolling correlation estimation over time, producing a sequence of correlation matrices across fit periods.",
    ["estimation", "correlation", "time-series"], "moderate"),
  [
    fnNode("sysquant/estimators/correlation_over_time.py", "correlation_over_time", [29,65],
      "Iterates fit periods to build a time series of correlation estimates from returns data.",
      ["correlation", "time-series", "estimation"], "moderate"),
    fnNode("sysquant/estimators/correlation_over_time.py", "correlation_over_time_for_returns", [9,26],
      "Convenience wrapper computing correlations over time directly from a returns DataFrame.",
      ["correlation", "time-series"], "moderate"),
  ]);

// ---------- sysquant/estimators/correlations.py ----------
addFile(
  fileNode("sysquant/estimators/correlations.py", "correlations.py",
    "Core correlation data structures and cleaning logic: the correlationEstimate matrix wrapper, a time-indexed CorrelationList, and routines to clean/shrink/floor correlation matrices.",
    ["estimation", "correlation", "data-model", "cleaning"], "complex",
    "Central correlation abstraction imported by most estimators and risk modules in the batch."),
  [
    Object.assign(clsNode("sysquant/estimators/correlations.py", "correlationEstimate", [16,261],
      "Wrapper around a correlation matrix with pandas/numpy conversion, key handling, and boring/missing-data checks.",
      ["correlation", "data-model", "matrix"], "complex"), {exported:true}),
    Object.assign(clsNode("sysquant/estimators/correlations.py", "CorrelationList", [433,456],
      "Time-indexed list of correlation estimates supporting lookup of the most recent matrix before a date.",
      ["correlation", "data-model", "time-series"], "simple"), {exported:true}),
    Object.assign(fnNode("sysquant/estimators/correlations.py", "clean_correlation", [303,378],
      "Replaces missing/invalid correlation entries with sensible defaults so the matrix is usable downstream.",
      ["correlation", "cleaning", "data-quality"], "complex"), {exported:true}),
    Object.assign(fnNode("sysquant/estimators/correlations.py", "modify_correlation", [459,473],
      "Applies flooring-at-zero, shrinkage, and clipping transformations to a correlation matrix.",
      ["correlation", "shrinkage", "cleaning"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysquant/estimators/correlations.py", "create_boring_corr_matrix", [264,281],
      "Constructs a uniform off-diagonal correlation matrix used as a fallback when no data is available.",
      ["correlation", "fallback"], "moderate"), {exported:true}),
  ]);

// ---------- sysquant/estimators/covariance.py ----------
addFile(
  fileNode("sysquant/estimators/covariance.py", "covariance.py",
    "Covariance estimate type plus helpers to build covariance from stdev and correlation and to compute annualised portfolio risk.",
    ["estimation", "covariance", "risk"], "moderate"),
  [
    Object.assign(clsNode("sysquant/estimators/covariance.py", "covarianceEstimate", [9,24],
      "Covariance matrix type exposing cleaning, shrinkage and missing-data helpers.",
      ["covariance", "data-model", "risk"], "simple"), {exported:true}),
    Object.assign(fnNode("sysquant/estimators/covariance.py", "covariance_from_stdev_and_correlation", [27,46],
      "Builds a covariance estimate by combining a correlation matrix with a stdev estimate.",
      ["covariance", "correlation", "risk"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysquant/estimators/covariance.py", "get_annualised_risk", [49,64],
      "Computes annualised portfolio standard deviation from weights, stdevs and a covariance matrix.",
      ["risk", "covariance", "portfolio"], "moderate"), {exported:true}),
  ]);

// ---------- sysquant/estimators/diversification_multipliers.py ----------
addFile(
  fileNode("sysquant/estimators/diversification_multipliers.py", "diversification_multipliers.py",
    "Computes diversification multipliers from a time series of correlation matrices and weights, with an EWMA-smoothed single-period calculation.",
    ["estimation", "diversification", "correlation"], "moderate"),
  [
    fnNode("sysquant/estimators/diversification_multipliers.py", "diversification_multiplier_from_list", [9,72],
      "Builds an EWMA-smoothed time series of diversification multipliers from a correlation list and weights.",
      ["diversification", "correlation", "time-series"], "complex"),
    fnNode("sysquant/estimators/diversification_multipliers.py", "diversification_mult_single_period", [75,96],
      "Computes a single-period diversification multiplier from a correlation matrix and weights, capped at a maximum.",
      ["diversification", "correlation"], "moderate"),
  ]);

// ---------- sysquant/estimators/estimates.py ----------
addFile(
  fileNode("sysquant/estimators/estimates.py", "estimates.py",
    "Estimates container bundling means, stdevs and a correlation matrix, with equalisation and shrinkage transforms used in portfolio optimisation.",
    ["estimation", "data-model", "optimisation", "shrinkage"], "complex"),
  [
    Object.assign(clsNode("sysquant/estimators/estimates.py", "Estimates", [13,107],
      "Container for mean/stdev/correlation estimates exposing equalisation, shrinkage and subsetting for optimisation inputs.",
      ["data-model", "estimation", "optimisation"], "complex"), {exported:true}),
    Object.assign(fnNode("sysquant/estimators/estimates.py", "equalise_estimates", [110,147],
      "Optionally equalises Sharpe ratios and/or vols across assets to reduce estimation error in optimisation.",
      ["shrinkage", "estimation", "optimisation"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysquant/estimators/estimates.py", "shrink_SR_with_lists", [234,261],
      "Shrinks per-asset Sharpe ratios toward a target SR using mean/stdev lists.",
      ["shrinkage", "sharpe-ratio"], "moderate"), {exported:true}),
    Object.assign(fnNode("sysquant/estimators/estimates.py", "vol_equaliser", [183,207],
      "Rescales means so all assets share a common volatility level.",
      ["equalisation", "volatility"], "moderate"), {exported:true}),
  ]);

// ---------- sysquant/estimators/exponential_correlation.py ----------
addFile(
  fileNode("sysquant/estimators/exponential_correlation.py", "exponential_correlation.py",
    "Exponentially-weighted correlation estimator that produces per-fit-period correlation matrices and a results object for date-based lookup.",
    ["estimation", "correlation", "ewma"], "complex"),
  [
    Object.assign(clsNode("sysquant/estimators/exponential_correlation.py", "exponentialCorrelation", [14,137],
      "EWMA correlation estimator that computes raw correlations per fit period with cleaning/shrinkage/flooring options.",
      ["correlation", "ewma", "estimation"], "complex"), {exported:true}),
    Object.assign(clsNode("sysquant/estimators/exponential_correlation.py", "exponentialCorrelationResults", [140,177],
      "Holds raw EWMA correlations and returns the last valid correlation matrix for a given date.",
      ["correlation", "ewma", "data-model"], "moderate"), {exported:true}),
  ]);

// ---------- sysquant/estimators/forecast_scalar.py ----------
addFile(
  fileNode("sysquant/estimators/forecast_scalar.py", "forecast_scalar.py",
    "Computes a rolling forecast scalar so that the cross-sectional average absolute forecast hits a target level.",
    ["estimation", "forecast", "scaling"], "moderate"),
  [
    fnNode("sysquant/estimators/forecast_scalar.py", "forecast_scalar", [8,50],
      "Calculates a rolling scalar that normalises forecasts to a target average absolute value.",
      ["forecast", "scaling", "estimation"], "moderate"),
  ]);

// ---------- sysquant/estimators/generic_estimator.py ----------
addFile(
  fileNode("sysquant/estimators/generic_estimator.py", "generic_estimator.py",
    "Generic estimation framework: base Estimate type plus exponential and generic estimator classes that drive per-fit-period or whole-dataset estimation, subclassed by the correlation estimators.",
    ["estimation", "framework", "base-class"], "complex",
    "Defines the estimator inheritance hierarchy reused by correlation and other estimators."),
  [
    Object.assign(clsNode("sysquant/estimators/generic_estimator.py", "genericEstimator", [94,156],
      "Base estimator orchestrating per-period or exponential estimation, with hooks subclasses override.",
      ["framework", "estimation", "base-class"], "complex"), {exported:true}),
    Object.assign(clsNode("sysquant/estimators/generic_estimator.py", "exponentialEstimator", [30,91],
      "Estimator variant that maintains exponentially-weighted calculations across the dataset.",
      ["framework", "estimation", "ewma"], "moderate"), {exported:true}),
    Object.assign(clsNode("sysquant/estimators/generic_estimator.py", "Estimate", [6,27],
      "Base estimate value type with key-ordered conversion and missing-data helpers.",
      ["data-model", "estimation", "base-class"], "simple"), {exported:true}),
  ]);

// ===== build import edges (1:1) =====
const importEdges = [];
for (const src of Object.keys(imp)) {
  for (const tgt of imp[src]) {
    importEdges.push({ source: "file:" + src, target: "file:" + tgt, type: "imports", direction: "forward", weight: 0.7 });
  }
}

// ===== inheritance edges (within batch) =====
const inheritEdges = [
  { source: "class:sysquant/estimators/correlation_estimator.py:correlationEstimator",
    target: "class:sysquant/estimators/generic_estimator.py:genericEstimator",
    type: "inherits", direction: "forward", weight: 0.9 },
];

const allEdges = [...importEdges, ...subEdges, ...inheritEdges];

// ===== split logic =====
const NODE_LIMIT = 60, EDGE_LIMIT = 120;
const parts = Math.ceil(Math.max(nodes.length / NODE_LIMIT, allEdges.length / EDGE_LIMIT));

// files alphabetical
const files = Object.keys(imp).slice().sort();
// also include files with no imports that exist as nodes (all 25 are keys in imp)
const perPart = Math.ceil(files.length / parts);
const groups = [];
for (let i = 0; i < parts; i++) groups.push(files.slice(i*perPart, (i+1)*perPart));

const nodeFileOf = (n) => n.filePath;
const outDir = ROOT + "/.understand-anything/intermediate";

let report = [];
if (parts === 1) {
  fs.writeFileSync(outDir + "/batch-14.json", JSON.stringify({ nodes, edges: allEdges }, null, 2));
  report.push("batch-14.json: " + nodes.length + " nodes, " + allEdges.length + " edges");
} else {
  for (let i = 0; i < parts; i++) {
    const fset = new Set(groups[i]);
    const partNodes = nodes.filter(n => fset.has(nodeFileOf(n)));
    const partNodeIds = new Set(partNodes.map(n => n.id));
    const partEdges = allEdges.filter(e => partNodeIds.has(e.source));
    fs.writeFileSync(outDir + "/batch-14-part-" + (i+1) + ".json",
      JSON.stringify({ nodes: partNodes, edges: partEdges }, null, 2));
    report.push("batch-14-part-" + (i+1) + ".json: " + partNodes.length + " nodes, " + partEdges.length + " edges");
  }
}

console.log("total nodes:", nodes.length);
console.log("total edges:", allEdges.length, "(imports:" + importEdges.length + ")");
console.log("parts:", parts);
report.forEach(r => console.log("  " + r));

// validate import count
console.log("import edges == 164 ?", importEdges.length === 164);
