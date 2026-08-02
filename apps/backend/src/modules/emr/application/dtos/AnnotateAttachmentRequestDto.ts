import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class AnnotateAttachmentRequestDto {
  @IsString() @MaxLength(30) shape!: string;
  @IsNumber() positionX!: number;
  @IsNumber() positionY!: number;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() @MaxLength(2000) text?: string;
}
