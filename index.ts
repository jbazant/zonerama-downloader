import chalk from 'chalk';
import { Command } from 'commander';
import { existsSync, mkdirSync } from 'fs';
import { Gallery } from './Gallery.ts';
import inquirer from 'inquirer';

function assureDirExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    console.log(chalk.yellow('Creating output directory...'));
    mkdirSync(dirPath);
    console.log('DONE');
  }
}

async function getAlbumUrl(url: string) {
  if (url) {
    return url;
  }

  const { albumUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'albumUrl',
      message: 'Enter the url of the album:',
    },
  ]);

  return albumUrl;
}

async function getPassword() {
  const { albumPass } = await inquirer.prompt([
    {
      type: 'input',
      name: 'albumPass',
      message: 'Enter the password of the album:',
    },
  ]);

  return albumPass;
}

async function run(
  url: string,
  password: string | undefined,
  {
    maxItems,
    outDir,
  }: {
    maxItems: string;
    outDir: string;
  },
) {
  try {
    assureDirExists(outDir);

    const albumUrl = await getAlbumUrl(url);

    const album = new Gallery(albumUrl, parseInt(maxItems, 10), outDir);
    if (password) {
      album.setPassword(password);
    }

    try {
      await album.process();
    } catch (e: any) {
      if (e.name === 'AlbumLoadingError') {
        console.log(chalk.magenta('Album is probably protected by password!'));
        const password = await getPassword();
        if (password) {
          album.setPassword(password);
        }
        await album.process();
      } else {
        throw e;
      }
    }

    console.log(chalk.green('SUCCESS'));
  } catch (e: any) {
    console.error(chalk.red('Error: ') + e.message);
    process.exit(1);
  }
}

const program = new Command();

program
  .name('zonerama-downloader')
  .argument('[url]', 'url of the album')
  .argument('[password]', 'password of the album')
  .description('Download all images from Zonerama album')
  .option('-o, --out-dir <directory>', 'directory to save the images', './images')
  .option('-m, --max-items <number>', 'maximum number of images to download', '500')
  .action(run)
  .parse(process.argv);
