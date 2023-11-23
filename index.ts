import chalk from 'chalk';
import { Command } from 'commander';
import { assureDirExists } from './src/fsUtils.ts';
import { Gallery } from './src/Gallery.ts';
import { getAlbumUrl, getPassword } from './src/inquirerUtils.ts';

type OptionsShape = {
  maxItems: string;
  outDir: string;
};

async function processAlbum(album: Gallery) {
  try {
    await album.process();
  } catch (e: any) {
    if (e.name === 'AlbumLoadingError') {
      console.log(chalk.magenta('Album is probably protected by password!'));

      const albumPass = await getPassword();
      if (albumPass) {
        album.setPassword(albumPass);
      }

      await album.process();
    } else {
      throw e;
    }
  }
}

async function run(url: string | undefined, password: string | undefined, { maxItems, outDir }: OptionsShape) {
  try {
    assureDirExists(outDir);

    const albumUrl = await getAlbumUrl(url);

    const album = new Gallery(albumUrl, parseInt(maxItems, 10), outDir);
    if (password) {
      album.setPassword(password);
    }

    await processAlbum(album);
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
