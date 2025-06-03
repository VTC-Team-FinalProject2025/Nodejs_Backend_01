import { Server, Socket } from "socket.io";
import { Database } from "firebase-admin/database";
import Chat1v1Repository from "../../repositories/chat1v1Repository";
import authWebSocketMiddleware from "../../middlewares/authWebSocket.middleware";
import NotificationRepository from "../../repositories/notificationRepository";
import UserRepository from "../../repositories/UserRepository";
import { decrypt, encrypt } from "../../helpers/Encryption";
import PQueue from "p-queue";
import { FileTypeDirectStatus } from "@prisma/client";

interface previewFiles {
  url: string;
  type: FileTypeDirectStatus;
}
interface SendMessage {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  replyMessage?: {
    replyMessageId: number | null;
    contentReply: string;
  };
  previewFiles?: previewFiles[] | null;
}

export class Chat1v1Controller {
  private readonly io: Server;
  private readonly db: Database;
  private readonly chat1v1Repo: Chat1v1Repository;
  private readonly notiRepo: NotificationRepository;
  private readonly userRepo: UserRepository;
  private readonly messageQueue: PQueue;

  constructor(
    io: Server,
    db: Database,
    chat1v1Repo: Chat1v1Repository,
    notiRepo: NotificationRepository,
    userRepo: UserRepository,
  ) {
    this.io = io;
    this.db = db;
    this.chat1v1Repo = chat1v1Repo;
    this.notiRepo = notiRepo;
    this.userRepo = userRepo;
    this.messageQueue = new PQueue({ concurrency: 1 });
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    const chatNamespace = this.io.of("/chat1v1");
    chatNamespace.use(authWebSocketMiddleware);
    chatNamespace.on("connect", async (socket: Socket) => {
      const userId = String(socket.data.userId);
      const chatWithUserId = String(
        socket.handshake.auth?.chatWithUserId || "",
      );

      if (!userId || !chatWithUserId) {
        console.log("❌ Connection rejected: Missing userId or chatWithUserId");
        socket.disconnect();
        return;
      }

      const sortedIds = [userId, chatWithUserId].sort();
      const chatRoomId = `chatRoom-${sortedIds[0]}-${sortedIds[1]}`;
      socket.join(chatRoomId);
      console.log(`✅ User ${userId} joined ${chatRoomId}`);

      const InformationChatWithUserId =
        await this.userRepo.getUserInformationById(Number(chatWithUserId));

      chatNamespace
        .to(chatRoomId)
        .emit("InformationChatWithUserId", InformationChatWithUserId);

      socket.on("sendMessage", async (messageData: SendMessage) => {
        this.messageQueue.add(async () => {
          const {
            id,
            senderId,
            receiverId,
            message,
            replyMessage,
            previewFiles,
          } = messageData;
          if (!senderId || !receiverId) return;
          if (!message && previewFiles?.length === 0) return;
          const encrypted = encrypt(message);

          const savedMessage = await this.chat1v1Repo.saveMessage(
            senderId,
            receiverId,
            String(encrypted),
          );
          let ArrayFile: Awaited<
            ReturnType<typeof this.chat1v1Repo.createFile>
          >[] = [];
          if (previewFiles && previewFiles?.length > 0) {
            previewFiles.forEach(async (file) => {
              const dataFile = await this.chat1v1Repo.createFile(
                Number(senderId),
                savedMessage.id,
                file.type,
                file.url,
              );
              ArrayFile.push(dataFile);
            });
          }

          if (replyMessage && replyMessage.replyMessageId !== null) {
            await this.chat1v1Repo.SaveReplyMessage(
              savedMessage.id,
              replyMessage.replyMessageId,
            );
          }
          const fullSavedMessage = await this.chat1v1Repo.getMessageById(
            savedMessage.id,
          );
          if (!fullSavedMessage) {
            console.log(`Không tìm thấy tin nhắn với ID: ${savedMessage.id}`);
            return;
          }
          const decryptedMessage = {
            ...fullSavedMessage,
            content: decrypt(fullSavedMessage.content),
            waitingId: id,
            FileMessages:
              ArrayFile.length > 0
                ? ArrayFile.map((file) => ({
                  userId: file.userId,
                  field: file.field,
                  fieldType: file.fieldType,
                  messageId: file.messageId,
                }))
                : null,
            RepliesReceived:
              fullSavedMessage.RepliesReceived.length > 0
                ? {
                  replyMessageId:
                    fullSavedMessage.RepliesReceived[0]?.replyMessageId ??
                    null,
                  ReplyMessage: {
                    id:
                      fullSavedMessage.RepliesReceived[0]?.ReplyMessage?.id ??
                      null,
                    content: fullSavedMessage.RepliesReceived[0]?.ReplyMessage
                      ?.content
                      ? decrypt(
                        fullSavedMessage.RepliesReceived[0].ReplyMessage
                          .content,
                      )
                      : null,
                    senderId:
                      fullSavedMessage.RepliesReceived[0]?.ReplyMessage
                        ?.senderId ?? null,
                  },
                }
                : null,
          };

          await this.notiRepo.sendPushNotification(
            receiverId,
            `${fullSavedMessage.Sender.loginName} đã gửi tin nhắn cho bạn`,
          );

          const receiverChats = await this.chat1v1Repo.ListRecentChats(
            receiverId,
          );
          this.io
            .to(`user-${receiverId}`)
            .emit("recentChatsList", receiverChats);

          chatNamespace.to(chatRoomId).emit("newMessage", decryptedMessage);
          ArrayFile = [];
        });
      });

      // Xác nhận đã đọc tin nhắn
      socket.on("markAsRead", async () => {
        await this.chat1v1Repo.markMessagesAsRead(
          Number(userId),
          Number(chatWithUserId),
        );
        this.io.to(`user-${Number(userId)}`).emit("messagesRead", { userId });
      });

      // Xử lý trạng thái "đang nhập"
      socket.on("typingStatus", ({ isTyping }) => {
        chatNamespace.to(chatRoomId).emit("userTyping", { userId, isTyping });
      });

      // Xử lý khi người dùng rời khỏi chat
      socket.on("disconnect", async () => {
        console.log(`❌ User ${userId} disconnected`);
      });

      socket.on("deleteMessage", async ({ messageId }) => {
        if (!messageId) return;

        const message = await this.chat1v1Repo.getMessageById(messageId);
        if (!message) return;

        // Chỉ cho phép sender xoá tin nhắn
        if (message.senderId !== Number(userId)) {
          console.log("❌ Không thể xoá tin nhắn của người khác");
          return;
        }

        await this.chat1v1Repo.deleteMessageById(messageId);

        chatNamespace.to(chatRoomId).emit("statusDeleMessage", message.id);
      });

      socket.on("hiddenMessage", async ({ messageId }) => {
        if (!messageId) return;

        const message = await this.chat1v1Repo.getMessageById(messageId);
        if (!message) return;

        await this.chat1v1Repo.SaveHiddenMessage(Number(userId), messageId);
        chatNamespace.to(chatRoomId).emit("statusHiddenMessage", message.id);
      });

      socket.on("IconMessage", async ({ messageId, icon }) => {
        if (!messageId || !icon) return;

        const IconMessage = await this.chat1v1Repo.SaveIconMessage(
          Number(userId),
          messageId,
          icon,
        );

        chatNamespace.to(chatRoomId).emit("dataIconMessage", IconMessage);
      });

      socket.on("UpdateIconMessage", async ({ id, newIcon }) => {
        if (!id || !newIcon) return;

        const getIconMessage = await this.chat1v1Repo.GetIconMessageId(
          Number(id),
        );
        if (!getIconMessage) return;

        const IconMessage = await this.chat1v1Repo.UpdateIconMessage(
          Number(userId),
          id,
          newIcon,
        );

        chatNamespace.to(chatRoomId).emit("dataUpdateIconMessage", IconMessage);
      });

      socket.on("DeleteIconMessage", async ({ id }) => {
        if (!id) return;

        const getIconMessage = await this.chat1v1Repo.GetIconMessageId(
          Number(id),
        );
        if (!getIconMessage) return;

        this.chat1v1Repo.DeleteIconMessageById(getIconMessage.id);

        chatNamespace.to(chatRoomId).emit("dataDeleteIconMessage", id);
      });
    });
  }
}