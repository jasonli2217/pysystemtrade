# Repository Guidelines

## Project Structure & Module Organization

`pysystemtrade` is a Python 3.10+ systematic futures trading project. Source is organized as top-level packages rather than under `src/`: `syscore/`, `sysdata/`, `systems/`, `sysquant/`, `sysobjects/`, `sysexecution/`, `sysproduction/`, `sysbrokers/`, and related `sys*` packages. Market data lives in `data/`; configuration defaults are in `sysdata/config/`, `systems/provided/`, `syscontrol/`, and `private/`. Documentation is in `docs/`; executable examples are in `examples/`. Tests are in package folders such as `syscore/tests/`, `sysdata/tests/`, and `systems/tests/`, plus root `tests/`.

## Build, Test, and Development Commands

Use `uv` for local development.

- `uv venv --python 3.10`: create the project virtual environment.
- `uv pip install --editable '.[dev]'`: install the package and dev tools from `pyproject.toml`.
- `uv run pytest`: run pytest and doctests.
- `uv run pytest sysdata/tests/test_config.py`: run one focused test module.
- `uv run pytest --runslow --disable-warnings`: include tests marked slow.
- `uv run black .`: format Python files with Black.

`setup.py` and `requirements.txt` are compatibility files; prefer `pyproject.toml`.

## Coding Style & Naming Conventions

Black is the formatter; `pyproject.toml` sets line length to 88 and Python target `py310`. Follow nearby modules before introducing new patterns. Use type hints for new code. Keep functions small and explicit, and prefer existing sentinels such as `arg_not_supplied`. Naming is not pure PEP 8: some classes use mixedCase, and common method names include `get`, `calculate`, `read`, and `write`.

## Testing Guidelines

Pytest is the active test framework. The repository also runs doctests via `--doctest-modules`; verify changed docstring examples. Add regression tests beside the affected package, using `test_*.py` naming. There is no fixed coverage threshold, but new behavior should have direct unit coverage and, where it touches data loading or system behavior, an integration-style test using sample data.

## Commit & Pull Request Guidelines

Recent commits use short, direct summaries such as `Correctly parse order rejection status from IB.` Branches should start from `develop` and follow `bug-<issue#>-description` or `feature-<issue#>-description` when an issue exists. Pull requests target upstream `develop`, explain the change, link the issue or discussion, and list tests run. Large features should start as an Ideas discussion. If AI tools helped, mention that in the PR and personally review every generated change.

## Security & Configuration Tips

Do not commit broker credentials, private YAML overrides, databases, or generated cache files. Treat `private/` and production configuration examples carefully; when adding docs or tests, use sanitized sample data from `data/test/` or existing fixtures.
