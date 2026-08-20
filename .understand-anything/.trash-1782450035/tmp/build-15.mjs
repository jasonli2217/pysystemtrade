import fs from "fs";
const raw = JSON.parse(fs.readFileSync(".understand-anything/tmp/batch-15-raw.json","utf8"));
const imp = raw.batchImportData;

const nodes = [];
const edges = [];
const fileNode = (path, summary, tags, complexity, languageNotes) => {
  const name = path.split("/").pop();
  const n = { id:`file:${path}`, type:"file", name, filePath:path, summary, tags, complexity };
  if(languageNotes) n.languageNotes = languageNotes;
  nodes.push(n);
};
const sub = (kind, path, name, lr, summary, tags, complexity) => {
  nodes.push({ id:`${kind}:${path}:${name}`, type:kind, name, filePath:path, lineRange:lr, summary, tags, complexity });
  edges.push({ source:`file:${path}`, target:`${kind}:${path}:${name}`, type:"contains", direction:"forward", weight:1.0 });
};
const exp = (kind, path, name) => edges.push({ source:`file:${path}`, target:`${kind}:${path}:${name}`, type:"exports", direction:"forward", weight:0.8 });
const imports = (path) => (imp[path]||[]).forEach(t => edges.push({ source:`file:${path}`, target:`file:${t}`, type:"imports", direction:"forward", weight:0.7 }));
const calls = (path, targetPath, sym, kind="function") => edges.push({ source:`file:${path}`, target:`${kind}:${targetPath}:${sym}`, type:"calls", direction:"forward", weight:0.8 });

// ---- mean_estimator.py ----
let p="sysquant/estimators/mean_estimator.py";
fileNode(p,"Estimates the expected (mean) returns of assets for portfolio optimisation, providing both exponentially-weighted and simple subperiod mean estimators with annualisation helpers.",["estimator","data-model","optimisation","quant"],"moderate");
imports(p);
sub("class",p,"meanEstimates",[18,31],"Dict-like container of per-asset mean return estimates with subsetting and missing-data helpers.",["data-model","estimator"],"simple");
sub("class",p,"exponentialMeans",[34,84],"Exponentially-weighted mean estimator that computes EWMA means over a dataset and extracts fit-period estimates.",["estimator","exponential","quant"],"moderate");
sub("class",p,"meanEstimator",[97,123],"Generic mean estimator wrapper that dispatches between subperiod calculation and exponential estimation.",["estimator","factory"],"simple");
sub("function",p,"mean_estimator_for_subperiod",[126,148],"Computes simple per-asset annualised mean estimates over a single fit period.",["estimator","quant"],"simple");
["meanEstimates","exponentialMeans","meanEstimator"].forEach(s=>exp("class",p,s));
["mean_estimator_for_subperiod"].forEach(s=>exp("function",p,s));
calls(p,"syscore/pandas/find_data.py","get_max_index_before_datetime");

// ---- pooled_correlation.py ----
p="sysquant/estimators/pooled_correlation.py";
fileNode(p,"Computes a single pooled correlation matrix across multiple instruments' returns by stacking and downsampling their data.",["estimator","correlation","quant"],"simple");
imports(p);
sub("function",p,"pooled_correlation_estimator",[12,37],"Forward-fills, downsamples and stacks a list of returns DataFrames to produce one pooled correlation estimate.",["estimator","correlation","quant"],"simple");
exp("function",p,"pooled_correlation_estimator");
calls(p,"sysquant/estimators/correlation_over_time.py","correlation_over_time");
calls(p,"syscore/pandas/list_of_df.py","stacked_df_with_added_time_from_list");

