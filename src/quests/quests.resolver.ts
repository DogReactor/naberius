import {
  Resolver,
  Query,
  Args,
  ResolveProperty,
  Parent,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { DataFileService } from 'data/dataFile.service';
import { Quest } from 'data/models/quest.model';
import { Int } from 'type-graphql';
import { Mission } from 'data/models/missionConfig.model';
import { MissionConfigService } from 'data/missionConfig.service';
import { QuestNameTextService } from 'data/questNameText.service';
import { MessageTextService } from 'data/messageText.service';
import { EventArcService } from 'data/eventArc.service';
import { EventArc } from 'data/models/eventArc.model';
import { Map } from 'data/models/map.model';
import { MapService } from 'data/map.service';
import { QuestEventText } from 'data/models/questEventText.model';
import { CacheFileService } from 'data/cacheFile.service';
import { QuestTermConfig } from 'data/models/questTermConfig.model';
import { Message } from 'data/models/message.model';

@Resolver(Quest)
export class QuestsResolver {
  constructor(
    @Inject('QuestList') private readonly questList: DataFileService<Quest>,
    private readonly missionConfigs: MissionConfigService,
    private readonly questNameTexts: QuestNameTextService,
    private readonly messageTexts: MessageTextService,
    @Inject('MessageText')
    private readonly generalMessageTexts: CacheFileService<Message>,
    private readonly eventArcs: EventArcService,
    private readonly maps: MapService,
    @Inject('QuestEventText')
    private readonly questEventTexts: CacheFileService<QuestEventText>,
    @Inject('QuestTermConfig')
    private readonly questTermConfigs: CacheFileService<QuestTermConfig>,
  ) {}

  @ResolveProperty(type => Mission, { nullable: true })
  Mission(@Parent() quest: Quest) {
    return this.missionConfigs.getMissionByQuestID(quest.QuestID);
  }

  @ResolveProperty(type => String, { nullable: true })
  async Name(@Parent() quest: Quest) {
    const mission = this.Mission(quest);
    if (mission) {
      const texts = await this.questNameTexts.get(mission.MissionID);
      if (texts) {
        return texts[quest.QuestTitle].Message;
      }
    }
  }

  @ResolveProperty(type => String, { nullable: true })
  async Message(@Parent() quest: Quest) {
    const mission = this.Mission(quest);
    if (mission) {
      const texts = await this.messageTexts.get(mission.MissionID);
      if (texts) {
        return texts[Math.min(quest.QuestTitle, texts.length - 1)].Message;
      }
    }
  }

  @ResolveProperty(type => [EventArc], { nullable: true })
  async EventArcs(@Parent() quest: Quest) {
    return this.eventArcs.get(quest.QuestID);
  }

  @ResolveProperty(type => Map, { nullable: true })
  async Map(@Parent() quest: Quest) {
    if (quest.MapNo >= 1000) {
      return this.maps.get(quest.MapNo);
    } else {
      const mission = this.Mission(quest);
      if (mission) {
        return this.maps.get(quest.MapNo, mission.MissionID);
      }
    }
  }

  @ResolveProperty(type => [QuestTermConfig])
  QuestTermConfigs(@Parent() quest: Quest) {
    if (quest.QuestTerms === 0) {
      return [];
    }
    let index = this.questTermConfigs.data.findIndex(
      qtc => qtc.ID_Config === quest.QuestTerms,
    );

    const configs: QuestTermConfig[] = [];
    if (index !== -1) {
      let config: QuestTermConfig;
      while (true) {
        config = this.questTermConfigs.data[index++];
        if (
          !(
            config &&
            (config.ID_Config === 0 || config.ID_Config === quest.QuestTerms)
          )
        ) {
          break;
        }
        configs.push(config);
      }
    }
    return configs;
  }

  @ResolveProperty(type => [QuestTermConfig])
  QuestHardTermConfigs(@Parent() quest: Quest) {
    return this.QuestTermConfigs({ QuestTerms: quest._HardCondition } as Quest);
  }

  @ResolveProperty(type => String, { nullable: true })
  HardInfomation(@Parent() quest: Quest) {
    if (quest._HardCondition) {
      return this.generalMessageTexts.data[quest._HardInfomation].Message;
    }
  }

  @Query(returns => Quest, { nullable: true })
  Quest(@Args({ name: 'QuestID', type: () => Int }) QuestID: number) {
    return this.questList.data.find(quest => quest.QuestID === QuestID);
  }

  @Query(returns => [QuestEventText])
  QuestEventTexts() {
    return this.questEventTexts.data;
  }
}
