import { ArrayMinSize, IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const CHANNELS = ['EMAIL', 'SMS', 'IN_APP'] as const;

export class CreateNotificationTemplateRequestDto {
  @IsString() @MinLength(1) @MaxLength(100) templateKey!: string;
  @IsIn(CHANNELS) channel!: (typeof CHANNELS)[number];
  @IsString() @MinLength(2) @MaxLength(10) locale!: string;
  @IsOptional() @IsString() @MaxLength(200) subject?: string;
  @IsString() @MinLength(1) body!: string;
  @IsArray() @ArrayMinSize(0) @IsString({ each: true }) variableSchema!: string[];
  @IsOptional() @IsString() classification?: string;
}

export class PreviewNotificationTemplateRequestDto {
  @IsOptional() @IsObject() payload?: Record<string, unknown>;
}