// ---- stdev_estimator.py ----
p="sysquant/estimators/stdev_estimator.py";
fileNode(p,"Estimates asset return standard deviations (volatility) for optimisation, offering exponentially-weighted and simple subperiod estimators plus a time series of stdevs with shock helpers.",["estimator","volatility","optimisation","quant"],"complex");
imports(p);
sub("class",p,"stdevEstimates",[23,39],"Dict-like container of per-asset standard-deviation estimates with subsetting and missing-data helpers.",["data-model","estimator"],"simple");
sub("class",p,"seriesOfStdevEstimates",[42,66],"Time-indexed series of stdev estimates supporting lookup on a date and rolling-quantile shock scenarios.",["data-model","estimator","volatility"],"moderate");
sub("class",p,"exponentialStdev",[69,121],"Exponentially-weighted volatility estimator computing EWMA stdevs and per-fit-period estimates.",["estimator","exponential","volatility"],"moderate");
sub("class",p,"stdevEstimator",[137,159],"Generic stdev estimator wrapper dispatching between subperiod and exponential estimation.",["estimator","factory"],"simple");
sub("function",p,"stdev_estimator_for_subperiod",[162,181],"Computes simple per-asset annualised volatility estimates over a single fit period.",["estimator","volatility","quant"],"simple");
["stdevEstimates","seriesOfStdevEstimates","exponentialStdev","stdevEstimator"].forEach(s=>exp("class",p,s));
exp("function",p,"stdev_estimator_for_subperiod");
calls(p,"syscore/pandas/find_data.py","get_row_of_df_aligned_to_weights_as_dict");

// ---- test_mean_estimator.py ----
p="sysquant/estimators/tests/test_mean_estimator.py";
fileNode(p,"Unit test verifying that the exponential mean estimator returns an empty mean estimate when asked for a fit period before any data exists.",["test","estimator","quant"],"simple");
imports(p);
edges.push({source:`file:${p}`,target:`file:sysquant/estimators/mean_estimator.py`,type:"tested_by",direction:"forward",weight:0.5});
edges.push({source:`file:${p}`,target:`file:sysquant/fitting_dates.py`,type:"tested_by",direction:"forward",weight:0.5});

// ---- fitting_dates.py ----
p="sysquant/fitting_dates.py";
fileNode(p,"Generates in-sample/out-of-sample fitting date periods used to roll estimator and optimisation calculations through time (expanding or rolling windows).",["utility","optimisation","data-model","quant"],"complex");
imports(p);
sub("class",p,"fitDates",[9,28],"Value object describing one fit/period window with fit and out-of-sample start/end dates.",["data-model"],"simple");
sub("class",p,"listOfFittingDates",[31,47],"List of fitDates with helpers to find the most recent period before a given date.",["data-model","utility"],"simple");
sub("function",p,"generate_fitting_dates",[57,83],"Builds the list of fitting date periods from a dataset given a date method (expanding/rolling/in-sample).",["utility","quant"],"moderate");
sub("function",p,"generate_fitting_dates_given_start_and_end_date",[86,139],"Core routine constructing fit periods between an explicit start and end date for a given roll method.",["utility","quant"],"moderate");
sub("function",p,"_list_of_starting_dates_per_period",[157,178],"Builds the reversed list of period start dates at the requested interval frequency.",["utility"],"simple");
sub("function",p,"_fit_dates_for_period_index",[181,203],"Computes the fit window and period window for a single period index given the roll method.",["utility"],"simple");
sub("function",p,"_add_dummy_period_if_required",[206,224],"Prepends a no-data dummy period so early dates are covered before the first real fit.",["utility"],"simple");
["fitDates","listOfFittingDates"].forEach(s=>exp("class",p,s));
["generate_fitting_dates","generate_fitting_dates_given_start_and_end_date"].forEach(s=>exp("function",p,s));

// ---- SR_adjustment.py ----
p="sysquant/optimisation/SR_adjustment.py";
fileNode(p,"Adjusts portfolio weights for differences in Sharpe ratio between assets using a mini-bootstrap interpolation, implementing Carver's handcrafting SR-adjustment step.",["optimisation","quant","weighting"],"complex");
imports(p);
sub("function",p,"adjust_dataframe_of_weights_for_SR_costs",[12,31],"Adjusts a DataFrame of weights downward for per-asset SR cost penalties.",["optimisation","quant"],"simple");
sub("function",p,"adjust_dataframe_of_weights_for_SR",[34,55],"Applies SR adjustment row-by-row across a DataFrame of weights over time.",["optimisation","quant"],"simple");
sub("function",p,"adjust_list_of_weight_lists_for_SR",[58,74],"Applies SR adjustment to each weight list in a list of lists.",["optimisation","quant"],"simple");
sub("function",p,"adjust_weights_for_SR",[77,93],"Adjusts a single set of weights for relative Sharpe ratios and renormalises.",["optimisation","quant"],"simple");
sub("function",p,"mini_bootstrap_ratio_given_SR_diff",[108,155],"Estimates the weight multiplier for a given SR difference via a small bootstrap simulation.",["optimisation","quant","simulation"],"moderate");
sub("function",p,"weights_given_SR_diff",[172,211],"Computes optimal weights between two assets for a given SR difference and confidence interval.",["optimisation","quant"],"moderate");
["adjust_dataframe_of_weights_for_SR_costs","adjust_dataframe_of_weights_for_SR","adjust_weights_for_SR","mini_bootstrap_ratio_given_SR_diff","weights_given_SR_diff"].forEach(s=>exp("function",p,s));

