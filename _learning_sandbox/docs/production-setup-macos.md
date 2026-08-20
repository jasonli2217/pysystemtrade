# Setting Up a Production System on macOS

> **Who this is for:** You've already built and backtested a pysystemtrade strategy. Now you want to run it as a live (paper) trading system on your Mac. We'll start with manual order entry — you tell IB what to buy/sell — and you can add automatic execution later.

---

## How the System Works (Big Picture)

Think of pysystemtrade as a factory with 5 departments that each run on a schedule:

```
IB Gateway
    ↓ (prices arrive each evening)
[1] Price Updater — downloads futures & FX prices from IB
    ↓
[2] Overnight Backtest — re-runs your strategy, computes target positions
    ↓
[3] Order Generator — compares target positions to actual positions, creates a list of trades
    ↓
[4] Stack Handler — actually submits orders to IB (SKIP THIS for manual trading)
    ↓
[5] Reports — generates P&L, costs, risk reports each evening
```

For your first phase, you'll do Step 4 yourself: read what Step 3 says, then manually place the trades in IB's interface.

---

## macOS vs Linux: Key Differences

The official docs assume Linux. Here's what changes on macOS:

| Linux | macOS equivalent |
|-------|-----------------|
| `~/.profile` | `~/.zprofile` (macOS uses Zsh by default) |
| `apt-get install mongodb` | `brew install mongodb-community` |
| `systemctl start mongod` | `brew services start mongodb-community` |
| Linux bash scripts in `sysproduction/linux/scripts/` | Not used — we call Python scripts directly |

Everything else (Python, MongoDB, cron, IB Gateway) works the same on macOS.

---

## What You Need Before Starting

