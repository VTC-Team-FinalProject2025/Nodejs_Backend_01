/**
 * @swagger
 * components:
 *   schemas:
 *     UploadResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         imageUrl:
 *           type: string
 *           description: URL of the uploaded file
 */

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload API
 */

/**
 * @swagger
 * /api/upload/upload:
 *   post:
 *     summary: Upload an image file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *               folderName:
 *                 type: string
 *                 description: Optional folder name to store the file
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/upload/upload-media:
 *   post:
 *     summary: Upload a media file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - media
 *               - folderName
 *             properties:
 *               media:
 *                 type: string
 *                 format: binary
 *                 description: The media file to upload
 *               folderName:
 *                 type: string
 *                 description: Folder name to store the file
 *     responses:
 *       200:
 *         description: Media file uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file uploaded or missing folder name
 *       401:
 *         description: Unauthorized
 */
