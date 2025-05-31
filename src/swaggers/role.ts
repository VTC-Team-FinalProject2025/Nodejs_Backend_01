/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - name
 *         - color
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the role
 *         name:
 *           type: string
 *           description: The name of the role
 *         color:
 *           type: string
 *           description: The color of the role
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the role was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the role was last updated
 *     Permission:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the permission
 *         name:
 *           type: string
 *           description: The name of the permission
 *         description:
 *           type: string
 *           description: The description of the permission
 */

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management API
 */

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - color
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 * 
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get a role by id
 *     tags: [Roles]
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
 *         description: Role details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 * 
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 * 
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
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
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/roles/{roleId}/permissions/{permissionId}:
 *   post:
 *     summary: Assign a permission to a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission assigned successfully
 *       404:
 *         description: Role or permission not found
 *       401:
 *         description: Unauthorized
 * 
 *   delete:
 *     summary: Remove a permission from a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission removed successfully
 *       404:
 *         description: Role or permission not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/roles/{roleId}/permissions:
 *   get:
 *     summary: Get all permissions of a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/roles/permissions/all:
 *   get:
 *     summary: Get all available permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permission'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/roles/assign:
 *   post:
 *     summary: Assign a role to a member
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - memberId
 *             properties:
 *               roleId:
 *                 type: integer
 *               memberId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       404:
 *         description: Role or member not found
 *       401:
 *         description: Unauthorized
 */ 