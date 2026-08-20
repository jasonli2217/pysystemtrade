import fs from "fs";

const importEdges = JSON.parse(fs.readFileSync(".understand-anything/tmp/import-edges-7.json", "utf8"));

const nodes = [];
const edges = [...importEdges];

// ---- FILE NODES ----
const fileNodes = [
  {p:"sysdata/parquet/parquet_adjusted_prices.py", s:"Parquet storage backend for futures adjusted (back-adjusted) price series, implementing the abstract adjusted-prices data interface against the parquet access layer.", t:["data-model","service","serialization","persistence"], c:"moderate"},
  {p:"sysdata/parquet/parquet_capital.py", s:"Parquet storage backend for per-strategy capital time series, implementing the abstract capital data interface.", t:["data-model","service","persistence","capital"], c:"moderate"},
  {p:"sysdata/parquet/parquet_futures_per_contract_prices.py", s:"Parquet storage backend for per-contract futures prices at multiple frequencies, with key encoding helpers that combine contract identity and frequency.", t:["data-model","service","persistence","futures-prices"], c:"complex"},
  {p:"sysdata/parquet/parquet_historic_contract_positions.py", s:"Parquet storage backend for historic per-contract position series, with contract<->key encoding helpers.", t:["data-model","service","persistence","positions"], c:"moderate"},
  {p:"sysdata/parquet/parquet_historic_strategy_positions.py", s:"Parquet storage backend for historic instrument-strategy position series.", t:["data-model","service","persistence","positions"], c:"moderate"},
  {p:"sysdata/parquet/parquet_optimal_positions.py", s:"Parquet storage backend for optimal position dataframes keyed by instrument strategy.", t:["data-model","service","persistence","positions"], c:"moderate"},
  {p:"sysdata/parquet/parquet_spotfx_prices.py", s:"Parquet storage backend for spot FX price series, implementing the abstract FX prices interface.", t:["data-model","service","persistence","fx"], c:"moderate"},
  {p:"sysdata/parquet/parquet_spreads.py", s:"Parquet storage backend for per-instrument spread cost series.", t:["data-model","service","persistence","spreads"], c:"moderate"},
  {p:"sysdata/production/broker_client_id.py", s:"Abstract data store that allocates, locks, and releases broker client IDs to avoid collisions when connecting to the broker, with free-list helper functions.", t:["data-model","service","broker","concurrency"], c:"complex"},
  {p:"sysdata/production/capital.py", s:"Core production capital data abstraction: capitalData stores raw global/strategy capital series while totalCapitalCalculationData derives total, broker-account and high-water-mark capital and updates it after P&L events.", t:["data-model","service","capital","business-logic"], c:"complex"},
  {p:"sysdata/production/historic_contract_positions.py", s:"Abstract production data store for historic per-contract positions, with query/update/delete methods and helpers to infer whether positions existed in a date range.", t:["data-model","service","positions","business-logic"], c:"complex"},
  {p:"sysdata/production/historic_strategy_positions.py", s:"Abstract production data store for historic instrument-strategy positions, with query/update/delete methods over position series.", t:["data-model","service","positions","business-logic"], c:"complex"},
  {p:"sysdata/production/locks.py", s:"Abstract in-memory data store tracking which instruments are locked from trading.", t:["data-model","service","concurrency","trading-control"], c:"simple"},
  {p:"sysdata/production/optimal_positions.py", s:"Abstract production data store for optimal positions produced by the system, exposing list/query/update operations across instrument strategies.", t:["data-model","service","positions","business-logic"], c:"complex"},
  {p:"sysdata/production/override.py", s:"Abstract production data store for trading overrides at strategy, instrument, and instrument-strategy level, combining them into a cumulative override.", t:["data-model","service","trading-control","business-logic"], c:"moderate"},
  {p:"sysdata/production/position_limits.py", s:"Abstract production data store for absolute position limits per instrument and per instrument-strategy.", t:["data-model","service","positions","trading-control"], c:"moderate"},
  {p:"sysdata/production/process_control_data.py", s:"Abstract production data store controlling background process lifecycle: start/finish/pause status, PID tracking, and per-method run timing.", t:["data-model","service","process-control","business-logic"], c:"complex"},
  {p:"sysdata/production/roll_state.py", s:"Abstract production data store for per-instrument futures roll state, mapping roll-state names to enum values.", t:["data-model","service","futures-roll","trading-control"], c:"simple"},
  {p:"sysdata/production/temporary_close.py", s:"Abstract production data store that temporarily stashes an instrument's position limit while it is closed, restoring it later.", t:["data-model","service","positions","trading-control"], c:"simple"},
  {p:"sysdata/production/temporary_override.py", s:"Abstract production data store that temporarily stashes an instrument's override while a temporary override is active.", t:["data-model","service","trading-control","positions"], c:"simple"},
  {p:"sysdata/production/trade_limits.py", s:"Abstract production data store for rolling trade limits per instrument and instrument-strategy, computing what trades remain possible within configured periods.", t:["data-model","service","trading-control","business-logic"], c:"complex"},
  {p:"sysinit/futures/repocsv_spread_costs.py", s:"Initialisation script that copies spread cost data from CSV into Mongo, interactively confirming new, modified, and deleted instruments.", t:["script","data-pipeline","migration","interactive"], c:"moderate"},
  {p:"sysinit/transfer/backup_arctic_to_parquet.py", s:"Migration/backup script that copies every production data type from the Arctic/Mongo stores into Parquet (and CSV dumps), verifying each write round-trips.", t:["script","data-pipeline","migration","backup"], c:"complex"},
  {p:"sysinit/transfer/positions_from_timed_storage_to_arctic.py", s:"One-off transfer script moving legacy timed-storage strategy, contract, and optimal positions from deprecated Mongo stores into Arctic.", t:["script","data-pipeline","migration","positions"], c:"moderate"},
  {p:"syslogdiag/_DEPRECATED/database_log.py", s:"Deprecated stub log data class retained only for backward compatibility; defines an empty database-backed log interface.", t:["deprecated","logging","data-model"], c:"simple"},
  {p:"syslogdiag/email_control.py", s:"Abstract data store recording when emails (and warning emails) were last sent for a given subject, used to throttle notifications.", t:["data-model","service","email","logging"], c:"simple"},
  {p:"syslogdiag/emailing.py", s:"Low-level emailing utilities sending plain, dataframe, file, and PDF-attachment emails over SMTP using production config credentials.", t:["utility","email","notification","io"], c:"moderate"},
  {p:"syslogdiag/log_entry.py", s:"Defines the logEntry value object capturing a single log record's timestamp, level, text, and attributes, with dict serialization.", t:["data-model","logging","serialization","value-object"], c:"moderate"},
  {p:"syslogdiag/log_to_file.py", s:"File-based logger implementation that writes log entries to a rolling file, emails the user on serious messages, and resolves the logging directory from config.", t:["service","logging","io","file-handler"], c:"moderate"},
];

