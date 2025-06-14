import { Server, Socket } from "socket.io";
import authWebSocketMiddleware from "../../middlewares/authWebSocket.middleware";
import ChatChannelRepository from "../../repositories/chatChannelRepository";
import NotificationRepository from "../../repositories/notificationRepository";
import { decrypt, encrypt } from "../../helpers/Encryption";
import PQueue from "p-queue";
import { TypeStatus, FileTypeStatus } from "@prisma/client";

interface previewFiles {
  url: string;
  type: FileTypeStatus;
}

interface ListUserChannel {
  id: number;
  loginName: string;
  avatarUrl: string | null;
}

interface InformationChannel {
  name: string;
  id: number;
  createdAt: Date;
  serverId: number;
  type: TypeStatus;
  password: string | null;
}

interface SendMessage {
  id: number;
  message: string;
  replyMessage?: {
    replyMessageId: number | null;
    contentReply: string;
  };
  previewFiles?: previewFiles[] | null;
}

export class ChatChannelController {
  private readonly io: Server;
  private readonly chatChanelRepo: ChatChannelRepository;
  private readonly notiRepo: NotificationRepository;
  private readonly messageQueue: PQueue;
  private ListUserChannel: ListUserChannel[] = [];
  private InformationChannel!: InformationChannel;
  private InformationUser!: ListUserChannel | null;