// ---- cleaning.py ----
p="sysquant/optimisation/cleaning.py";
fileNode(p,"Cleans portfolio weights by backfilling missing assets with neutral (must-have) weights, used to stabilise optimisation when assets lack history.",["optimisation","validation","quant"],"moderate");
imports(p);
sub("function",p,"clean_weights",[20,39],"Replaces missing weights with must-have neutral defaults, returning a portfolioWeights object.",["optimisation","validation"],"simple");
sub("function",p,"clean_list_of_weights",[52,139],"Core cleaning routine that fills NaN weights from must-have flags scaled by a fraction.",["optimisation","validation"],"moderate");
sub("function",p,"get_must_have_dict_from_data",[7,17],"Derives a per-asset must-have flag dict from which columns of the data have at least one value.",["optimisation","utility"],"simple");
["get_must_have_dict_from_data","clean_weights","clean_list_of_weights","get_lists_from_dicts_of_weights_and_must_haves"].forEach(s=>exp("function",p,s));
calls(p,"syscore/pandas/pdutils.py","get_index_of_columns_in_df_with_at_least_one_value");

// ---- call_optimiser.py ----
p="sysquant/optimisation/optimisers/call_optimiser.py";
fileNode(p,"Dispatches to the appropriate optimisation method (equal weights, one period, shrinkage, handcraft) from a registry and handles the no-valid-data case.",["optimisation","factory","quant"],"moderate");
imports(p);
sub("function",p,"optimiser_for_method",[21,46],"Splits estimates into valid/invalid assets, runs the chosen optimiser on valid data and recombines with zero weights for missing assets.",["optimisation","factory"],"moderate");
sub("function",p,"call_optimiser",[60,72],"Looks up the optimisation function in the registry by method name and invokes it.",["optimisation","factory"],"simple");
["optimiser_for_method","weights_and_estimates_with_no_valid_data","call_optimiser"].forEach(s=>exp("function",p,s));
["equal_weights.py","handcraft.py","one_period.py","shrinkage.py"].forEach(m=>{});

// ---- equal_weights.py ----
p="sysquant/optimisation/optimisers/equal_weights.py";
fileNode(p,"Trivial optimiser returning one-over-N equal portfolio weights for the supplied estimates.",["optimisation","quant"],"simple");
imports(p);
exp("function",p,"equal_weights_optimisation");

// ---- handcraft.py ----
p="sysquant/optimisation/optimisers/handcraft.py";
fileNode(p,"Implements Carver's handcrafting optimiser: recursively clusters correlated assets into sub-portfolios, assigns one-over-N risk weights and adjusts for Sharpe ratio and diversification.",["optimisation","quant","weighting","clustering"],"complex");
imports(p);
sub("function",p,"handcraft_optimisation",[21,35],"Entry point that builds handcrafted risk weights for valid data and wraps them with estimates.",["optimisation","quant"],"simple");
sub("class",p,"handcraftPortfolio",[54,140],"Represents a (possibly nested) handcrafted portfolio computing risk weights, diversification multiplier and SR adjustments recursively over clustered sub-portfolios.",["optimisation","quant","data-model"],"complex");
sub("function",p,"get_handcrafted_portfolio_weights_for_valid_data",[38,48],"Builds a handcraftPortfolio and returns its risk weights, optionally equalising vols/SR.",["optimisation","quant"],"simple");
sub("function",p,"aggregate_risk_weights_over_sub_portfolios",[194,229],"Combines sub-portfolio risk weights weighted by each sub-portfolio's allocation and diversification.",["optimisation","quant"],"moderate");
sub("function",p,"adjust_weights_for_SR_on_handcrafted_portfolio",[146,167],"Applies the SR adjustment to a handcrafted portfolio's raw risk weights.",["optimisation","quant"],"simple");
exp("function",p,"handcraft_optimisation");
exp("class",p,"handcraftPortfolio");
["get_handcrafted_portfolio_weights_for_valid_data","adjust_weights_for_SR_on_handcrafted_portfolio","aggregate_risk_weights_over_sub_portfolios"].forEach(s=>exp("function",p,s));
calls(p,"sysquant/optimisation/SR_adjustment.py","adjust_weights_for_SR");
calls(p,"sysquant/estimators/clustering_correlations.py","cluster_correlation_matrix");
calls(p,"sysquant/estimators/diversification_multipliers.py","diversification_mult_single_period");

