#!/usr/bin/env python3
"""
Corrections supplémentaires dans seed-demo.ts pour aligner les clés
sur les champs Prisma camelCase.
"""
from pathlib import Path

PATH = Path("docs/backend/seed-demo.ts")

REPLACEMENTS = {
    "type_beneficiaire:": "typeBeneficiaireCode:",
    "statut_fiscal:": "statutFiscalCode:",
    "beneficiaire_id:": "beneficiaireId:",
    "nature_mesure:": "natureMesureCode:",
    "portee_categorie:": "porteeCategorieCode:",
    "organe_gestion:": "organeGestionCode:",
    "mode_instruction:": "modeInstructionCode:",
    "type_institution:": "typeInstitutionCode:",
    "type_quota:": "typeQuotaCode:",
    "detectee_par:": "detecteeParCode:",
}


def fix():
    text = PATH.read_text(encoding="utf-8")
    for old, new in REPLACEMENTS.items():
        text = text.replace(old, new)
    PATH.write_text(text, encoding="utf-8")
    print(f"Corrections appliquées à {PATH}")


if __name__ == "__main__":
    fix()
