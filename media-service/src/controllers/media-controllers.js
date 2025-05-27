const Media = require('../models/media ');
const { uploadMediaToClodinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');

const uploadMedia = async (req, res) => {
    logger.info("Starting media upload..");
    try {
        if (!req.file) {
            logger.error("No file found, please add a file");
            return res.status(400).json({
                success: false,
                message: "File not found... please add file"
            });
        }

        // Correct field names from Multer
        const originalName = req.file.originalname;
        const fileType = req.file.mimetype;
        const userId = req.user.userId;

        logger.info(`File details: name = ${originalName}, type = ${fileType}`);
        logger.info("Uploading to Cloudinary start...");

        // Upload to Cloudinary
        const cloudinaryUploadResult = await uploadMediaToClodinary(req.file);
        logger.info(`Uploading to Cloudinary completed successfully, public id = ${cloudinaryUploadResult.public_id}`);

        // Create media record
        const newlyCreatedMedia = new Media({
            publicId: cloudinaryUploadResult.public_id,
            originalName: originalName,
            fileType: fileType,
            url: cloudinaryUploadResult.secure_url,
            userId
        });

        await newlyCreatedMedia.save();

        return res.status(201).json({
            success: true,
            mediaId: newlyCreatedMedia._id,
            url: newlyCreatedMedia.url,
            message: "Media upload is successful..."
        });

    } catch (error) {
        logger.error("Upload media error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getAllMedia = async(req, res) => {
    try {
        const result = await Media.find({})
        res.json({result})
    } catch (error) {
logger.error(" error frtching media", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = { uploadMedia, getAllMedia };
