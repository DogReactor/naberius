import * as fs from 'fs-extra';
import * as path from 'path';
import { parseAL } from 'aigis-fuel';
import * as dbs from '../dataFiles';
import { MAP_DIR, BASE_URL } from '../../consts';
import { requestFile, numberPadding } from '../utils';
import { grabEnemy } from './EnemyConnector';
import _ = require('lodash');

export default async (MapID: number, MissionId?: number) => {
  const mapStr = numberPadding(MapID, 4);
  const _filename = MissionId ? `Map${MissionId}_${mapStr}` : `Map${mapStr}`;
  const filename = `${_filename}.aar`;

  const filePath = path.join(MAP_DIR, `${mapStr}.json`);
  fs.ensureDirSync(MAP_DIR);
  const exist = fs.existsSync(filePath);
  if (!exist) {
    const mapAR = parseAL(await requestFile(filename));

    const map: {
      Entries: any[];
      Locations: any[];
      Routes: any[];
      Enemies: any;
      MapID: number;
      Image: string;
    } = {
      Entries: [],
      Locations: [],
      Enemies: null,
      Routes: [],
      MapID,
      Image: '',
    };

    // get iamge
    const mapImgFile = _.find(dbs.fileList.data, {
      Name: `${_filename}.png`,
    }) as any;
    if (mapImgFile) {
      map.Image = BASE_URL + mapImgFile.Link;
    }

    for (const file of mapAR.Files) {
      const entryFilename: string = file.Name;
      const data = file.Content;

      if (entryFilename.includes('Entry')) {
        const match = /Entry(\d+)/.exec(entryFilename);
        if (match) {
          map.Entries.push({
            Entries: data.Contents,
            EntryID: Number.parseInt(match[1], 10),
          });
        }
      } else if (entryFilename.includes('Location')) {
        const match = /Location(\d+)/.exec(entryFilename);
        if (match) {
          map.Locations.push({
            Locations: data.Contents,
            LocationID: Number.parseInt(match[1], 10),
          });
        }
      } else if (entryFilename.includes('Route')) {
        const match = /Route(\d+)/.exec(entryFilename);
        if (match) {
          map.Routes.push({
            Routes: data.Contents.map((route: any) => {
              const routeWithoutAt: any = {};
              Object.keys(route).forEach(key => {
                routeWithoutAt[key.replace('@', '')] = route[key];
              });
              return routeWithoutAt;
            }),
            RouteID: Number.parseInt(match[1], 10),
          });
        }
      } else if (entryFilename.includes('Enemy')) {
        map.Enemies = data.Contents;
        await Promise.all(map.Enemies.map((enemy: any) => grabEnemy(enemy)));
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(map));
    return map;
  } else {
    return JSON.parse(
      fs.readFileSync(filePath, {
        encoding: 'utf-8',
      }),
    );
  }
};
