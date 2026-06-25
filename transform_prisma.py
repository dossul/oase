#!/usr/bin/env python3
"""
Transforme schema.prisma vers les conventions OASE :
- modèles PascalCase (singulier) avec @@map(nom_table_snake_case)
- champs camelCase avec @map(nom_colonne_snake_case) quand le nom change
- types relationnels mis à jour
- index/unique/fulltext/id mis à jour
"""
import re
from pathlib import Path

SCHEMA = Path("oase-api/prisma/schema.prisma")
BACKUP = Path("oase-api/prisma/schema.prisma.bak")

# Mapping explicite snake_case -> PascalCase singulier
MODEL_MAP: dict[str, str] = {
    "accords_siege": "AccordSiege",
    "actes": "Acte",
    "agrement_beneficiaires": "AgrementBeneficiaire",
    "agrements": "Agrement",
    "anomalies": "Anomalie",
    "archivages": "Archivage",
    "audit_logs": "AuditLog",
    "base_juridique_documents": "BaseJuridiqueDocument",
    "base_juridique_versions": "BaseJuridiqueVersion",
    "bases_juridiques": "BaseJuridique",
    "beneficiaire_historique_fiscal": "BeneficiaireHistoriqueFiscal",
    "beneficiaires": "Beneficiaire",
    "codes_additionnels": "CodeAdditionnel",
    "connecteur_logs": "ConnecteurLog",
    "connecteurs": "Connecteur",
    "convention_engagements": "ConventionEngagement",
    "conventions": "Convention",
    "decisions": "Decision",
    "demande_complements": "DemandeComplement",
    "demande_sync_externe": "DemandeSyncExterne",
    "demande_workflow_etapes": "DemandeWorkflowEtape",
    "demande_workflow_instances": "DemandeWorkflowInstance",
    "demandes": "Demande",
    "imports_mrd": "ImportMrd",
    "institutions": "Institution",
    "job_queue": "JobQueue",
    "notification_preferences": "NotificationPreference",
    "notification_queue": "NotificationQueue",
    "notification_templates": "NotificationTemplate",
    "notifications": "Notification",
    "opendata_publications": "OpendataPublication",
    "parametres_systeme": "ParametreSysteme",
    "pieces_jointes": "PieceJointe",
    "push_tokens": "PushToken",
    "quota_mouvements": "QuotaMouvement",
    "quotas": "Quota",
    "ref_canaux_notification": "RefCanalNotification",
    "ref_canaux_push": "RefCanalPush",
    "ref_categories_anomalie": "RefCategorieAnomalie",
    "ref_etats_job": "RefEtatJob",
    "ref_gravites_anomalie": "RefGraviteAnomalie",
    "ref_modes_instruction": "RefModeInstruction",
    "ref_natures_mesure": "RefNatureMesure",
    "ref_organes_gestion": "RefOrganeGestion",
    "ref_portees_categorie": "RefPorteeCategorie",
    "ref_rangs_piece": "RefRangPiece",
    "ref_regimes_convention": "RefRegimeConvention",
    "ref_roles": "RefRole",
    "ref_sources_code": "RefSourceCode",
    "ref_sources_detection": "RefSourceDetection",
    "ref_statuts_anomalie": "RefStatutAnomalie",
    "ref_statuts_archivage": "RefStatutArchivage",
    "ref_statuts_connecteur": "RefStatutConnecteur",
    "ref_statuts_convention": "RefStatutConvention",
    "ref_statuts_demande": "RefStatutDemande",
    "ref_statuts_etape": "RefStatutEtape",
    "ref_statuts_fiscal": "RefStatutFiscal",
    "ref_statuts_notification": "RefStatutNotification",
    "ref_statuts_utilisateur": "RefStatutUtilisateur",
    "ref_types_accord_siege": "RefTypeAccordSiege",
    "ref_types_acte": "RefTypeActe",
    "ref_types_agrement": "RefTypeAgrement",
    "ref_types_beneficiaire": "RefTypeBeneficiaire",
    "ref_types_decision": "RefTypeDecision",
    "ref_types_document": "RefTypeDocument",
    "ref_types_institution": "RefTypeInstitution",
    "ref_types_job": "RefTypeJob",
    "ref_types_mouvement_quota": "RefTypeMouvementQuota",
    "ref_types_notification": "RefTypeNotification",
    "ref_types_parametre": "RefTypeParametre",
    "ref_types_quota": "RefTypeQuota",
    "ref_types_rapport": "RefTypeRapport",
    "ref_unites_quota": "RefUniteQuota",
    "refresh_tokens": "RefreshToken",
    "regles_anomalie": "RegleAnomalie",
    "reporting_aggregats": "ReportingAggregat",
    "reporting_executions": "ReportingExecution",
    "reset_password_tokens": "ResetPasswordToken",
    "roles_permissions": "RolePermission",
    "sessions_utilisateur": "SessionUtilisateur",
    "system_logs": "SystemLog",
    "utilisateurs": "Utilisateur",
    "workflow_template_etapes": "WorkflowTemplateEtape",
    "workflow_template_transitions": "WorkflowTemplateTransition",
    "workflow_templates": "WorkflowTemplate",
}


