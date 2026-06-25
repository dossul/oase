#!/usr/bin/env python3
"""
Met à jour le code backend TypeScript pour utiliser les noms de champs camelCase
issus du nouveau schema Prisma.
"""
import re
from pathlib import Path

SCHEMA_BACKUP = Path("oase-api/prisma/schema.prisma.bak")
BACKEND_FILES = [
    Path("docs/backend/impl/audit/audit.service.ts"),
    Path("docs/backend/impl/audit/audit-log.interceptor.ts"),
    Path("docs/backend/impl/auth/auth.controller.ts"),
    Path("docs/backend/impl/auth/auth.service.ts"),
    Path("docs/backend/impl/auth/auth.module.ts"),
    Path("docs/backend/impl/auth/mfa.service.ts"),
    Path("docs/backend/impl/auth/strategies/jwt.strategy.ts"),
    Path("docs/backend/impl/connecteurs/adapters/etax.adapter.ts"),
    Path("docs/backend/impl/connecteurs/adapters/stubs.ts"),
    Path("docs/backend/impl/connecteurs/adapters/sydonia.adapter.ts"),
    Path("docs/backend/impl/connecteurs/circuit-breaker.service.ts"),
    Path("docs/backend/impl/common/guards/jwt-auth.guard.ts"),
    Path("docs/backend/impl/common/guards/pin.guard.ts"),
    Path("docs/backend/seed-demo.ts"),
]


def to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


def collect_field_names() -> dict[str, str]:
    text = SCHEMA_BACKUP.read_text(encoding="utf-8")
    fields: dict[str, str] = {}
    in_model = False
    for line in text.splitlines():
        if re.match(r'^model\s+\w+\s*\{', line):
            in_model = True
            continue
        if in_model and line.strip() == "}":
            in_model = False
            continue
        if in_model:
            m = re.match(r'^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+\S+', line)
            if m:
                name = m.group(1)
                if "_" in name:
                    fields[name] = to_camel(name)
    return fields


def replace_outside_strings_and_comments(text: str, mapping: dict[str, str]) -> str:
    result = []
    i = 0
    n = len(text)
    state = "normal"
    brace_depth = 0

    def emit_token(tok: str) -> None:
        # remplacer seulement les tokens entiers correspondant à un champ
        new_tok = mapping.get(tok)
        if new_tok is not None:
            result.append(new_tok)
        else:
            result.append(tok)

    while i < n:
        ch = text[i]
        nxt = text[i + 1] if i + 1 < n else ""

        if state == "normal" or state == "template_expr":
            if state == "normal":
                if ch == "/" and nxt == "/":
                    result.append(ch)
                    state = "line_comment"
                    i += 1
                    continue
                if ch == "/" and nxt == "*":
                    result.append(ch)
                    state = "block_comment"
                    i += 1
                    continue
                if ch == '"':
                    result.append(ch)
                    state = "double_string"
                    i += 1
                    continue
                if ch == "'":
                    result.append(ch)
                    state = "single_string"
                    i += 1
                    continue
                if ch == "`":
                    result.append(ch)
                    state = "template_string"
                    i += 1
                    continue

            if ch.isalpha() or ch == "_":
                j = i
                while j < n and (text[j].isalnum() or text[j] == "_"):
                    j += 1
                tok = text[i:j]
                emit_token(tok)
                i = j
                continue

            result.append(ch)

            if state == "template_expr":
                if ch == "{":
                    brace_depth += 1
                elif ch == "}":
                    brace_depth -= 1
                    if brace_depth == 0:
                        state = "template_string"

            i += 1
            continue

        if state == "line_comment":
            result.append(ch)
            if ch == "\n":
                state = "normal"
            i += 1
            continue

        if state == "block_comment":
            result.append(ch)
            if ch == "*" and nxt == "/":
                result.append(nxt)
                state = "normal"
                i += 2
                continue
            i += 1
            continue

        if state in ("double_string", "single_string"):
            result.append(ch)
            if ch == "\\":
                result.append(nxt)
                i += 2
                continue
            if (state == "double_string" and ch == '"') or (state == "single_string" and ch == "'"):
                state = "normal"
            i += 1
            continue

        if state == "template_string":
            result.append(ch)
            if ch == "\\":
                result.append(nxt)
                i += 2
                continue
            if ch == "`":
                state = "normal"
                i += 1
                continue
            if ch == "$" and nxt == "{":
                result.append(nxt)
                state = "template_expr"
                brace_depth = 1
                i += 2
                continue
            i += 1
            continue

    return "".join(result)


def update_backend():
    mapping = collect_field_names()
    # Trier par longueur décroissante pour éviter les remplacements partiels
    for path in BACKEND_FILES:
        if not path.exists():
            print(f"Fichier manquant : {path}")
            continue
        text = path.read_text(encoding="utf-8")
        new_text = replace_outside_strings_and_comments(text, mapping)
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            print(f"Mis à jour : {path}")
        else:
            print(f"Aucun changement : {path}")


if __name__ == "__main__":
    update_backend()
