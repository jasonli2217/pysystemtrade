"""MkDocs build hooks for pysystemtrade's original documentation."""

from __future__ import annotations

import re
from typing import Any

from pymdownx.slugs import slugify


REPOSITORY_BLOB_URL = "https://github.com/pst-group/pysystemtrade/blob/develop/"
GITHUB_SLUGIFY = slugify(case="lower-ascii")
DOCS_LINK_PATTERN = re.compile(
    r"\]\(/docs/(?P<target>[^)#]+\.md)(?P<fragment>#[^)]*)?\)"
)
SOURCE_LINK_PATTERN = re.compile(
    r"\]\(/(?P<path>(?!docs/)[^ )#]+)(?P<fragment>#[^)]*)?\)"
)
LOCAL_ANCHOR_LINK_PATTERN = re.compile(r"\]\(#(?P<fragment>[^)]+)\)")


def on_page_markdown(
    markdown: str, *, page: Any, config: Any, files: Any
) -> str:
    """Make repository-style links work in the generated documentation site."""

    markdown = DOCS_LINK_PATTERN.sub(_rewrite_docs_link, markdown)
    markdown = SOURCE_LINK_PATTERN.sub(_rewrite_source_link, markdown)
    return LOCAL_ANCHOR_LINK_PATTERN.sub(_rewrite_local_anchor_link, markdown)


def github_slugify(value: str, separator: str) -> str:
    """Return anchors compatible with the existing GitHub-generated contents."""

    return GITHUB_SLUGIFY(value, separator)


def _rewrite_docs_link(match: re.Match[str]) -> str:
    return f"]({match.group('target')}{match.group('fragment') or ''})"


def _rewrite_source_link(match: re.Match[str]) -> str:
    return (
        f"]({REPOSITORY_BLOB_URL}{match.group('path')}"
        f"{match.group('fragment') or ''})"
    )


def _rewrite_local_anchor_link(match: re.Match[str]) -> str:
    return f"](#{match.group('fragment').lower()})"