// ---- one_period.py ----
p="sysquant/optimisation/optimisers/one_period.py";
fileNode(p,"Thin optimiser that runs a single-period mean-variance optimisation on the supplied estimates.",["optimisation","quant"],"simple");
imports(p);
exp("function",p,"one_period_optimisation");
calls(p,"sysquant/optimisation/shared.py","optimise_given_estimates");

// ---- shrinkage.py ----
p="sysquant/optimisation/optimisers/shrinkage.py";
fileNode(p,"Optimiser that shrinks correlations and mean estimates toward neutral targets before running a single-period optimisation.",["optimisation","quant"],"simple");
imports(p);
exp("function",p,"shrinkage_optimisation");
calls(p,"sysquant/optimisation/shared.py","optimise_given_estimates");

// ---- portfolio_optimiser.py ----
p="sysquant/optimisation/portfolio_optimiser.py";
fileNode(p,"Orchestrates portfolio weight estimation for a single fit period: builds correlation/mean/stdev estimators from config, assembles Estimates, runs the chosen optimiser and cleans the resulting weights.",["optimisation","quant","service","factory"],"complex");
imports(p);
sub("class",p,"portfolioOptimiser",[26,190],"Configurable optimiser that resolves estimator functions, computes per-period estimates and produces cleaned portfolio weights via the selected method.",["optimisation","quant","service","factory"],"complex");
exp("class",p,"portfolioOptimiser");
calls(p,"sysquant/optimisation/cleaning.py","clean_weights");
calls(p,"sysquant/optimisation/cleaning.py","get_must_have_dict_from_data");
calls(p,"sysquant/optimisation/optimisers/call_optimiser.py","optimiser_for_method");
calls(p,"sysquant/estimators/estimates.py","Estimates","class");
calls(p,"syslogging/logger.py","get_logger");
calls(p,"syscore/objects.py","resolve_function");

// ---- shared.py ----
p="sysquant/optimisation/shared.py";
fileNode(p,"Shared mean-variance optimisation primitives: builds covariance from correlation and stdev, runs the scipy SLSQP optimiser to maximise Sharpe ratio, and provides NaN-handling fixers.",["optimisation","quant","utility"],"complex");
imports(p);
sub("function",p,"optimise_given_estimates",[15,33],"Top-level optimiser that equalises estimates as requested then optimises and wraps the resulting weights.",["optimisation","quant"],"simple");
sub("function",p,"optimise_from_processed_estimates",[36,50],"Builds sigma from correlation and stdev then runs the mean-variance optimisation.",["optimisation","quant"],"simple");
sub("function",p,"optimise_from_sigma_and_mean_list",[58,79],"Runs the constrained SLSQP optimisation maximising negative-Sharpe over the covariance and means.",["optimisation","quant"],"moderate");
sub("function",p,"fix_vector",[102,117],"Replaces NaN entries in a vector with a sentinel value for optimisation, recording their positions.",["optimisation","utility"],"simple");
sub("function",p,"fix_matrix",[156,172],"Replaces NaN rows/columns in a matrix with sentinel values so optimisation can proceed.",["optimisation","utility"],"simple");
sub("function",p,"neg_SR",[175,181],"Objective function returning negative Sharpe ratio for a candidate weight vector.",["optimisation","quant"],"simple");
["optimise_given_estimates","optimise_from_processed_estimates","sigma_from_corr_and_std","optimise_from_sigma_and_mean_list","un_fix_weights","fix_sigma","neg_SR","variance","addem","fix_vector","fix_matrix","fix_mus","fix_stdev","fix_correlation"].forEach(s=>exp("function",p,s));