- [ ] Interactive Brokers account with **paper trading enabled**
  - Paper trading is a separate login — your paper account number starts with `DU` (e.g., `DU1234567`)
  - Enable it at: [Client Portal → Settings → Paper Trading Account](https://www.ibkr.com)
- [ ] IB Gateway downloaded for Mac (free, from IBKR website)
- [ ] Homebrew installed on your Mac
- [ ] Your pysystemtrade repo already cloned and working (you have backtested strategies in `private/afts/`)

---

## Phase 1 — Install Prerequisites

### 1.1 Check Python Version

```bash
python3 --version
```

You need **Python 3.10 or higher**. If you're lower, install a newer version via Homebrew:

```bash
brew install python@3.11
```

### 1.2 Install Dependencies with uv

We use `uv` for all Python package management. From your repo root, run:

```bash
cd "/Users/jasonli/Dev/FORKed repo/pysystemtrade"
uv sync
uv run python -c "import pysystemtrade; print('OK')"
```

If you see `OK`, you're good. `uv sync` reads the project's `pyproject.toml` and installs everything into a local `.venv` folder.

### 1.3 Install MongoDB

MongoDB is the database pysystemtrade uses to remember everything: orders, positions, capital, log messages. Think of it as the system's long-term memory.

```bash
# Add the MongoDB tap to Homebrew
brew tap mongodb/brew

# Install MongoDB Community Edition
brew install mongodb-community
```

---

## Phase 2 — Set Environment Variables

Environment variables are like sticky notes you put on your Mac that every program can read. pysystemtrade uses them to find your data folders and code.

Open your shell config file:

```bash
open ~/.zprofile
```

Add these lines at the bottom (adjust the path if your repo is elsewhere):

```bash
# pysystemtrade
export PYSYS_CODE="/Users/jasonli/Dev/FORKed repo/pysystemtrade"
export MONGO_DATA="$HOME/data/mongodb"
export ECHO_PATH="$HOME/data/echos"
export MONGO_BACKUP_PATH="$HOME/data/mongo_dump"
```

**What each one means:**
- `PYSYS_CODE` — where your pysystemtrade code lives
- `MONGO_DATA` — where MongoDB stores its database files on disk
- `ECHO_PATH` — where pysystemtrade saves stdout logs (like a "what happened today" file per process)
- `MONGO_BACKUP_PATH` — where MongoDB backups go

After saving the file, apply the changes to your current terminal:

```bash
source ~/.zprofile
```

Verify it worked:

```bash
echo $PYSYS_CODE
# Should print: /Users/jasonli/Dev/FORKed repo/pysystemtrade
```

---

## Phase 3 — Create Directory Structure

These are the folders pysystemtrade will write data to. Create them all at once:

```bash
mkdir -p ~/data/mongodb
mkdir -p ~/data/parquet
mkdir -p ~/data/echos
mkdir -p ~/data/mongo_dump
mkdir -p ~/data/backups_csv
mkdir -p ~/data/backtests
mkdir -p ~/data/reports
```

**What each folder is for:**
- `mongodb/` — MongoDB's actual database files (don't touch these manually)
- `parquet/` — Price history in Parquet format (efficient columnar storage for time-series)
- `echos/` — stdout log files, one per process (like `prices.txt`, `systems.txt`)
- `mongo_dump/` — MongoDB backup dumps
- `backups_csv/` — CSV exports of your data (human-readable backups)
- `backtests/` — Saved backtest state (the system caches results here so it doesn't rerun everything)
- `reports/` — PDF/HTML reports generated each evening

---

## Phase 4 — Start MongoDB

### 4.1 Start the Service

```bash
brew services start mongodb-community
```

This starts MongoDB in the background and tells macOS to restart it automatically whenever you reboot.

### 4.2 Verify It's Running

```bash
mongosh --eval "db.runCommand({ping: 1})"
```

You should see output containing `{ ok: 1 }`. That means MongoDB is alive and accepting connections.

### 4.3 No Configuration Needed

pysystemtrade's defaults already match MongoDB's defaults:
- Host: `localhost`
- Port: `27017`
- Database name: `production`

You don't need to change anything in MongoDB itself.

---

## Phase 5 — Configure `private_config.yaml`

This is the one file where you tell pysystemtrade about *your* setup: your IB account, where your data lives, etc.

### 5.1 Create the File

```bash
cd "$PYSYS_CODE"
cp examples/production/private_config_example.yaml private/private_config.yaml
```

### 5.2 Edit the File

Open `private/private_config.yaml` in your editor and fill in these fields:

```yaml
# REQUIRED: Your IB paper trading account number
broker_account: 'DU1234567'   # Replace with your actual DU number

# IB Gateway connection
ib_ipaddress: 'localhost'     # Leave as-is (Gateway runs on same machine)
ib_port: 4002                 # 4002 = TWS paper trading port
                              # Use 4001 if you're using IB Gateway (not TWS)
ib_idoffset: 1                # Leave as-is

# MongoDB connection
mongo_host: 'localhost'       # Leave as-is
mongo_db: 'production'        # Leave as-is

# Where to store price history (parquet files)
parquet_store: '/Users/jasonli/data/parquet'
```

**IB port clarification:**
- IB Gateway (the lightweight version) → use port `4001`
- TWS (Trader Workstation, the full version) → use port `4002`

Both work. IB Gateway uses less memory; TWS has more features. For paper trading, either is fine.

**Email settings:** You can skip the email fields for now. If blank, error notifications just won't be sent — you'll check logs manually instead.

---

## Phase 6 — Set Up IB Gateway for Paper Trading

### 6.1 Download IB Gateway

Download from IBKR's website. Choose "IB Gateway" (not TWS) — it's lighter weight and perfect for automated systems.

### 6.2 Log In to Paper Account

When IB Gateway opens:
- Select **Paper Trading** (not Live Trading)
- Enter your paper trading username and password
- Your paper account number (`DU1234567`) should appear in the top right after login

### 6.3 Enable API Access

This is the critical step that lets pysystemtrade talk to IB.

In IB Gateway, go to: **Edit → Global Configuration → API → Settings**

Check these boxes:
- ✅ **Enable ActiveX and Socket Clients**
- ✅ Socket port: **4001** (or 4002 if using TWS)
- ✅ **Allow connections from localhost only** (security — only your machine can connect)
- ☐ **Read-Only API** — **UNCHECK this** (you need write access to submit orders later)

Click **Apply** and **OK**.

### 6.4 Keep IB Gateway Running

IB Gateway must be running whenever pysystemtrade tries to connect. For now, just keep it open manually. (Automating the login is a later step using IBC — not needed yet.)

---

## Phase 7 — Initialize Instrument & Price Data

**Yes — you need to seed MongoDB before downloading anything from IB.** pysystemtrade ships with years of historical CSV data inside the repo. You load that into MongoDB first (takes ~5 minutes, no IB needed), then IB fills in recent prices on top.

The full sequence is:

```
Step 7.0 — Seed from bundled CSVs  →  no IB needed, ~5 min, do once
Step 7.1 — Load FX prices          →  IB needed
Step 7.2 — Update active contracts →  IB needed
Step 7.3 — Download price history  →  IB needed, ~30–60 min
Step 7.4 — Roll calendars          →  interactive menu
Step 7.5 — Build continuous prices →  no IB needed
Step 7.6 — Verify                  →  check everything loaded
```

All commands below run from your repo root:

```bash
cd "$PYSYS_CODE"
```

### 7.0 Seed MongoDB from Bundled CSV Files (Do This First!)

pysystemtrade ships with historical data in `data/futures/`. These scripts copy that data into your MongoDB database. **Run these before IB Gateway is involved — no connection needed.**

```bash
# Load historical spot FX prices (USD/GBP, USD/EUR, etc.)
uv run python sysinit/futures/repocsv_spotfx_prices.py

# Load multiple prices (raw per-contract price series)
uv run python sysinit/futures/repocsv_multiple_prices.py

# Load adjusted (continuous, back-adjusted) prices
uv run python sysinit/futures/repocsv_adjusted_prices.py

# Load spread costs (used for position sizing and cost estimation)
uv run python sysinit/futures/repocsv_spread_costs.py
```

**Why this matters:** IB only provides ~1–2 years of history. The bundled CSVs give you 10–20 years of data for backtesting and warm-starting your live system. Without this step, your system would have no historical context on day one.

After each script runs, you'll see it processing instrument names in the terminal. No errors = success.

### 7.1 Update Active Contracts

This tells pysystemtrade which futures contract months are currently active for each instrument. IB Gateway must be running from this step onward.

```bash
uv run python sysproduction/update_sampled_contracts.py
```

### 7.2 Download Historical Futures Prices from IB

This downloads recent price history from IB, extending the seed data you just loaded. IB Gateway must be running.

```bash
uv run python sysproduction/update_historical_prices.py
```

This will take a while (potentially 30–60 minutes depending on how many instruments you trade). You'll see progress in the terminal.

### 7.3 Set Up Roll Calendars

Futures contracts expire and "roll" to the next month. The roll calendar tells pysystemtrade when to switch from one contract month to the next.

```bash
uv run python sysproduction/interactive_update_roll_status.py
```

This opens an interactive menu. For each instrument, you'll review when to roll. For the initial setup, accept the defaults (press Enter / choose the suggested option).

### 7.4 Build Multiple & Adjusted Price Series

pysystemtrade needs a single continuous price series for each instrument, even though futures have different contract months. This step stitches them together:

```bash
uv run python sysproduction/update_multiple_adjusted_prices.py
```

### 7.5 Verify Prices

Run the interactive diagnostics tool and check that your instruments have data:

```bash
uv run python sysproduction/interactive_diagnostics.py
```

In the menu, choose **Prices** → **View adjusted prices for instrument**. Pick one of your instruments and verify you see a price history going back many years (from the CSV seed) plus recent prices (from IB). If it shows data, you're good.

---

## Phase 8 — Initialize Capital

You need to tell pysystemtrade how much capital you're working with. This number is used for all position sizing calculations.

```bash
uv run python sysproduction/interactive_update_capital_manual.py
```

The menu will ask you to set:
- **Total capital:** Enter your paper account's notional value (e.g., 100000 for $100,000)

**Why this matters:** If you set $100,000 but your paper account only shows $50,000, all your position sizes will be twice as large as they should be. Match the capital figure to your actual paper account balance.

---

## Phase 9 — Run Your First Backtest (Production Mode)

This runs your strategy in "production backtest" mode — using the same logic as your research backtests, but with live prices. The output is a set of **optimal positions**: how many contracts the system wants to hold for each instrument.

```bash
uv run python sysproduction/run_systems.py
```

This will take a few minutes. When done, check the results:

```bash
uv run python sysproduction/interactive_diagnostics.py
```

Choose **Optimal positions** in the menu. You should see a list of instruments and how many contracts the system wants to hold (positive = long, negative = short, 0 = flat).

---

## Phase 10 — Your Daily Manual Trading Workflow

Now you're in the rhythm. Here's what you do each trading day.

### Morning: Check What Trades Are Needed

```bash
uv run python sysproduction/run_strategy_order_generator.py
```

This compares current optimal positions to your actual IB positions and generates a list of trades. Then check what it generated:

```bash
uv run python sysproduction/interactive_order_stack.py
```

In the menu, choose **View instrument orders** to see what the system wants to trade.

### Enter the Trades in IB

Log into IB's paper trading interface and manually place the trades that the order generator identified. For each instrument:
- Which direction (buy or sell)
- How many contracts
- Use limit orders near the current price, or market orders

### Confirm the Fills

After your orders fill in IB, you need to tell pysystemtrade what happened:

```bash
uv run python sysproduction/interactive_order_stack.py
```

Choose **Manually fill broker order** and enter the fill price and quantity. This updates your position records so the system knows where you stand.

### Evening: Automatic Data Update (via cron)

Set up cron (see Phase 11) to automatically update prices and run the backtest each evening. You don't need to do this manually.

---

## Phase 11 — Set Up Daily Scheduling with cron

macOS includes `cron`, the standard Unix task scheduler. You'll set it up to automatically:
- Download new prices each evening after market close
- Re-run the backtest overnight
- Generate reports

### 11.0 Find Your Virtual Environment's Python Path

Because cron runs with a minimal PATH (it can't find `uv` the way your terminal can), we use the `.venv` Python directly. Run this once to get the path:

```bash
cd "$PYSYS_CODE" && uv run which python
```

This will print something like:
```
/Users/jasonli/Dev/FORKed repo/pysystemtrade/.venv/bin/python
```

Copy that path — you'll use it in the crontab below.

### 11.1 Open the crontab Editor

```bash
crontab -e
```

This opens a text editor. Add these lines (replace the Python path with what you got above):

```cron
# Set environment variables for cron (cron doesn't read ~/.zprofile)
PYSYS_CODE=/Users/jasonli/Dev/FORKed repo/pysystemtrade
ECHO_PATH=/Users/jasonli/data/echos
PYTHON=/Users/jasonli/Dev/FORKed repo/pysystemtrade/.venv/bin/python

# Update FX prices (weekdays at 8pm)
0 20 * * 1-5 cd "$PYSYS_CODE" && "$PYTHON" sysproduction/run_daily_fx_and_contract_updates.py >> "$ECHO_PATH/fx.txt" 2>&1

# Update futures prices (weekdays at 8:05pm)
5 20 * * 1-5 cd "$PYSYS_CODE" && "$PYTHON" sysproduction/run_daily_price_updates.py >> "$ECHO_PATH/prices.txt" 2>&1

# Update multiple/adjusted prices (weekdays at 8:30pm)
30 20 * * 1-5 cd "$PYSYS_CODE" && "$PYTHON" sysproduction/run_daily_update_multiple_adjusted_prices.py >> "$ECHO_PATH/adjusted.txt" 2>&1

# Run overnight backtest (weekdays at 9pm)
0 21 * * 1-5 cd "$PYSYS_CODE" && "$PYTHON" sysproduction/run_systems.py >> "$ECHO_PATH/systems.txt" 2>&1

# Generate orders (weekdays at 10pm)
0 22 * * 1-5 cd "$PYSYS_CODE" && "$PYTHON" sysproduction/run_strategy_order_generator.py >> "$ECHO_PATH/orders.txt" 2>&1

# Generate reports (weekdays at 10:30pm)
30 22 * * 1-5 cd "$PYSYS_CODE" && "$PYTHON" sysproduction/run_reports.py >> "$ECHO_PATH/reports.txt" 2>&1
```

Save and exit. cron will now run these automatically.

> **Note:** The `run_stack_handler.py` process (auto-execution) is intentionally NOT included here. You're doing Phase 1 (manual entry). Add it in Phase 2 when you're ready.

### 11.2 Grant cron Full Disk Access (macOS Security)

macOS may block cron from accessing your files. Fix this:

1. Open **System Settings → Privacy & Security → Full Disk Access**
2. Click **+** and add `/usr/sbin/cron`

### 11.3 Check if cron is Working

The morning after you set up cron, check the echo files:

```bash
cat ~/data/echos/prices.txt
```

If prices ran successfully, you'll see log output. If there are errors, they'll be in the same file.

---

## Phase 12 — Verify Everything Works

Run through this checklist to confirm your system is healthy:

### Check MongoDB Has Data

```bash
mongosh production --eval "db.getCollectionNames()"
```

You should see a list of collection names (like `futures_adjusted_prices`, `capital`, etc.). An empty list means the CSV seeding step (Phase 7.0) didn't run.

### Check Parquet Files Exist

```bash
ls ~/data/parquet/
```

You should see folders named after your instruments (e.g., `ES`, `GC`, `CL`).

### Run the Full Diagnostics

```bash
cd "$PYSYS_CODE"
uv run python sysproduction/interactive_diagnostics.py
```

Walk through the menu options:
- **Prices** → check adjusted prices for 2–3 instruments ✅
- **Capital** → confirm your capital figure is set ✅
- **Optimal positions** → see what the system currently wants to hold ✅

---

## Troubleshooting

### "Cannot connect to MongoDB"

```bash
brew services restart mongodb-community
mongosh --eval "db.runCommand({ping: 1})"
```

### "IB connection refused"

- Check IB Gateway is open and logged in
- Verify API is enabled (Edit → Global Configuration → API → Settings)
- Make sure the port in `private_config.yaml` matches IB Gateway's port setting

### "No prices found for instrument X"

Your strategy config might reference an instrument that hasn't had prices downloaded yet. Run:

```bash
uv run python sysproduction/update_historical_prices.py
```

Then check the instrument name in your strategy YAML matches exactly what's in `sysbrokers/IB/config/ib_config_futures.csv`.

### "Environment variable not found"

cron doesn't read `~/.zprofile`. Make sure you've set `PYSYS_CODE` and `ECHO_PATH` directly in the crontab (as shown in Phase 11).

### MongoDB collections are empty after Phase 7.0

Make sure MongoDB was running when you ran the `repocsv_*.py` scripts. Run `mongosh --eval "db.runCommand({ping: 1})"` to confirm it's up, then re-run the seeding scripts.

---

## What's NOT Set Up Yet (Phase 2)

When you're confident in the system and want to automate execution:

1. **`run_stack_handler.py`** — automatically submits orders to IB. Add to crontab once you trust the system.
2. **IBC (IB Controller)** — auto-logs in to IB Gateway overnight so it's always running.
3. **Off-site backups** — copies MongoDB backup to an external location.

These are deliberately deferred. Get comfortable with the manual workflow first.

---

## Quick Reference: Daily Manual Workflow

```
Morning:
  1. Check optimal positions:   uv run python sysproduction/interactive_diagnostics.py
  2. Check order stack:         uv run python sysproduction/interactive_order_stack.py
  3. Place trades manually in IB paper account
  4. Record fills:              uv run python sysproduction/interactive_order_stack.py

Evening (cron handles automatically):
  - Prices updated from IB
  - Backtest runs overnight
  - New optimal positions generated
  - Reports generated
```
