// DO NOT EDIT THIS FILE
// you want to edit config.js only

const { ALBUM_URL, MAX_ITEMS, LOCAL_DIRECTORY } = require('./config.js');
const { Gallery } = require('./Gallery');

const album = new Gallery(ALBUM_URL, MAX_ITEMS, LOCAL_DIRECTORY);
album.process();
