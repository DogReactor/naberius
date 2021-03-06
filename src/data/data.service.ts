import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { readFile, writeFile } from 'fs-extra';

@Injectable()
export abstract class DataService<T> {
  data: T[];
  filePath: string;

  async read() {
    if (this.filePath) {
      try {
        this.data = JSON.parse(await readFile(this.filePath, 'utf-8'));
        this.data.forEach((d: any, index) => (d.index = index));
      } catch (err) {
        console.info(err, 'can be ignored');
        this.data = [];
      }
    } else {
      console.error('FilePath not set!');
      process.exit(1);
    }
  }

  async write() {
    if (this.filePath) {
      await writeFile(this.filePath, JSON.stringify(this.data));
    } else {
      console.error('FilePath not set!');
      process.exit(1);
    }
  }

  get _() {
    return _.chain(this.data);
  }
}
