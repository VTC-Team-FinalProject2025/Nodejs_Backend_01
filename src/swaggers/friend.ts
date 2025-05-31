/**
 * @swagger
 * components:
 *   schemas:
 *     MakeFriendRequest:
 *       type: object
 *       required:
 *         - receiverId
 *       properties:
 *         receiverId:
 *           type: number
 *           description: ID của người nhận yêu cầu kết bạn
 *     AcceptFriendRequest:
 *       type: object
 *       required:
 *         - senderId
 *       properties:
 *         senderId:
 *           type: number
 *           description: ID của người gửi yêu cầu kết bạn
 *     FriendAction:
 *       type: object
 *       required:
 *         - senderId
 *       properties:
 *         senderId:
 *           type: number
 *           description: ID của người cần thực hiện hành động (xác nhận, hủy, chặn, mở chặn)
 *     Friend:
 *       type: object
 *       required:
 *         - userId1
 *         - userId2
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the friendship
 *         userId1:
 *           type: integer
 *           description: The ID of the first user
 *         userId2:
 *           type: integer
 *           description: The ID of the second user
 *         status:
 *           type: string
 *           enum: [PENDING, ACCEPTED, BLOCKED]
 *           description: The status of the friendship
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the friendship was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the friendship was last updated
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: Friend management API
 */

/**
 * @swagger
 * /api/friend/make-friend:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/accept-friend:
 *   put:
 *     summary: Accept a friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Friend request accepted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/block-friend:
 *   put:
 *     summary: Block a friend
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Friend blocked successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/lists-friend:
 *   get:
 *     summary: Get list of friends
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friends
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Friend'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/friend-request-list:
 *   get:
 *     summary: Get list of friend requests
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friend requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Friend'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/list-friend-online:
 *   get:
 *     summary: Get list of online friends
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of online friends
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Friend'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/list-friend-block:
 *   get:
 *     summary: Get list of blocked friends
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blocked friends
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Friend'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/list-friend-suggestions:
 *   get:
 *     summary: Get friend suggestions
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friend suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Friend'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/search-friend:
 *   get:
 *     summary: Search for friends
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Friend'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/cancel-friend:
 *   delete:
 *     summary: Cancel a friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Friend request cancelled successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/unfriend:
 *   delete:
 *     summary: Remove a friend
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Friend removed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/unblock:
 *   delete:
 *     summary: Unblock a friend
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Friend unblocked successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/friend/get-call-token:
 *   get:
 *     summary: Get call token
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Call token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
