#!/usr/bin/env python3
"""Run Graphify on OASE project and save outputs."""
import sys
import json
from pathlib import Path

PROJECT_DIR = Path("c:/wamp64/www/oase")
OUTPUT_DIR = PROJECT_DIR / "graphify-out"
OUTPUT_DIR.mkdir(exist_ok=True)

print("=" * 60)
print("GRAPHIFY OASE - Knowledge Graph Builder")
print("=" * 60)

# Step 1: Detect files
print("\n[1/4] Detecting files...")
from graphify.detect import detect
result = detect(PROJECT_DIR)
print(f"  Files: {result.get('total_files', 0)}")
print(f"  Words: {result.get('total_words', 0)}")

# Save detection
with open(OUTPUT_DIR / "detect.json", "w", encoding="utf-8") as f:
    json.dump({
        "total_files": result.get("total_files", 0),
        "total_words": result.get("total_words", 0),
        "files": {k: len(v) for k, v in result.get("files", {}).items()}
    }, f, indent=2)

# Step 2: Semantic extraction
print("\n[2/4] Extracting entities and relationships...")
from graphify.extract import collect_files, extract

all_files = []
for ftype, flist in result.get("files", {}).items():
    for f in flist:
        p = Path(f)
        if p.exists():
            all_files.append(p)

if all_files:
    try:
        extraction = extract(all_files[:50])  # Limit to avoid overload
        print(f"  Nodes: {len(extraction.get('nodes', []))}")
        print(f"  Edges: {len(extraction.get('edges', []))}")
        with open(OUTPUT_DIR / "extract.json", "w", encoding="utf-8") as f:
            json.dump(extraction, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"  Extraction error: {e}")
        extraction = {"nodes": [], "edges": []}
else:
    extraction = {"nodes": [], "edges": []}

# Step 3: Build graph
print("\n[3/4] Building graph...")
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions

G = build_from_json(extraction)
communities = cluster(G)
cohesion = score_all(G, communities)
gods = god_nodes(G)
surprises = surprising_connections(G, communities)

print(f"  Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
print(f"  Communities: {len(communities)}")

# Save graph
from graphify.export import to_json as export_json
export_json(G, communities, str(OUTPUT_DIR / "graph.json"))

# Step 4: Generate report
print("\n[4/4] Generating report...")
from graphify.report import generate

labels = {cid: f"Community {cid}" for cid in communities}
detection_summary = {
    "total_files": result.get("total_files", 0),
    "total_words": result.get("total_words", 0),
    "needs_graph": True,
    "warning": None,
    "files": result.get("files", {})
}
tokens = {"input": 0, "output": 0}

questions = suggest_questions(G, communities, labels)

report = generate(
    G, communities, cohesion, labels, gods, surprises,
    detection_summary, tokens, str(PROJECT_DIR),
    suggested_questions=questions
)

with open(OUTPUT_DIR / "GRAPH_REPORT.md", "w", encoding="utf-8") as f:
    f.write(report)

# Save analysis summary
analysis = {
    "communities": {str(k): v for k, v in communities.items()},
    "cohesion": {str(k): v for k, v in cohesion.items()},
    "god_nodes": gods,
    "surprises": surprises,
    "questions": questions,
    "labels": labels
}
with open(OUTPUT_DIR / "analysis.json", "w", encoding="utf-8") as f:
    json.dump(analysis, f, indent=2, ensure_ascii=False)

print("\n" + "=" * 60)
print("GRAPHIFY COMPLETE")
print("=" * 60)
print(f"Outputs in: {OUTPUT_DIR}")
print(f"  - graph.json")
print(f"  - GRAPH_REPORT.md")
print(f"  - analysis.json")
print(f"  - detect.json")