for (const f of fileNodes) {
  const name = f.p.split("/").pop();
  nodes.push({id:"file:"+f.p, type:"file", name, filePath:f.p, summary:f.s, tags:f.t, complexity:f.c,
    languageNotes:"Follows pysystemtrade convention of abstract <thing>Data base classes with concrete storage backends overriding `_`-prefixed private hooks."});
}

// ---- FUNCTION & CLASS NODES (significance filter) ----
// helper
function fn(path, name, range, summary, tags, complexity="simple") {
  nodes.push({id:`function:${path}:${name}`, type:"function", name, filePath:path, lineRange:range, summary, tags, complexity});
  edges.push({source:`file:${path}`, target:`function:${path}:${name}`, type:"contains", direction:"forward", weight:1.0});
  edges.push({source:`file:${path}`, target:`function:${path}:${name}`, type:"exports", direction:"forward", weight:0.8});
}
function cls(path, name, range, summary, tags, complexity="moderate") {
  nodes.push({id:`class:${path}:${name}`, type:"class", name, filePath:path, lineRange:range, summary, tags, complexity});
  edges.push({source:`file:${path}`, target:`class:${path}:${name}`, type:"contains", direction:"forward", weight:1.0});
  edges.push({source:`file:${path}`, target:`class:${path}:${name}`, type:"exports", direction:"forward", weight:0.8});
}

