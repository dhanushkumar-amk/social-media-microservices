const Media = require('../models/media ');
const { deleteMediaFromCloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');

const handlePostDeleted = async(event) => {
    console.log(event, "some unique for identifications \n");

    const { postId, mediaIds } = event;
    try {

        const mediaToDelete = await Media.find({_id : {$in: mediaIds}});

        for (const media of mediaToDelete) {
            await deleteMediaFromCloudinary(media.publicId);
            await Media.findByIdAndDelete(media._id)
            logger.info(`Media with ID ${media._id} deleted successfully`);
        }
        logger.info("process deletion of the post is successfully")

    } catch (error) {
        logger.error(`Error while handling post deleted event: ${error.message}`);
    }


}

module.exports = {handlePostDeleted}
