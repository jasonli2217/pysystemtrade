"""Integration coverage for the generated right-side table of contents."""

from __future__ import annotations

import logging
from pathlib import Path

from mkdocs.commands.build import build
from mkdocs.config import load_config


def test_backtesting_page_has_a_navigable_right_side_table_of_contents(
    tmp_path: Path,
) -> None:
    project_root = Path(__file__).resolve().parents[1]
    logging.getLogger("mkdocs").setLevel(logging.WARNING)
    logging.getLogger("MARKDOWN").setLevel(logging.WARNING)
    config = load_config(str(project_root / "mkdocs.yml"))
    config["site_dir"] = str(tmp_path / "site")

    build(config)

    page_html = (tmp_path / "site" / "backtesting" / "index.html").read_text()
    sidebar_start = page_html.index(
        '<div class="md-sidebar md-sidebar--secondary"'
    )
    content_start = page_html.index(
        '<div class="md-content" data-md-component="content">'
    )
    sidebar_html = page_html[sidebar_start:content_start]

    assert "Table of contents" in sidebar_html
    assert 'href="#how-do-i"' in sidebar_html
    assert 'href="#guide"' in sidebar_html
    assert 'href="#processes"' in sidebar_html
    assert 'href="#reference"' in sidebar_html