// parquet classes
cls("sysdata/parquet/parquet_adjusted_prices.py","parquetFuturesAdjustedPricesData",[13,74],"Parquet-backed adjusted prices store; reads/writes/deletes back-adjusted price series via the parquet access layer.",["data-model","persistence","futures-prices"]);
cls("sysdata/parquet/parquet_capital.py","parquetCapitalData",[11,69],"Parquet-backed capital store reading and updating per-strategy capital dataframes.",["data-model","persistence","capital"]);
cls("sysdata/parquet/parquet_futures_per_contract_prices.py","parquetFuturesContractPriceData",[19,202],"Parquet-backed per-contract futures price store supporting merged and per-frequency reads/writes keyed by contract+frequency.",["data-model","persistence","futures-prices"],"complex");
fn("sysdata/parquet/parquet_futures_per_contract_prices.py","from_key_to_freq_and_contract",[205,217],"Parses a parquet identifier key back into a frequency and futuresContract object.",["serialization","parsing","utility"]);
fn("sysdata/parquet/parquet_futures_per_contract_prices.py","from_contract_and_freq_to_key",[220,230],"Builds a parquet identifier key from a contract object and frequency.",["serialization","utility"]);
cls("sysdata/parquet/parquet_historic_contract_positions.py","parquetContractPositionData",[15,74],"Parquet-backed historic contract position store with contract<->key encoding.",["data-model","persistence","positions"]);
cls("sysdata/parquet/parquet_historic_strategy_positions.py","parquetStrategyPositionData",[16,75],"Parquet-backed historic instrument-strategy position store.",["data-model","persistence","positions"]);
cls("sysdata/parquet/parquet_optimal_positions.py","parquetOptimalPositionData",[16,70],"Parquet-backed optimal position store keyed by instrument strategy.",["data-model","persistence","positions"]);
cls("sysdata/parquet/parquet_spotfx_prices.py","parquetFxPricesData",[11,68],"Parquet-backed spot FX price store.",["data-model","persistence","fx"]);
cls("sysdata/parquet/parquet_spreads.py","parquetSpreadsForInstrumentData",[12,69],"Parquet-backed per-instrument spread cost store.",["data-model","persistence","spreads"]);

// broker_client_id
cls("sysdata/production/broker_client_id.py","brokerClientIdData",[6,103],"Abstract store that hands out and locks unique broker client IDs and releases them on disconnect.",["data-model","broker","concurrency"],"complex");
fn("sysdata/production/broker_client_id.py","get_next_id_from_current_list",[106,117],"Returns the next unused client ID given the current locked list, falling back to the full available set when wrapping.",["utility","concurrency","business-logic"]);
fn("sysdata/production/broker_client_id.py","get_next_id_from_current_list_and_full_set",[120,129],"Picks the lowest available client ID from the full set not currently in use.",["utility","concurrency","business-logic"]);

// capital
cls("sysdata/production/capital.py","capitalData",[29,216],"Abstract raw-capital store exposing total/broker/max/P&L series accessors and global/per-strategy capital CRUD.",["data-model","capital","business-logic"],"complex");
cls("sysdata/production/capital.py","totalCapitalCalculationData",[228,516],"Wraps a capitalData store to compute total, broker-account, and high-water-mark capital, applying configurable accumulation methods after P&L events.",["service","capital","business-logic"],"complex");

// historic positions
cls("sysdata/production/historic_contract_positions.py","contractPositionData",[13,262],"Abstract historic contract-position store with query/update/delete and date-range position-existence logic.",["data-model","positions","business-logic"],"complex");
fn("sysdata/production/historic_contract_positions.py","any_positions_since_start_date",[265,297],"Returns whether a contract held any position within a date window, inferring the starting position when needed.",["utility","positions","business-logic"]);
cls("sysdata/production/historic_strategy_positions.py","strategyPositionData",[19,252],"Abstract historic instrument-strategy position store with query/update/delete and listing helpers.",["data-model","positions","business-logic"],"complex");

