export class AlbumLoadingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlbumLoadingError';
  }
}
