import { IsString, IsOptional, IsIn } from 'class-validator';
import { RangPiece } from '../../common/enums/generated';

export class UploadPieceJointeDto {
  @IsString()
  @IsIn(Object.values(RangPiece))
  rangCode: RangPiece;

  @IsString()
  @IsOptional()
  categorie?: string = 'document';

  @IsString()
  @IsOptional()
  typeDocumentCode?: string;
}
