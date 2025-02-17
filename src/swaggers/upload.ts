/**
 * @swagger
 * components:
 *   schemas:
 *     UploadFileInput:
 *       type: object
 *       required:
 *         - file
 *         - folderName
 *       properties:
 *         file:
 *           type: string
 *           format: binary
 *           description: Ảnh cần upload
 *         folderName:
 *           type: string
 *           description: Tên thư mục lưu ảnh trên Firebase
 *
 * /files/upload:
 *   post:
 *     summary: Upload tệp lên Firebase Storage
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UploadFileInput'
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tải ảnh lên thành công!"
 *                 imageUrl:
 *                   type: string
 *                   example: "https://storage.googleapis.com/your-bucket/user-avatars/1692798001234.jpg"
 *       400:
 *         description: File không hợp lệ hoặc vượt quá dung lượng 5MB
 *       500:
 *         description: Internal Server Error
 */
