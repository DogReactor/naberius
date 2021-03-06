import { Injectable } from '@nestjs/common';
import { ParsedConfigService } from 'config/config.service';
import { RequestService } from 'common/request.service';
import { join } from 'path';
import { writeFile, pathExists, readFile } from 'fs-extra';
import { Enemy } from './models/enemy.model';
import { Repository } from 'typeorm';
import { File } from './models/file.model';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EnemyService {
  private cache: { [MissionID: number]: Enemy[] } = {};
  constructor(
    @InjectRepository(File)
    private readonly files: Repository<File>,
    private readonly request: RequestService,
    private readonly config: ParsedConfigService,
  ) {}

  async get(MissionID: number): Promise<Enemy[]> {
    if (this.cache[MissionID]) {
      return this.cache[MissionID];
    }
    const fileName = `Enemy${MissionID}.atb`;
    const filePath = join(this.config.get('ENEMY_DIR'), MissionID + '.json');
    if (!(await pathExists(filePath))) {
      const file = await this.files.findOne({ Name: fileName });
      if (!file) {
        throw Error(`File ${fileName} not found!`);
      }
      const data = await this.request.requestALTB(file.Name);
      if (data !== true) {
        await writeFile(filePath, JSON.stringify(data));
      }
    }

    return (this.cache[MissionID] = JSON.parse(
      await readFile(filePath, 'utf-8'),
    ));
  }

  async update() {
    this.cache = []
  }
}