// ---- weights.py ----
p="sysquant/optimisation/weights.py";
fileNode(p,"Core data model for portfolio weights: a dict-like portfolioWeights class with arithmetic, subsetting, integer rounding and portfolio-stdev calculation, plus a time series of weights and one-over-N helpers.",["data-model","optimisation","quant"],"complex");
imports(p);
sub("class",p,"portfolioWeights",[15,168],"Dict-like per-asset weight container supporting arithmetic operators, reordering, integer rounding, sub-portfolio aggregation and portfolio standard-deviation computation.",["data-model","optimisation","quant"],"complex");
sub("class",p,"seriesOfPortfolioWeights",[171,180],"Time-indexed DataFrame of portfolio weights with date lookup and leverage helpers.",["data-model","optimisation"],"simple");
sub("function",p,"one_over_n_weights_given_asset_names",[210,214],"Returns equal one-over-N portfolioWeights for a list of asset names.",["optimisation","utility"],"simple");
["portfolioWeights","seriesOfPortfolioWeights","estimatesWithPortfolioWeights"].forEach(s=>exp("class",p,s));
["one_over_n_portfolio_weights_from_estimates","one_over_n_weights_given_data","one_over_n_weights_given_asset_names"].forEach(s=>exp("function",p,s));

// ---- portfolio_risk.py ----
p="sysquant/portfolio_risk.py";
fileNode(p,"Computes portfolio-level risk over time from per-asset weights, correlations and standard deviations, including covariance matrix assembly for each date.",["quant","risk","optimisation"],"moderate");
imports(p);
sub("function",p,"calc_portfolio_risk_series",[30,59],"Iterates dates to compute a time series of annualised portfolio standard deviation from weights and a covariance matrix.",["quant","risk"],"moderate");
sub("function",p,"get_covariance_matrix",[62,82],"Builds a covariance matrix for a date from the correlation list and stdev estimates.",["quant","risk"],"simple");
sub("function",p,"calc_sum_annualised_risk_given_portfolio_weights",[18,27],"Computes the simple sum of absolute weighted annualised risk across instruments.",["quant","risk"],"simple");
["calc_sum_annualised_risk_given_portfolio_weights","calc_portfolio_risk_series","get_covariance_matrix","get_correlation_matrix","get_stdev_estimate"].forEach(s=>exp("function",p,s));
calls(p,"sysquant/estimators/covariance.py","covariance_from_stdev_and_correlation");
calls(p,"sysquant/estimators/correlations.py","create_boring_corr_matrix");

// ---- systems/diagoutput.py ----
p="systems/diagoutput.py";
fileNode(p,"Diagnostic reporting stage that inspects a backtest system to check forecast scaling, export estimated config parameters as YAML, and explain calculation details per instrument.",["service","reporting","diagnostics"],"complex");
imports(p);
sub("class",p,"systemDiag",[10,390],"Wraps a system to extract estimated forecast scalars, weights, diversification multipliers and full calculation breakdowns for diagnostics and YAML config export.",["service","reporting","diagnostics"],"complex");
exp("class",p,"systemDiag");
exp("function",p,"forecast_error");
calls(p,"systems/forecast_mapping.py","estimate_mapping_params");

// ---- systems/forecast_mapping.py ----
p="systems/forecast_mapping.py";
fileNode(p,"Implements forecast mapping that non-linearly rescales raw forecasts to reduce small positions, per Carver's position-inertia/forecast-mapping technique.",["quant","forecast","utility"],"moderate");
imports(p);
sub("function",p,"estimate_mapping_params",[6,35],"Derives forecast-mapping parameters (threshold, cap, slope) from a single scaling parameter.",["quant","forecast"],"simple");
sub("function",p,"map_forecast_value_scalar",[38,69],"Maps a single forecast value through the piecewise-linear mapping function.",["quant","forecast"],"moderate");
sub("function",p,"map_forecast_value",[72,94],"Applies the forecast mapping element-wise across a forecast series.",["quant","forecast"],"simple");
["estimate_mapping_params","map_forecast_value_scalar","map_forecast_value"].forEach(s=>exp("function",p,s));

