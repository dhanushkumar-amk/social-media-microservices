const logger = require('./logger');
const Cloudinary = require('../config/cloudinaryConfig')


// upload image on cloudinary
const uploadMediaToClodinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = Cloudinary.uploader.upload_stream(
            {
            resource_type : 'auto', // detect automatically file type
           },
            (error, result) => {
                if(error) {
                    logger.error("Error uploading file to Cloudinary", error);
                    reject(error);
                } else {
                    logger.info("File uploaded successfully to Cloudinary", result);
                    resolve(result);
                }
            })
            uploadStream.end(file.buffer);
    })
}

const deleteMediaFromCloudinary = async(publicId) => {
    try {
        const result  = await Cloudinary.uploader.destroy(publicId)
        logger.info("File deleted successfully from Cloudinary", result);
        return result
    } catch (error) {
        logger.error("error deleting media from cloudinary", error)
        throw error;
    }
}


module.exports = { uploadMediaToClodinary, deleteMediaFromCloudinary }
