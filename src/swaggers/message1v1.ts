/**
 * @swagger
 * components:
 *   schemas:
 *     Chat1v1:
 *       type: object
 *       required:
 *         - userId1
 *         - userId2
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the chat
 *         userId1:
 *           type: integer
 *           description: The ID of the first user
 *         userId2:
 *           type: integer
 *           description: The ID of the second user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the chat was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the chat was last updated
 *     Message1v1:
 *       type: object
 *       required:
 *         - chatId
 *         - senderId
 *         - content
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the message
 *         chatId:
 *           type: integer
 *           description: The ID of the chat
 *         senderId:
 *           type: integer
 *           description: The ID of the sender
 *         content:
 *           type: string
 *           description: The content of the message
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the message was sent
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the message was last updated
 */

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: 1v1 Message management API
 */

/**
 * @swagger
 * /api/chat1v1/list-recent-chats:
 *   get:
 *     summary: Get list of recent chats
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent chats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat1v1'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/chat1v1/list-chats:
 *   get:
 *     summary: Get list of all chats
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all chats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat1v1'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/chat1v1/file:
 *   get:
 *     summary: Get chat images
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of chat images
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uri
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 */ 