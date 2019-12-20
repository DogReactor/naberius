import { Module } from '@nestjs/common';
import { ConfigModule } from 'config/config.module';
import { DataModule } from 'data/data.module';
import { CardsResolver } from './cards.resolver';
import { SkillsResolver } from './skills.resolver';
import { SkillsWithTypeResolver } from './skillsWithType.resolver';
import { ClassesResolver } from './classes.resolver';
import { AbilitiesResolver } from './abilities.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardMeta } from 'data/models/cardMeta.model';

@Module({
  imports: [ConfigModule, DataModule, TypeOrmModule.forFeature([CardMeta])],
  providers: [
    CardsResolver,
    SkillsResolver,
    SkillsWithTypeResolver,
    AbilitiesResolver,
    ClassesResolver,
  ],
})
export class CardsModule {}
