/**
 * @swagger
 * components:
 *   schemas:
 *     Channel:
 *       type: object
 *       required:
 *         - name
 *         - serverId
 *         - type
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the channel
 *         name:
 *           type: string
 *           description: Name of the channel
 *         serverId:
 *           type: integer
 *           description: ID of the server the channel belongs to
 *         type:
 *           type: string
 *           enum: [meet, chat]
 *           description: Type of the channel
 *         password:
 *           type: string
 *           description: Optional password for the channel
 *     ChannelCreate:
 *       type: object
 *       required:
 *         - name
 *         - serverId
 *         - type
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the channel
 *         serverId:
 *           type: integer
 *           description: ID of the server the channel belongs to
 *         type:
 *           type: string
 *           enum: [meet, chat]
 *           description: Type of the channel
 *         password:
 *           type: string
 *           description: Optional password for the channel
 *     ChannelUpdate:
 *       type: object
 *       required:
 *         - name
 *         - serverId
 *         - type
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the channel
 *         password:
 *           type: string
 *           description: Optional password for the channel
 *
 * /api/channels:
 *   post:
 *     summary: Create a new channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChannelInput'
 *     responses:
 *       201:
 *         description: Channel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: Get all channels
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of channels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Channel'
 *       401:
 *         description: Unauthorized
 *
 * /api/channels/{id}:
 *   get:
 *     summary: Get channel by ID
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Channel details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Channel not found
 *
 *   put:
 *     summary: Update channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateChannelInput'
 *     responses:
 *       200:
 *         description: Channel updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Channel not found
 *
 *   delete:
 *     summary: Delete channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Channel deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Channel not found
 *
 * /api/channels/{channelId}/messages:
 *   get:
 *     summary: Get channel messages
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Channel not found
 *
 *   post:
 *     summary: Send message to channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMessageInput'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Channel not found
 */

