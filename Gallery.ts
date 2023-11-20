import axios, { RawAxiosRequestHeaders } from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';

type ImageData = {
  url: string,
  name: string,
};

export class Gallery {
  albumId: string | undefined;
  maxItems = 0;
  url : string
  localDirectory: string;

  constructor(albumUrl: string, maxItems: number, localDirectory: string) {
    this.url = albumUrl;
    const match = albumUrl.match(/Album\/([0-9]+)\?/);
    if (match && match[1]) {
      this.albumId = match[1];
    }

    if (!this.albumId) {
      throw new Error('Invalid Gallery URL');
    }

    this.maxItems = maxItems;
    this.localDirectory = localDirectory;
  }

  async prepareHeaders() {
    console.log(chalk.yellow('Fetching gallery cookie...'));
    const response = await axios.get(this.url);

    if (response.status === 200) {
      console.log('DONE');
      return {Cookie: response.headers['set-cookie']};
    }
  }


  async fetchGalleryData(headers: Partial<RawAxiosRequestHeaders>): Promise<ImageData[]> {
    console.log(chalk.yellow('Downloading gallery data...'));
    const {status, data} = (await axios.post(
      'https://www.zonerama.com/JSON/FlowLayout_PhotosInAlbum?albumId=' + this.albumId,
      {startIndex: 0, count: this.maxItems + 1},
      {headers, responseType: 'json'},
    )) as {
      status: number, data: {
        items: {
          image?: string,
          height: number,
          width: number,
          photoId?: string,
        }[]
      }
    };

    if (status === 200) {
      console.log('DONE');

      return data.items.map(it => ({
        url: it.image ? it.image.replace('{height}', String(it.height)).replace('{width}', String(it.width)) : null,
        name: it.photoId ? (it.photoId + '.jpg') : null,
      })).filter(({name, url}) => name && url);
    } else {
      throw new Error('Invalid gallery json response');
    }
  }


  async downloadImages(headers: Record<string, any>, images: ImageData[]) {
    console.log(chalk.yellow('Downloading images...'));

    const downloads = images.map(({url, name}) => axios.get(url, {
        responseType: 'stream',
        headers,
      })
        .then((response) => {
          const localPath = this.localDirectory + '/' + name;
          const outputStream = fs.createWriteStream(localPath);
          response.data.pipe(outputStream);
          return new Promise((resolve, reject) => {
            outputStream.on('finish', resolve);
            outputStream.on('error', reject);
          })
        }),
    );
    await Promise.all(downloads);

    console.log(`${downloads.length} images saved to ${this.localDirectory}`);
  }

  async process() {
      const headers = await this.prepareHeaders();
      const images = await this.fetchGalleryData(headers);
      await this.downloadImages(headers, images);
  }
}
