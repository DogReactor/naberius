import { Injectable } from '@nestjs/common';
import * as request from 'request-promise-native';
import { parseAL } from 'aigis-fuel';
import { sleep } from './utils';
import { ConfigService } from 'config/config.service';

@Injectable()
export class RequestService {
  // the number of files downloading now
  private downloadNum = 0;

  constructor(private readonly config: ConfigService) {}

  async requestFile(fileURL: string, fileName: string) {
    while (true) {
      if (this.downloadNum < 10) {
        break;
      }
      await sleep(1000);
    }
    this.downloadNum += 1;
    console.info(`+${this.downloadNum} Downloading ${fileName}`);
    for (let retry = 1; retry <= 3; retry++) {
      try {
        const res = await request.get({
          url: this.config.get('ASSETS_BASE_URL') + fileURL,
          encoding: null,
          timeout: 50 * 1000,
          proxy: process.env.proxy,
          gzip: true,
          family: 4,
        });
        console.info(`-${this.downloadNum} Downloaded ${fileName}!`);
        this.downloadNum -= 1;
        return res;
      } catch (err) {
        console.error(err.stack);
        console.info(
          `=${this.downloadNum} Failed downloading ${fileName}, retry ${retry}...`,
        );
      }
    }
    console.error(`-${this.downloadNum} Failed downloading ${fileName}!`);
    this.downloadNum -= 1;
    throw Error('Download Failed!');
  }

  async requestALTB(fileUrl: string, fileName: string) {
    return this.requestFile(fileUrl, fileName).then(res => {
      const table = parseAL(res);
      return table.Contents;
    });
  }
}
