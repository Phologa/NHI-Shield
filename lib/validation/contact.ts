import { z } from "zod";

export const pilotRequestSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  organisation: z.string().trim().min(2, "Enter your organisation."),
  email: z.string().trim().email("Enter a valid work email."),
  role: z.string().trim().min(2, "Enter your role."),
  industry: z.string().trim().min(1, "Select an industry."),
  size: z.string().trim().min(1, "Select an organisation size."),
  evaluation: z.string().trim().min(1, "Select an evaluation area."),
  message: z.string().trim().min(10, "Add a little more context.").max(2000, "Keep the message under 2,000 characters."),
});