cls("sysdata/production/locks.py","lockData",[8,36],"Abstract in-memory store of instruments locked from trading.",["data-model","concurrency","trading-control"]);
cls("sysdata/production/optimal_positions.py","optimalPositionData",[28,187],"Abstract optimal-position store exposing list/query/update operations across instrument strategies.",["data-model","positions","business-logic"],"complex");
cls("sysdata/production/override.py","overrideData",[16,112],"Abstract override store combining strategy, instrument, and instrument-strategy overrides into a cumulative value.",["data-model","trading-control","business-logic"],"complex");
cls("sysdata/production/position_limits.py","positionLimitData",[23,98],"Abstract store for absolute position limits per instrument and instrument-strategy.",["data-model","positions","trading-control"]);
cls("sysdata/production/process_control_data.py","controlProcessData",[15,210],"Abstract store managing background process control: status changes, PID checks, and per-method run timing.",["data-model","process-control","business-logic"],"complex");
cls("sysdata/production/roll_state.py","rollStateData",[11,50],"Abstract store of per-instrument futures roll state.",["data-model","futures-roll","trading-control"]);
cls("sysdata/production/temporary_close.py","temporaryCloseData",[7,50],"Abstract store that temporarily stashes a position limit while an instrument is closed.",["data-model","positions","trading-control"]);
cls("sysdata/production/temporary_override.py","temporaryOverrideData",[7,49],"Abstract store that temporarily stashes an override while a temporary override is active.",["data-model","trading-control","positions"]);
cls("sysdata/production/trade_limits.py","tradeLimitData",[42,216],"Abstract rolling trade-limit store computing remaining tradeable size within configured periods per instrument and instrument-strategy.",["data-model","trading-control","business-logic"],"complex");

// repocsv_spread_costs
fn("sysinit/futures/repocsv_spread_costs.py","copy_spread_costs_from_csv_to_mongo",[13,40],"Top-level routine that diffs CSV vs Mongo spread costs and dispatches new/modified/deleted processing.",["script","data-pipeline","migration"],"moderate");
fn("sysinit/futures/repocsv_spread_costs.py","process_new_instruments",[43,64],"Interactively adds spread costs for instruments present in CSV but missing in Mongo.",["script","data-pipeline","interactive"]);
fn("sysinit/futures/repocsv_spread_costs.py","process_modified_instruments",[67,102],"Interactively updates Mongo spread costs where they differ from CSV.",["script","data-pipeline","interactive"],"moderate");
fn("sysinit/futures/repocsv_spread_costs.py","process_deleted_instruments",[105,120],"Interactively removes Mongo spread costs for instruments no longer in CSV.",["script","data-pipeline","interactive"]);

// backup_arctic_to_parquet (top-level orchestrators only)
fn("sysinit/transfer/backup_arctic_to_parquet.py","backup_arctic_to_parquet",[55,92],"Entry-point orchestrating backup of every production data type from Arctic/Mongo to Parquet and CSV.",["script","data-pipeline","backup","entry-point"],"moderate");
fn("sysinit/transfer/backup_arctic_to_parquet.py","get_data_blob",[95,138],"Builds the dataBlob wiring together all Arctic, Mongo, Parquet, and CSV data classes used during backup.",["script","factory","data-pipeline"],"moderate");
fn("sysinit/transfer/backup_arctic_to_parquet.py","backup_futures_contract_prices_for_contract_to_parquet",[197,246],"Copies and verifies per-frequency futures contract prices for one contract from Arctic into Parquet.",["script","data-pipeline","backup"],"moderate");
fn("sysinit/transfer/backup_arctic_to_parquet.py","backup_contract_position_data",[320,360],"Copies and verifies historic contract position series from Arctic into Parquet.",["script","data-pipeline","backup"],"moderate");
fn("sysinit/transfer/backup_arctic_to_parquet.py","backup_strategy_position_data",[363,401],"Copies and verifies historic strategy position series from Arctic into Parquet.",["script","data-pipeline","backup"],"moderate");
fn("sysinit/transfer/backup_arctic_to_parquet.py","backup_historical_orders",[404,427],"Backs up strategy, contract, and broker historic orders from Mongo into CSV.",["script","data-pipeline","backup"],"moderate");
fn("sysinit/transfer/backup_arctic_to_parquet.py","backup_capital",[430,460],"Copies and verifies per-strategy capital series from Arctic into Parquet.",["script","data-pipeline","backup"],"moderate");
fn("sysinit/transfer/backup_arctic_to_parquet.py","backup_optimal_positions",[463,496],"Copies and verifies optimal positions from Arctic into Parquet.",["script","data-pipeline","backup"],"moderate");

// positions_from_timed_storage_to_arctic
fn("sysinit/transfer/positions_from_timed_storage_to_arctic.py","transfer_strategy_positions",[27,49],"Transfers legacy strategy positions from deprecated Mongo timed storage into Arctic.",["script","data-pipeline","migration"],"moderate");
fn("sysinit/transfer/positions_from_timed_storage_to_arctic.py","transfer_contract_positions",[52,76],"Transfers legacy contract positions from deprecated Mongo timed storage into Arctic.",["script","data-pipeline","migration"],"moderate");
fn("sysinit/transfer/positions_from_timed_storage_to_arctic.py","transfer_optimal_positions",[79,100],"Transfers legacy optimal positions from deprecated Mongo timed storage into Arctic.",["script","data-pipeline","migration"],"moderate");

