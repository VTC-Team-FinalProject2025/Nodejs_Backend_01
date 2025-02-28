import { z } from "zod";

export const ChannelUpdateSchema = z.object({
  name: z.string({
    required_error: "name is required",
    invalid_type_error: "name must be a valid date string"
  }).min(1, {
    message: "name must at least 1 character"
  }).max(100, {
    message: "name must be less than 100 characters"
  }),
  password: z.string().min(6, {
    message: "password must be at least 6 characters"
  }).max(100, {
    message: "password must be less than 24 characters"
  }).optional(),
});

export const ChannelSchema = z.object({
  serverId: z.number({
    required_error: "serverId is required",
    invalid_type_error: "serverId must be a number"
  }),
  name: z.string({
    required_error: "name is required",
    invalid_type_error: "name must be a valid date string"
  }).min(1, {
    message: "name must at least 1 character"
  }).max(100, {
    message: "name must be less than 100 characters"
  }),
  password: z.string().min(6, {
    message: "password must be at least 6 characters"
  }).max(100, {
    message: "password must be less than 24 characters"
  }).optional(),
});
