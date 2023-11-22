# Zonerama Gallery downloader
Download all images from gallery on [zonerama.com](https://zonerama.com) even when author forbids download.

## Installation
1. Requires node.js and yarn to be installed.
2. Download it using git `git clone git@github.com:jbazant/zonerama-downloader.git`.
3. Run `yarn install` (or `npm isntall` if you prefer) from inside the project directory.

## Usage
1. Run `yarn start` from inside the project directory.
2. Enter gallery url when prompted (e.g. `https://www.zonerama.com/username/Album/123456` or `https://www.zonerama.com/username/Album/123456?secret=ABC123` for private galeries).
3. Enter the password when prompted (if needed).

**OR**

1. Run `yarn start https://www.zonerama.com/username/Album/123456 your_pass`.

See `yarn start --help` for more options.

## Licence 
[MIT](./LICENSE)