// emailing
cls("syslogdiag/emailing.py","MailType",[28,33],"Enum of email types (e.g. standard vs warning) used to tag outgoing mail.",["type-definition","email"],"simple");
fn("syslogdiag/emailing.py","send_mail_msg",[36,40],"Sends a plain-text email body with the given subject and mail type.",["utility","email","notification"]);
fn("syslogdiag/emailing.py","send_mail_dataframe",[43,53],"Renders a dataframe to HTML and emails it.",["utility","email","notification"]);
fn("syslogdiag/emailing.py","send_mail_pdfs",[56,73],"Emails a preamble plus a list of PDF file attachments.",["utility","email","notification"],"moderate");
fn("syslogdiag/emailing.py","send_mail_file",[13,25],"Reads a text file and emails its contents.",["utility","email","io"]);
fn("syslogdiag/emailing.py","_send_msg",[76,101],"Internal SMTP sender that connects (optionally over SSL/TLS), authenticates, and dispatches a prepared message.",["utility","email","io"],"moderate");
fn("syslogdiag/emailing.py","get_email_details",[104,119],"Loads SMTP server, account, and recipient details from production config.",["utility","email","configuration"]);

// log_entry
cls("syslogdiag/log_entry.py","logEntry",[19,122],"Value object for a single log record (timestamp, level, text, attributes) with dict serialization round-trip.",["data-model","logging","serialization"],"moderate");

// log_to_file
cls("syslogdiag/log_to_file.py","logToFile",[16,132],"File logger writing log entries to a rolling file and emailing the user on serious messages.",["service","logging","io"],"moderate");
fn("syslogdiag/log_to_file.py","get_logging_directory",[135,151],"Resolves and ensures the logging directory exists from production config.",["utility","configuration","io"]);

// _DEPRECATED database_log
cls("syslogdiag/_DEPRECATED/database_log.py","logData",[10,17],"Deprecated empty database log data stub kept for backward compatibility.",["deprecated","logging"],"simple");

// email_control
cls("syslogdiag/email_control.py","emailControlData",[5,19],"Abstract store recording when emails were last sent per subject to throttle notifications.",["data-model","email","logging"],"simple");

// ---- CROSS-FILE CALL / RELATIONSHIP EDGES (confident, within batch) ----
// parquet_capital concrete overrides the abstract capitalData
edges.push({source:"file:sysdata/parquet/parquet_capital.py", target:"class:sysdata/production/capital.py:capitalData", type:"calls", direction:"forward", weight:0.8});
// backup script depends on the parquet stores it writes to (calls into them)
const backup = "sysinit/transfer/backup_arctic_to_parquet.py";
const parquetStores = [
  "sysdata/parquet/parquet_adjusted_prices.py",
  "sysdata/parquet/parquet_capital.py",
  "sysdata/parquet/parquet_futures_per_contract_prices.py",
  "sysdata/parquet/parquet_historic_contract_positions.py",
  "sysdata/parquet/parquet_historic_strategy_positions.py",
  "sysdata/parquet/parquet_optimal_positions.py",
  "sysdata/parquet/parquet_spotfx_prices.py",
  "sysdata/parquet/parquet_spreads.py",
];
for (const ps of parquetStores) {
  edges.push({source:`file:${backup}`, target:`file:${ps}`, type:"depends_on", direction:"forward", weight:0.6});
}
// log_to_file uses logEntry
edges.push({source:"file:syslogdiag/log_to_file.py", target:"class:syslogdiag/log_entry.py:logEntry", type:"calls", direction:"forward", weight:0.8});

fs.writeFileSync(".understand-anything/intermediate/batch-7.json", JSON.stringify({nodes, edges}, null, 2));

// validation
const ids = new Set(nodes.map(n=>n.id));
const importCount = edges.filter(e=>e.type==="imports").length;
let badSelf = edges.filter(e=>e.source===e.target).length;
console.log("nodes:", nodes.length, "edges:", edges.length, "imports:", importCount, "selfedges:", badSelf);
// check duplicate node ids
const seen = {}; let dup=0;
for (const n of nodes){ if(seen[n.id]) dup++; seen[n.id]=1; }
console.log("dup node ids:", dup);
