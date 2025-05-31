/**
 * @swagger
 * components:
 *   schemas:
 *     Story:
 *       type: object
 *       required:
 *         - content
 *         - userId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the story
 *         content:
 *           type: string
 *           description: The content of the story
 *         userId:
 *           type: integer
 *           description: The ID of the user who created the story
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the story was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the story was last updated
 *     StoryView:
 *       type: object
 *       required:
 *         - storyId
 *         - userId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the story view
 *         storyId:
 *           type: integer
 *           description: The ID of the story
 *         userId:
 *           type: integer
 *           description: The ID of the user who viewed the story
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the story was viewed
 *     StoryReaction:
 *       type: object
 *       required:
 *         - storyId
 *         - userId
 *         - type
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the reaction
 *         storyId:
 *           type: integer
 *           description: The ID of the story
 *         userId:
 *           type: integer
 *           description: The ID of the user who reacted
 *         type:
 *           type: string
 *           description: The type of reaction
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the reaction was created
 */

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: Story management API
 */

/**
 * @swagger
 * /api/stories:
 *   post:
 *     summary: Create a new story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Story created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 * 
 *   get:
 *     summary: Get all stories
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Story'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/stories/{id}/view:
 *   post:
 *     summary: Mark a story as viewed
 *     tags: [Stories]
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
 *         description: Story marked as viewed successfully
 *       404:
 *         description: Story not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/stories/{id}/views:
 *   get:
 *     summary: Get all views of a story
 *     tags: [Stories]
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
 *         description: List of story views
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StoryView'
 *       404:
 *         description: Story not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/stories/{id}:
 *   delete:
 *     summary: Delete a story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Story deleted successfully
 *       404:
 *         description: Story not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/stories/{id}/reactions:
 *   post:
 *     summary: Add a reaction to a story
 *     tags: [Stories]
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
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reaction added successfully
 *       404:
 *         description: Story not found
 *       401:
 *         description: Unauthorized
 */ 