def to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


def model_name_from_type(type_str: str) -> tuple[str, str, str]:
    m = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)(\?|\[\])?$', type_str)
    if not m:
        return type_str, "", type_str
    base, suffix = m.group(1), m.group(2) or ""
    return base, suffix, MODEL_MAP.get(base, base)


def transform_relation_attr(rest: str) -> str:
    def repl_relation(m: re.Match) -> str:
        inner = m.group(1)

        def repl_fields_refs(mm: re.Match) -> str:
            key = mm.group(1)
            fields_str = mm.group(2)
            new_fields = ", ".join(to_camel(f.strip()) for f in fields_str.split(",") if f.strip())
            return f"{key}: [{new_fields}]"

        inner = re.sub(r'(fields|references):\s*\[([^\]]*)\]', repl_fields_refs, inner)
        return f"@relation({inner})"

    return re.sub(r'@relation\(([^)]*)\)', repl_relation, rest)


def transform_index_attr(line: str) -> str:
    def repl_index(mm: re.Match) -> str:
        deco, fields_str = mm.group(1), mm.group(2)
        fields = [f.strip() for f in fields_str.split(",") if f.strip()]
        new_fields = []
        for f in fields:
            fm = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)(.*)$', f)
            if fm:
                new_fields.append(to_camel(fm.group(1)) + fm.group(2))
            else:
                new_fields.append(f)
        return f"@@{deco}([{', '.join(new_fields)}]"

    return re.sub(r'@@(index|unique|fulltext|id)\(\[([^\]]*)\]', repl_index, line)


def transform_field_line(line: str) -> str:
    m = re.match(r'^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s+)(\S+)(.*)$', line)
    if not m:
        return line
    indent, orig_name, sp, type_str, rest = m.groups()
    new_name = to_camel(orig_name)

    base, suffix, new_base = model_name_from_type(type_str)
    new_type = new_base + suffix

    is_relation = base in MODEL_MAP

    # @map seulement pour les champs scalaires (pas les champs relationnels)
    if is_relation:
        map_attr = ""
    else:
        map_attr = f' @map("{orig_name}")' if orig_name != new_name else ""

    new_rest = transform_relation_attr(rest)

    return f"{indent}{new_name}{sp}{new_type}{map_attr}{new_rest}"


def transform_schema():
    text = SCHEMA.read_text(encoding="utf-8")
    lines = text.splitlines()

    out_lines = []
    in_model = False
    current_model_orig = None
    current_body: list[str] = []

    def flush_model():
        nonlocal current_model_orig, current_body
        if current_model_orig is None:
            return
        has_map = any(ln.strip().startswith("@@map") for ln in current_body)
        if not has_map:
            current_body.insert(-1, f"  @@map(\"{current_model_orig}\")")
        out_lines.extend(current_body)
        current_model_orig = None
        current_body = []

    for line in lines:
        m = re.match(r'^(model\s+)([a-zA-Z_][a-zA-Z0-9_]*)(\s*\{.*)$', line)
        if m:
            flush_model()
            in_model = True
            current_model_orig = m.group(2)
            new_name = MODEL_MAP.get(current_model_orig, to_camel(current_model_orig))
            current_body.append(f"{m.group(1)}{new_name}{m.group(3)}")
            continue

        if in_model and line.strip() == "}":
            current_body.append(line)
            flush_model()
            in_model = False
            continue

        if in_model:
            stripped = line.strip()
            if stripped.startswith("@@"):
                line = transform_index_attr(line)
            elif stripped and not stripped.startswith("//"):
                line = transform_field_line(line)
            current_body.append(line)
        else:
            out_lines.append(line)

    flush_model()

    SCHEMA.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    print(f"Transformation terminée. Sauvegarde : {BACKUP}")


if __name__ == "__main__":
    transform_schema()
