"""Regression tests for documentation-site link normalization."""

from __future__ import annotations

from docs.build_hooks import on_page_markdown


def test_rewrites_repository_docs_link_to_mkdocs_link() -> None:
    markdown = "Read the [production guide](/docs/production.md#data-backup)."

    rendered = on_page_markdown(markdown, page=None, config=None, files=None)

    assert rendered == "Read the [production guide](production.md#data-backup)."


def test_rewrites_repository_source_link_to_github() -> None:
    markdown = "See [the class](/sysdata/config/configdata.py)."

    rendered = on_page_markdown(markdown, page=None, config=None, files=None)

    assert rendered == (
        "See [the class](https://github.com/pst-group/pysystemtrade/blob/develop/"
        "sysdata/config/configdata.py)."
    )


def test_leaves_external_links_unchanged() -> None:
    markdown = "Read [uv](https://docs.astral.sh/uv/)."

    rendered = on_page_markdown(markdown, page=None, config=None, files=None)

    assert rendered == markdown


def test_normalizes_a_local_anchor_link() -> None:
    markdown = "Jump to [Processes](#Processes)."

    rendered = on_page_markdown(markdown, page=None, config=None, files=None)

    assert rendered == "Jump to [Processes](#processes)."
