import { IsOptional, IsString, Matches } from 'class-validator';

/**
 * DTO décision (approbation / rejet).
 * Le PIN n'est pas marqué @IsNotEmpty volontairement : les règles de blocage
 * (quota, dette fiscale…) doivent être évaluées AVANT le contrôle du PIN afin
 * de retourner 422 QUOTA_EPUISE même sur un corps vide. Le service impose
 * sa présence (400 PIN_REQUIS) une fois les blocages écartés.
 */
export class DecisionDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'pin doit être un code à 6 chiffres' })
  pin?: string;

  @IsOptional()
  @IsString()
  motif?: string;
}
