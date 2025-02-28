import { z } from "zod";

export const InviteLinkSchema = z.object({
  serverId: z.number({
    required_error: "serverId is required",
    invalid_type_error: "serverId must be a number"
  }),

  count: z.number({
    required_error: "count is required",
    invalid_type_error: "count must be a number"
  }).refine((val) => val === -1 || (val > 0 && val < 30), {
    message: "count must be -1 or between 0 and 29"
  }),

  expireIn: z.number({
    required_error: "expireIn is required",
    invalid_type_error: "expireIn must be a valid date string"
  }).min(0, {
    message: "expireIn must be greater than 0"
  }).max(30, {
    message: "expireIn must be less than 30"
  })
});