// ---- dynamic buffering.py ----
p="systems/provided/dynamic_small_system_optimise/buffering.py";
fileNode(p,"Tracking-error buffering for the dynamic optimised system: computes how far to move from prior toward optimal positions to balance trading cost against tracking error.",["optimisation","quant","buffering"],"moderate");
imports(p);
sub("function",p,"adjust_weights_with_factor",[33,51],"Blends prior and optimised weights by an adjustment factor and rounds the resulting trades to contract space.",["optimisation","quant"],"simple");
sub("function",p,"calculate_adjustment_factor",[15,30],"Computes the buffer adjustment factor from the speed control and the prior tracking error.",["optimisation","quant"],"simple");
sub("function",p,"calculate_adjusting_trades_rounding_in_contract_space",[54,65],"Rounds weight-space adjusting trades into whole-contract space.",["optimisation","quant"],"simple");
exp("class",p,"speedControlForDynamicOpt");
["calculate_adjustment_factor","adjust_weights_with_factor","calculate_adjusting_trades_rounding_in_contract_space"].forEach(s=>exp("function",p,s));

// ---- dynamic data_for_optimisation.py ----
p="systems/provided/dynamic_small_system_optimise/data_for_optimisation.py";
fileNode(p,"Holds and lazily converts all per-instrument inputs (optimal/prior weights, covariance, costs, constraints) into numpy arrays for the dynamic greedy optimiser.",["optimisation","quant","data-model"],"complex");
imports(p);
sub("class",p,"dataForOptimisation",[12,252],"Caching container that transforms portfolioWeights/covariance/cost inputs into aligned numpy arrays and constraint vectors keyed on valid-data instruments.",["optimisation","quant","data-model"],"complex");
exp("class",p,"dataForOptimisation");
calls(p,"systems/provided/dynamic_small_system_optimise/set_up_constraints.py","calculate_min_max_and_direction_and_start");

// ---- dynamic greedy_algo.py ----
p="systems/provided/dynamic_small_system_optimise/greedy_algo.py";
fileNode(p,"Greedy integer optimisation algorithm that incrementally adds contracts in the direction that most improves the objective until no improvement is found.",["optimisation","quant","algorithm"],"moderate");
imports(p);
sub("function",p,"greedy_algo_across_integer_values",[6,35],"Greedily steps integer position values to minimise the objective, returning the best solution found.",["optimisation","quant","algorithm"],"moderate");
sub("function",p,"_find_possible_new_best_live",[38,69],"Evaluates each candidate single-step move from the current solution to find an improvement.",["optimisation","quant","algorithm"],"moderate");
sub("function",p,"_update_at_limit",[72,90],"Marks instruments that have hit their min/max constraint so they are skipped in further steps.",["optimisation","quant"],"simple");
["greedy_algo_across_integer_values","_find_possible_new_best_live","_update_at_limit"].forEach(s=>exp("function",p,s));

// ---- dynamic optimisation.py ----
p="systems/provided/dynamic_small_system_optimise/optimisation.py";
fileNode(p,"Defines the greedy objective function for the dynamic small-system optimiser: minimises tracking error against optimal positions plus trading costs subject to constraints, with buffering on small tracking errors.",["optimisation","quant","objective-function"],"complex");
imports(p);
sub("class",p,"objectiveFunctionForGreedy",[33,339],"Objective function object computing tracking error, costs and constraint penalties for candidate integer positions, driving the greedy optimiser and applying buffering.",["optimisation","quant","objective-function"],"complex");
exp("class",p,"objectiveFunctionForGreedy");
exp("class",p,"constraintsForDynamicOpt");
calls(p,"systems/provided/dynamic_small_system_optimise/greedy_algo.py","greedy_algo_across_integer_values");
calls(p,"systems/provided/dynamic_small_system_optimise/buffering.py","calculate_adjustment_factor");
calls(p,"systems/provided/dynamic_small_system_optimise/buffering.py","adjust_weights_with_factor");
calls(p,"systems/provided/dynamic_small_system_optimise/data_for_optimisation.py","dataForOptimisation","class");
calls(p,"syslogging/logger.py","get_logger");

// ---- dynamic optimised_positions_stage.py ----
p="systems/provided/dynamic_small_system_optimise/optimised_positions_stage.py";
fileNode(p,"Backtest system stage that produces dynamically-optimised integer positions: gathers covariance, costs, constraints and per-contract values, runs the greedy optimiser per date and assembles the optimised position DataFrame.",["service","optimisation","quant","stage"],"complex");
imports(p);
sub("class",p,"optimisedPositions",[35,382],"System stage computing dynamically optimised positions by building per-date objective instances, running the greedy optimiser and deriving costs, deflators and covariance inputs.",["service","optimisation","quant","stage"],"complex");
exp("class",p,"optimisedPositions");
exp("function",p,"calculate_cost_per_notional_weight_as_proportion_of_capital");
calls(p,"systems/provided/dynamic_small_system_optimise/optimisation.py","objectiveFunctionForGreedy","class");
calls(p,"systems/provided/dynamic_small_system_optimise/buffering.py","speedControlForDynamicOpt","class");
calls(p,"sysquant/estimators/covariance.py","covariance_from_stdev_and_correlation");
calls(p,"sysquant/optimisation/weights.py","seriesOfPortfolioWeights","class");

