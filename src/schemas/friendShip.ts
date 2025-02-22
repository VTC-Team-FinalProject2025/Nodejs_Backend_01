import { z } from "zod";

export const FriendShipFormSchema = z.object({
  receiverId: z.number(),
});

export const AcceptFriendFormSchema = z.object({
  senderId: z.number(),
});
