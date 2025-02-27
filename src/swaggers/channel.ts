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
 * /channels:
 *   post:
 *     summary: Create a new channel
 *     tags: [Channel]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChannelCreate'
 *     responses:
 *       201:
 *         description: Channel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Failed to create channel
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Get all channels for a specific server
 *     tags: [Channel]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serverId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the server
 *     responses:
 *       200:
 *         description: List of channels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Channel'
 *       404:
 *         description: Server not found
 *       500:
 *         description: Failed to retrieve channels
 *
 * /channels/{id}:
 *   get:
 *     summary: Get a channel by ID
 *     tags: [Channel]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the channel
 *     responses:
 *       200:
 *         description: Channel data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       404:
 *         description: Channel not found
 *       500:
 *         description: Failed to retrieve channel
 *
 *   put:
 *     summary: Update a channel
 *     tags: [Channel]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the channel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChannelUpdate'
 *     responses:
 *       200:
 *         description: Channel updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       404:
 *         description: Channel not found
 *       500:
 *         description: Failed to update channel
 *
 *   delete:
 *     summary: Delete a channel
 *     tags: [Channel]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the channel
 *     responses:
 *       200:
 *         description: Channel deleted successfully
 *       404:
 *         description: Channel not found
 *       500:
 *         description: Failed to delete channel
 */

