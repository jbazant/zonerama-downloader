const axios = require('axios');
const fs = require('fs');

class Gallery {
  albumId = null;
  maxItems = 0;
  url = '';
  localDirectory = './';

  constructor(albumUrl, maxItems, localDirectory) {
    this.url = albumUrl;
    this.albumId = this.url.match(/Album\/([0-9]+)\?/)[1];

    if (!this.albumId) {
      throw new Error('Invalid Gallery URL');
    }

    this.maxItems = maxItems;
    this.localDirectory = localDirectory;
  }

  async prepareHeaders() {
    console.log('Fetching gallery cookie');
    const response = await axios.get(this.url);

    if (response.status === 200) {
      console.log('done');
      return { Cookie: response.headers['set-cookie'] };
    }
  }


  async fetchGalleryData(headers) {
    console.log('Downloading gallery data');
    const { status, data } = await axios.post(
      'https://www.zonerama.com/JSON/FlowLayout_PhotosInAlbum?albumId=' + this.albumId,
      { startIndex: 0, count: this.maxItems + 1 },
      { headers, responseType: 'json' },
    );

    if (status === 200) {
      console.log('done');

      return data.items.map(it => ({
        url: it.image ? it.image.replace('{height}', it.height).replace('{width}', it.width) : null,
        name: it.photoId ? (it.photoId + '.jpg') : null,
      })).filter(({ name, url }) => name && url);
    } else {
      console.error('Invalid gallery json response', status, data);
      throw new Error('Invalid gallery json response');
    }
  }


  async downloadImages(headers, images) {
    console.log('Downloading images');

    const downloads = images.map(({ url, name }) => axios.get(url, {
        responseType: 'stream',
        headers,
      })
        .then((response) => {
          const localPath = this.localDirectory + '/' + name;
          response.data.pipe(fs.createWriteStream(localPath));
        }),
    );
    await Promise.all(downloads);

    console.log(`${downloads.length} images saved to ${this.localDirectory}`);
  }

  async process() {
    try {
      const headers = await this.prepareHeaders();
      const images = await this.fetchGalleryData(headers);
      await this.downloadImages(headers, images);
      console.log('SUCCESS');
    } catch (err) {
      console.log('FAIL!', err.message);
      throw err;
    }
  }
}

exports.Gallery = Gallery;