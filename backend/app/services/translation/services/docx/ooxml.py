from __future__ import annotations

import io
import zipfile
from dataclasses import dataclass
from typing import Iterable, List, Dict
from lxml import etree


NAMESPACES = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
    "v": "urn:schemas-microsoft-com:vml",
    "wps": "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
}


TEXT_PARTS = [
    "word/document.xml",
    # headers/footers
    *[f"word/header{i}.xml" for i in range(1, 6)],
    *[f"word/footer{i}.xml" for i in range(1, 6)],
    # notes/comments
    "word/footnotes.xml",
    "word/endnotes.xml",
    "word/comments.xml",
]


@dataclass
class Segment:
    id: str
    part: str
    xpath: str
    source: str


def _iter_text_nodes_word(doc: etree._ElementTree) -> Iterable[etree._Element]:
    # WordprocessingML text nodes in document/headers/footers/etc.
    for node in doc.findall(".//w:t", namespaces=NAMESPACES):
        yield node
    # DrawingML text nodes inside shapes/text boxes added in the document
    for node in doc.findall(".//a:txBody//a:t", namespaces=NAMESPACES):
        yield node


def _iter_text_nodes_chart(doc: etree._ElementTree) -> Iterable[etree._Element]:
    # Chart rich text (titles, axis titles, data labels with rich text)
    # Capture any DrawingML text inside chart parts
    for node in doc.findall(".//a:t", namespaces=NAMESPACES):
        yield node
    # Chart string caches for series names and category labels
    for node in doc.findall(".//c:strCache//c:pt//c:v", namespaces=NAMESPACES):
        yield node
    # Direct value under c:tx (series/axis titles sometimes stored here)
    for node in doc.findall(".//c:tx//c:v", namespaces=NAMESPACES):
        yield node


def _iter_text_nodes(doc: etree._ElementTree, part_name: str) -> Iterable[etree._Element]:
    if part_name.startswith("word/charts/"):
        yield from _iter_text_nodes_chart(doc)
    else:
        yield from _iter_text_nodes_word(doc)


def extract_segments(docx_bytes: bytes) -> List[Segment]:
    segs: List[Segment] = []
    with zipfile.ZipFile(io.BytesIO(docx_bytes), "r") as z:
        # base parts + discovered chart parts
        namelist = z.namelist()
        chart_parts = [n for n in namelist if n.startswith("word/charts/") and n.endswith(".xml")]
        parts = [p for p in TEXT_PARTS if p in namelist] + chart_parts
        for part in parts:
            xml_bytes = z.read(part)
            root = etree.fromstring(xml_bytes)
            doc = etree.ElementTree(root)
            idx = 0
            for node in _iter_text_nodes(doc, part):
                text = (node.text or "").strip()
                if text == "":
                    idx += 1
                    continue
                # Build simple xpath-like identifier
                path = doc.getpath(node)
                seg_id = f"{part}:{idx}"
                segs.append(Segment(id=seg_id, part=part, xpath=path, source=text))
                idx += 1
    return segs


def inject_translations(docx_bytes: bytes, mapping: Dict[str, str]) -> bytes:
    out_buf = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(docx_bytes), "r") as zin, zipfile.ZipFile(out_buf, "w", zipfile.ZIP_DEFLATED) as zout:
        namelist = zin.namelist()
        for name in namelist:
            data = zin.read(name)
            if (name in TEXT_PARTS) or (name.startswith("word/charts/") and name.endswith(".xml")):
                try:
                    root = etree.fromstring(data)
                    doc = etree.ElementTree(root)
                    idx = 0
                    for node in _iter_text_nodes(doc, name):
                        key = f"{name}:{idx}"
                        if key in mapping:
                            node.text = mapping[key]
                        idx += 1
                    new_xml = etree.tostring(root, xml_declaration=True, encoding="utf-8")
                    zout.writestr(name, new_xml)
                except Exception:
                    # If parse fails, write original
                    zout.writestr(name, data)
            else:
                zout.writestr(name, data)
    return out_buf.getvalue()


def _index_from_path(path: str) -> int:  # kept for future use
    return 0
