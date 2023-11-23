import inquirer from 'inquirer';

export async function getAlbumUrl(url: string) {
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

export async function getPassword() {
  const { albumPass } = await inquirer.prompt([
    {
      type: 'input',
      name: 'albumPass',
      message: 'Enter the password of the album:',
    },
  ]);

  return albumPass;
}
