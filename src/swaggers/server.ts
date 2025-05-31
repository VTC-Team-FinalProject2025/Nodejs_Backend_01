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
 * /api/servers:
 *   post:
 *     summary: Create a new server
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServerInput'
 *     responses:
 *       201:
 *         description: Server created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Server'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: Get all servers
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of servers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Server'
 *       401:
 *         description: Unauthorized
 *
 * /api/servers/{id}:
 *   get:
 *     summary: Get server by ID
 *     tags: [Servers]
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
 *         description: Server details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Server'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Server not found
 *   delete:
 *     summary: Delete server
 *     tags: [Servers]
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
 *         description: Server deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Server not found
 *   put:
 *     summary: Update server
 *     tags: [Servers]
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
 *             $ref: '#/components/schemas/UpdateServerInput'
 *     responses:
 *       200:
 *         description: Server updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Server'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Server not found
 *
 * /api/servers/join:
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
 * /api/servers/leave/{id}:
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
 * /api/servers/invite-token:
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
 *
 * /api/servers/{serverId}/members:
 *   get:
 *     summary: Get server members
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of server members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Server not found
 *   post:
 *     summary: Add member to server
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Server not found
 *
 * /api/servers/{serverId}/members/{userId}:
 *   delete:
 *     summary: Remove member from server
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Server or member not found
 */

