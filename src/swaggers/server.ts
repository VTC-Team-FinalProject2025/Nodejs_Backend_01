/**
 * @swagger
 * components:
 *   schemas:
 *     Server:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the server
 *         name:
 *           type: string
 *           description: Name of the server
 *         ownerId:
 *           type: integer
 *           description: ID of the server owner
 *     InviteLink:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Unique invite token
 *         serverId:
 *           type: integer
 *           description: ID of the server
 *         expireIn:
 *           type: string
 *           description: Expiration time of the invite link
 *         count:
 *           type: integer
 *           description: Number of allowed uses
 * 
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * /servers:
 *   post:
 *     summary: Create a new server
 *     tags: [Server]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the server
 *               icon:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Server created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Server'
 *       400:
 *         description: Failed to create server
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Get servers for the authenticated user
 *     tags: [Server]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of servers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Server'
 *       500:
 *         description: Failed to retrieve servers
 *
 * /servers/{id}:
 *   get:
 *     summary: Get server by ID
 *     tags: [Server]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the server
 *     responses:
 *       200:
 *         description: Server details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Server'
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Server not found
 *       500:
 *         description: Failed to retrieve server
 *   delete:
 *     summary: Delete server
 *     tags: [Server]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the server
 *     responses:
 *       200:
 *         description: Server deleted successfully
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Server not found
 *       500:
 *         description: Failed to delete server
 *   put:
 *     summary: Update server
 *     tags: [Server]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the server
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the server
 *               icon:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Server updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Server'
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Server not found
 *       500:
 *         description: Failed to update server
 *
 * /servers/join:
 *   post:
 *     summary: Join a server using an invite token
 *     tags: [Server]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Invite token
 *     responses:
 *       200:
 *         description: Successfully joined the server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Server'
 *       400:
 *         description: Invalid token or server invite link
 *       500:
 *         description: Internal server error
 *
 * /servers/leave/{id}:
 *   post:
 *     summary: Leave a server
 *     tags: [Server]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the server to leave
 *     responses:
 *       200:
 *         description: Left server successfully
 *       403:
 *         description: Owner cannot leave the server
 *       404:
 *         description: Server not found
 *       500:
 *         description: Failed to leave server
 *
 * /servers/invite-token:
 *   post:
 *     summary: Create an invite link for a server
 *     tags: [Server]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serverId
 *               - count
 *               - expireIn
 *             properties:
 *               serverId:
 *                 type: integer
 *                 description: ID of the server
 *               count:
 *                 type: integer
 *                 description: Number of allowed uses
 *               expireIn:
 *                 type: string
 *                 description: Expiration time of the invite link
 *     responses:
 *       200:
 *         description: Invite link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InviteLink'
 *       403:
 *         description: Unauthorized action
 *       404:
 *         description: Server not found
 *       500:
 *         description: Failed to create invite link
 */

