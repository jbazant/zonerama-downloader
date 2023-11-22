import axios, { RawAxiosRequestHeaders } from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import { AlbumLoadingError } from './AlbumLoadingError.ts';

type ImageData = {
  url: string,
  name: string,
};

export class Gallery {
  private readonly albumId: string | undefined;
  private readonly domain: string;
  private password: string | undefined;
  private headers: Partial<RawAxiosRequestHeaders> | undefined;

  constructor(private readonly url: string, private readonly maxItems: number, private readonly localDirectory: string) {
    this.domain = url.match(/(https?:\/\/[^/]+)/)?.[1] || 'https://www.zonerama.com';
    const match = url.match(/Album\/([0-9]+)/);
    if (match && match[1]) {
      this.albumId = match[1];
    }

    if (!this.albumId || !this.domain) {
      throw new Error('Invalid Gallery URL');
    }
  }

  private async prepareHeaders() {
    const response = await axios.get(this.url);

    if (response.status === 200) {
      this.headers = {Cookie: response.headers['set-cookie']};
    }
  }

  private async fetchGalleryData(): Promise<ImageData[]> {
    const {status, data} = (await axios.post(
      'https://www.zonerama.com/JSON/FlowLayout_PhotosInAlbum?albumId=' + this.albumId,
      {startIndex: 0, count: this.maxItems},
      {headers: this.headers, responseType: 'json'},
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
      if (!data.items) {
        const responseData = JSON.stringify(data);
        const errorResponsePreview = responseData.length > 200 ? (responseData.substring(0, 200) + '...') : responseData;
        throw new AlbumLoadingError('Invalid gallery json response: ' + errorResponsePreview);
      }

      return data.items.map(it => ({
        url: it.image ? it.image.replace('{height}', String(it.height)).replace('{width}', String(it.width)) : null,
        name: it.photoId ? (it.photoId + '.jpg') : null,
      })).filter(({name, url}) => name && url);
    } else {
      throw new Error('Unable to fetch gallery data. Response status: ' + status);
    }
  }


  private async downloadImages(images: ImageData[]) {

    const downloads = images.map(({url, name}) => axios.get(url, {
        responseType: 'stream',
        headers: this.headers,
      })
        .then((response) => {
          const localPath = this.localDirectory + '/' + name;
          const outputStream = fs.createWriteStream(localPath);
          response.data.pipe(outputStream);
          return new Promise((resolve, reject) => {
            outputStream.on('finish', resolve);
            outputStream.on('error', reject);
          });
        }),
    );
    await Promise.all(downloads);

    return downloads.length;

  }

  private async unlockAlbum() {
    const {status} = await axios.post(this.domain + '/Web/UnlockAlbum', {value: this.password}, {
      headers: this.headers,
      params: {ID: this.albumId},
    });

    if (status !== 200) {
      throw new Error('Unable to unlock album. Response status: ' + status);
    }
  }

  public async process() {
    if (!this.headers) {
      console.log(chalk.yellow('Fetching gallery cookie...'));
      await this.prepareHeaders();
      console.log('DONE');
    }

    if (this.password) {
      console.log(chalk.yellow('Unlocking album...'));
      await this.unlockAlbum();
      console.log('DONE');
    }

    console.log(chalk.yellow('Downloading gallery data...'));
    const images = await this.fetchGalleryData();
    console.log('DONE');

    console.log(chalk.yellow('Downloading images...'));
    const imagesDownloaded = await this.downloadImages(images);
    console.log(`${imagesDownloaded} images saved to ${this.localDirectory}`);
  }


  public setPassword(value: string | undefined) {
    this.password = value;
  }
}