  constructor(
    io: Server,
    chatChanelRepo: ChatChannelRepository,
    notiRepo: NotificationRepository,
  ) {
    this.io = io;
    this.chatChanelRepo = chatChanelRepo;
    (this.notiRepo = notiRepo),
      (this.messageQueue = new PQueue({ concurrency: 1 }));
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    const chatNamespace = this.io.of("/chat-channel");
    chatNamespace.use(authWebSocketMiddleware);
    chatNamespace.on("connect", async (socket: Socket) => {
      const userId = String(socket.data.userId);
      const channelId = String(socket.handshake.auth?.channelId);

      if (!userId || !channelId) {
        console.log("❌ Connection rejected: Missing userId or channelId");
        socket.disconnect();
        return;
      }
      const chatRoomId = `chatRoom-channel-${channelId}`;
      socket.join(chatRoomId);
      console.log(`✅ User ${userId} joined ${chatRoomId}`);

      const InformationChannel = await this.chatChanelRepo.getDetailChannelById(
        Number(channelId),
      );
      if (InformationChannel) {
        this.InformationChannel = InformationChannel;
      }
      if (InformationChannel) {
        const ListUserServerData =
          await this.chatChanelRepo.getListUserServerById(
            InformationChannel.serverId,
          );
        if (ListUserServerData && ListUserServerData.Members?.[0]?.User) {
          this.ListUserChannel = ListUserServerData.Members?.filter(
            (member) => member.User.id !== Number(userId),
          ).map((member) => ({
            id: member.User.id,
            loginName: member.User.loginName,
            avatarUrl: member.User.avatarUrl,
          }));
          this.InformationUser =
            ListUserServerData.Members?.find(
              (member) => member.User.id === Number(userId),
            )?.User || null;
          chatNamespace
            .to(chatRoomId)
            .emit("ListChannelUser", this.ListUserChannel);
        }
      }

      socket.on("sendMessage", async (messageData: SendMessage) => {
        this.messageQueue.add(async () => {
          const { id, message, replyMessage, previewFiles } = messageData;
          console.log("previewFiles", previewFiles)
          if (!message && previewFiles?.length === 0) return;
          const encrypted = encrypt(message);
          const savedMessage = await this.chatChanelRepo.saveMessage(
            Number(userId),
            Number(channelId),
            String(encrypted),
          );

          let ArrayFile: Awaited<
            ReturnType<typeof this.chatChanelRepo.createFile>
          >[] = [];

          if (previewFiles && previewFiles?.length > 0) {
            previewFiles.forEach(async (file) => {
              const dataFile = await this.chatChanelRepo.createFile(
                Number(userId),
                savedMessage.id,
                file.type,
                file.url,
              );
              ArrayFile.push(dataFile);
            });
          }

          if (replyMessage && replyMessage.replyMessageId !== null) {
            await this.chatChanelRepo.SaveReplyMessage(
              savedMessage.id,
              replyMessage.replyMessageId,
            );
          }

          const fullSavedMessage = await this.chatChanelRepo.getMessageById(
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

          if (this.ListUserChannel.length > 0) {
            await this.notiRepo.sendPushNotificationMany(
              this.ListUserChannel,
              `Có 1 tin nhắn từ channel ${InformationChannel?.name}`,
              `${this.InformationUser?.loginName}: ${messageData}`,
            );
          }

          chatNamespace.to(chatRoomId).emit("newMessage", decryptedMessage);
          ArrayFile = [];
        });
      });

      socket.on("deleteMessage", async ({ messageId }) => {
        if (!messageId) return;

        const message = await this.chatChanelRepo.getMessageById(messageId);
        if (!message) return;

        // Chỉ cho phép sender xoá tin nhắn
        if (message.senderId !== Number(userId)) {
          console.log("❌ Không thể xoá tin nhắn của người khác");
          return;
        }

        await this.chatChanelRepo.deleteMessageById(message.id);

        chatNamespace.to(chatRoomId).emit("statusDeleMessage", message.id);
      });

      socket.on("markAsRead", async ({ userId, messageId }) => {
        this.messageQueue.add(async () => {
          if (!userId || !messageId) {
            console.error("Missing userId or messageId");
            return;
          }

          try {
            const messageRead = await this.chatChanelRepo.isMessageRead(
              Number(userId),
              Number(messageId),
            );

            if (messageRead) {
              console.log(
                `User ${userId} has already read message ${messageId}`,
              );
              return;
            }

            const markMessage = await this.chatChanelRepo.markMessagesAsRead(
              Number(userId),
              Number(messageId),
            );

            // this.io
            //   .to(`user-${Number(userId)}`)
            //   .emit("messagesRead", { userId, messageId });
            chatNamespace.to(chatRoomId).emit("isReadUser", markMessage);
          } catch (error) {
            console.log("Error marking message as read:", error);
          }
        });
      });

      socket.on("hiddenMessage", async ({ messageId }) => {
        if (!messageId) return;

        const message = await this.chatChanelRepo.getMessageById(messageId);
        if (!message) return;

        await this.chatChanelRepo.SaveHiddenMessage(Number(userId), messageId);
        chatNamespace.to(chatRoomId).emit("statusHiddenMessage", message.id);
      });

      socket.on("IconMessage", async ({ messageId, icon }) => {
        if (!messageId || !icon) return;

        const IconMessage = await this.chatChanelRepo.SaveIconMessage(
          Number(userId),
          messageId,
          icon,
        );

        chatNamespace.to(chatRoomId).emit("dataIconMessage", IconMessage);
      });

      socket.on("UpdateIconMessage", async ({ id, newIcon }) => {
        if (!id || !newIcon) return;

        const getIconMessage = await this.chatChanelRepo.GetIconMessageId(
          Number(id),
        );
        if (!getIconMessage) return;

        const IconMessage = await this.chatChanelRepo.UpdateIconMessage(
          Number(userId),
          id,
          newIcon,
        );

        chatNamespace.to(chatRoomId).emit("dataUpdateIconMessage", IconMessage);
      });

      socket.on("DeleteIconMessage", async ({ id }) => {
        if (!id) return;

        const getIconMessage = await this.chatChanelRepo.GetIconMessageId(
          Number(id),
        );
        if (!getIconMessage) return;

        this.chatChanelRepo.DeleteIconMessageById(getIconMessage.id);

        chatNamespace.to(chatRoomId).emit("dataDeleteIconMessage", id);
      });

      socket.on("deleteMessage", async ({ messageId }) => {
        if (!messageId) return;

        const message = await this.chatChanelRepo.getMessageById(messageId);
        if (!message) return;

        // Chỉ cho phép sender xoá tin nhắn
        if (message.senderId !== Number(userId)) {
          console.log("❌ Không thể xoá tin nhắn của người khác");
          return;
        }

        await this.chatChanelRepo.deleteMessageById(messageId);

        chatNamespace.to(chatRoomId).emit("statusDeleMessage", message.id);
      });

      socket.on("disconnect", async () => {
        console.log(`❌ User ${userId} disconnected`);
      });
    });
  }
}