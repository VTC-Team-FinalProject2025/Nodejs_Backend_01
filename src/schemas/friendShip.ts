import { z } from "zod";

export const FriendShipFormSchema = z.object({
  receiverId: z.number(),
});
