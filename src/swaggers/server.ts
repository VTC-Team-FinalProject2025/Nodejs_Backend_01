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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the server
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
 *
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the server
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
 */

