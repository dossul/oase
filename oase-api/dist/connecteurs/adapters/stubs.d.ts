export declare const STUB_STATUTS_FISCAUX: Record<string, {
    statut: 'conforme' | 'dette_active' | 'inconnu';
    dette_fcfa?: number;
    raisonSociale: string;
}>;
export declare const STUB_DECLARATIONS_SYDONIA: {
    numero_declaration: string;
    nif_importateur: string;
    code_exoneration: string;
    montant_droits: number;
    date_declaration: string;
    bureau_douane: string;
    statut: string;
}[];
export declare const STUB_LIGNES_SIGFIP: {
    code_programme: string;
    code_action: string;
    libelle: string;
    dotation_initiale_fcfa: number;
    dotation_actuelle_fcfa: number;
    consomme_fcfa: number;
    taux_consommation_pct: number;
    exercice: number;
}[];
export declare const STUB_ECRITURES_GUDEF: {
    reference_oase: string;
    montantFcfa: number;
    nature: string;
    date_comptabilisation: string;
    journal: string;
    statut: string;
}[];
export declare const DEMO_SCENARIOS: {
    HAPPY_PATH: {
        sydonia: {
            latenceMs: number;
            succes: boolean;
        };
        etax: {
            latenceMs: number;
            succes: boolean;
        };
        sigfip: {
            latenceMs: number;
            succes: boolean;
        };
        gudef: {
            latenceMs: number;
            succes: boolean;
        };
        das: {
            latenceMs: number;
            succes: boolean;
        };
    };
    DEGRADED: {
        sydonia: {
            latenceMs: number;
            succes: boolean;
        };
        etax: {
            latenceMs: number;
            succes: boolean;
        };
        sigfip: {
            latenceMs: number;
            succes: boolean;
        };
        gudef: {
            latenceMs: number;
            succes: boolean;
            erreur: string;
        };
        das: {
            latenceMs: number;
            succes: boolean;
            erreur: string;
        };
    };
    DETTE_FISCALE: {
        nif: string;
        etax: {
            statut: string;
            dette_fcfa: number;
        };
        message: string;
    };
    QUOTA_EPUISE: {
        base_juridique: string;
        quota: {
            consomme: number;
            total: number;
            pct: number;
        };
        message: string;
    };
};
