import chalk from 'chalk';
import { existsSync, mkdirSync } from 'fs';

export function assureDirExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    console.log(chalk.yellow('Creating output directory...'));
    mkdirSync(dirPath);
    console.log('DONE');
  }
}
