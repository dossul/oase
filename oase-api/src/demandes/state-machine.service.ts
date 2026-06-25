import { Injectable, BadRequestException } from '@nestjs/common';
import { StatutDemande } from '../common/enums/generated';

export type TransitionAction =
  | 'soumettre'
  | 'prendre_en_charge'
  | 'demander_complement'
  | 'completer'
  | 'approuver'
  | 'rejeter'
  | 'archiver';

@Injectable()
export class StateMachineService {
  private readonly transitions: Record<StatutDemande, Partial<Record<TransitionAction, StatutDemande>>> = {
    [StatutDemande.BROUILLON]: {
      soumettre: StatutDemande.SOUMIS,
    },
    [StatutDemande.SOUMIS]: {
      prendre_en_charge: StatutDemande.EN_INSTRUCTION,
    },
    [StatutDemande.EN_INSTRUCTION]: {
      demander_complement: StatutDemande.ACTION_REQUISE,
      approuver: StatutDemande.APPROUVE,
      rejeter: StatutDemande.REJETE,
    },
    [StatutDemande.ACTION_REQUISE]: {
      completer: StatutDemande.EN_INSTRUCTION,
    },
    [StatutDemande.APPROUVE]: {
      archiver: StatutDemande.ARCHIVE,
    },
    [StatutDemande.REJETE]: {
      archiver: StatutDemande.ARCHIVE,
    },
    [StatutDemande.EXPIRE]: {},
    [StatutDemande.ARCHIVE]: {},
  };

  canTransition(from: StatutDemande, action: TransitionAction): boolean {
    return Boolean(this.transitions[from]?.[action]);
  }

  transition(from: StatutDemande, action: TransitionAction): StatutDemande {
    const to = this.transitions[from]?.[action];
    if (!to) {
      throw new BadRequestException({
        code: 'TRANSITION_INVALIDE',
        message: `Action '${action}' impossible depuis le statut '${from}'`,
      });
    }
    return to;
  }

  getAllowedActions(from: StatutDemande): TransitionAction[] {
    return Object.keys(this.transitions[from] || {}) as TransitionAction[];
  }
}