// ---- dynamic set_up_constraints.py ----
p="systems/provided/dynamic_small_system_optimise/set_up_constraints.py";
fileNode(p,"Builds per-instrument minima, maxima, trade direction and starting weights for the dynamic optimiser from reduce-only/no-trade/long-only constraints and prior positions.",["optimisation","quant","constraints","data-model"],"complex");
imports(p);
sub("class",p,"minMaxAndDirectionAndStart",[13,36],"Container exposing per-code minima, maxima, direction and starting weights as portfolioWeights across instruments.",["optimisation","data-model"],"simple");
sub("function",p,"calculate_min_max_and_direction_and_start",[47,61],"Computes the full set of constraint vectors across all instrument codes from the input data.",["optimisation","quant"],"simple");
sub("function",p,"calculate_minima_and_maxima",[127,166],"Derives the min and max allowable weight for one instrument from its constraints and prior weight.",["optimisation","quant","constraints"],"moderate");
sub("function",p,"calculations_for_code",[98,124],"Computes minima, maxima, direction and starting weight for a single instrument code.",["optimisation","quant"],"simple");
["minMaxAndDirectionAndStart","minMaxAndDirectionAndStartForCode"].forEach(s=>exp("class",p,s));
["calculate_min_max_and_direction_and_start","get_data_and_calculate_for_code","calculations_for_code","calculate_minima_and_maxima","calculate_direction","calculate_starting_weight"].forEach(s=>exp("function",p,s));

// ---- static optimise_small_system.py ----
p="systems/provided/static_small_system_optimise/optimise_small_system.py";
fileNode(p,"Static small-system optimiser that greedily selects an ordered set of instruments by net post-cost Sharpe ratio, using handcrafting to size a capital-constrained portfolio.",["optimisation","quant","instrument-selection"],"complex");
imports(p);
sub("function",p,"find_best_ordered_set_of_instruments",[20,69],"Greedily builds an ordered list of instruments, adding the one that most improves portfolio net Sharpe at each step.",["optimisation","quant","instrument-selection"],"moderate");
sub("function",p,"find_next_instrument",[106,129],"Finds the next-best instrument to add to the current set by post-cost SR.",["optimisation","quant"],"simple");
sub("function",p,"SR_for_instrument_list",[132,153],"Estimates the net Sharpe ratio of a candidate instrument list via handcrafting and size penalties.",["optimisation","quant"],"moderate");
sub("function",p,"build_estimates",[156,174],"Assembles mean/stdev/correlation Estimates for a subset of instruments for handcrafting.",["optimisation","quant"],"simple");
sub("function",p,"estimate_SR_given_weights",[177,198],"Estimates portfolio SR for given risk weights using the cost-aware mean function.",["optimisation","quant"],"moderate");
sub("function",p,"net_SR_for_instrument_in_system",[256,275],"Computes the net post-cost, size-penalised Sharpe ratio for a single instrument in the system.",["optimisation","quant"],"simple");
["find_best_ordered_set_of_instruments","get_correlation_matrix","find_best_market","find_next_instrument","SR_for_instrument_list","build_estimates","estimate_SR_given_weights","mean_estimates_from_SR_function_actual_weights","estimate_portfolio_sizes_given_weights","net_SR_for_instrument_in_system","calculate_maximum_position","calculate_trading_cost","net_SR_for_instrument","size_penalty"].forEach(s=>exp("function",p,s));
calls(p,"sysquant/optimisation/optimisers/handcraft.py","handcraftPortfolio","class");
calls(p,"sysquant/optimisation/shared.py","neg_SR");
calls(p,"sysquant/estimators/estimates.py","Estimates","class");

fs.writeFileSync(".understand-anything/tmp/ua-15-full.json", JSON.stringify({nodes,edges},null,2));
const impCount = edges.filter(e=>e.type==="imports").length;
console.log("nodes:",nodes.length,"edges:",edges.length,"imports:",impCount);
