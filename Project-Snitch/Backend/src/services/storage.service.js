import ImageKit from '@imagekit/nodejs';
import {config} from '../config/config.js';

const client = new ImageKit({
  privateKey: config.IMAGEKIT_PRIVATE_KEY, 
  publicKey: config.IMAGEKIT_PUBLIC_KEY
});

export async function uploadFile({buffer, fileName, folder='snitch'}) {
  try {
    const result = await client.file.upload({
        file: await ImageKit.toFile(buffer),
        fileName,
        folder
    });
    return result;
  }
    catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}


