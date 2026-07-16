const {ImageKit} = require ('@imagekit/nodejs');

const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

async function uploadFile(buffer) {
    const response = await imagekit.files.upload({
        file: buffer.toString('base64'),
        fileName: 'uploaded_image.jpg'
    });
    return response;
}
module.exports =  uploadFile ;