1. Clean Local Architecture
Before running the installation, set up a clear distinction between the core framework files and your personal learning materials. Inside your local pysystemtrade folder, create a dedicated directory for your work:

Bash
```
cd pysystemtrade
mkdir learning_sandbox
```

Why do this? By keeping your personal scripts inside learning_sandbox/, you avoid accidentally modifying core repository files, making it much easier to pull updates from the original pst-group/pysystemtrade repository later if you want to sync with the latest upstream features.

u
2. Environment Creation & Editable Installation
Run the following commands to initialize your environment and install the package using uv.

Bash
# 1. Ensure Python 3.10 is installed via uv
uv python install 3.10

# 2. Create the virtual environment pinned to Python 3.10
uv venv --python 3.10

# 3. Activate the virtual environment
source .venv/bin/activate

# 4. Install in EDITABLE mode with development dependencies
uv pip install --editable '.[dev]'

Why the --editable flag is critical for your workflow:
When you install using uv pip install --editable '.[dev]', Python creates a pointer to your local source directory rather than copying files into .venv/lib/.

Live Updates: If you modify any core code or configuration file in the repository, the changes take effect immediately across your environment without requiring a reinstall.

Cross-Script Imports: Inside your learning_sandbox/ directory, you can cleanly import the package components exactly like the official documentation shows:

Python
from sysdata.sim.csv_futures_sim_data import csvFuturesSimData
data = csvFuturesSimData()

3. Managing Your GitHub Sync Strategy
Since you want to work across multiple computers, your .gitignore configuration and Git branch strategy are key to keeping things clean.

Step A: Protect your environment and data
Open the .gitignore file at the root of the project and ensure the following patterns are present so you don't push bulky binaries or local environment configurations to your GitHub fork:

Plaintext
.venv/
.uv/
*.pyc
.python-version
# If you download historical market data locally:
data/
Step B: The Multi-Computer Sync Routine
When moving between your laptop and other computers, follow this lifecycle to keep your code in sync:

On Computer 1 (After writing scripts):

Bash
git add learning_sandbox/
git commit -m "feat: added momentum backtest script"
git push origin develop
On Computer 2 (First time setup):

Bash
# Clone your fork
git clone https://github.com/<your_github_id>/pysystemtrade.git
cd pysystemtrade

# Recreate the ultra-fast uv environment locally
uv venv --python 3.10
source .venv/bin/activate
uv pip install --editable '.[dev]'


On Computer 2 (Daily routine before starting work):

Bash
# Pull your latest personal scripts


4. Quick Sanity Check
To verify everything is wired correctly, activate your environment, open up a Python interactive shell, and run the basic data check included in the project's installation guide:

Python
from sysdata.sim.csv_futures_sim_data import csvFuturesSimData
data = csvFuturesSimData()
print(data)
# Should output: csvFuturesSimData object with 249 instruments
Now you have a completely portable, high-performance execution layer. Any script you drop into learning_sandbox/ will have full access to the underlying ecosystem, and syncing your fork will seamlessly bring your entire lab environment onto your other machines.


# Pull updates from the original repo

Step 1: Link to the Original Repository
You need to add a new remote, conventionally named upstream, that points back to the original pst-group repository. Run this command inside your local project folder:

Bash
git remote add upstream https://github.com/pst-group/pysystemtrade.git

To verify that Git now tracks both your fork (origin) and the original source (upstream), run:

Bash
git remote -v

You should see four lines: two for origin pointing to your personal GitHub account, and two for upstream pointing to pst-group.

Step 2: The Modern Sync Workflow
Once upstream is configured, you can pull down new features, bug fixes, or updates from the main pysystemtrade repository using a two-step process:

1. Fetch and merge the upstream changes into your local branch:

Bash
# Make sure you are on your local development branch
git checkout develop

# Pull the latest code directly from the original project
git pull upstream develop

(If there are any conflicting changes between the upstream code and your learning_sandbox/ scripts, Git will ask you to resolve them here, though keeping your work in a standalone folder makes conflicts highly unlikely.)

2. Push those updates back up to your personal GitHub fork:
Bash
# Update your fork on GitHub so your other computers can see the updates
git push origin develop