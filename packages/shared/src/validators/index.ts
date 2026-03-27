import { z } from "zod";

export const emailSchema = z
  .string()
  .email("请输入有效的邮箱地址")
  .max(255, "邮箱地址不能超过255个字符");

export const passwordSchema = z
  .string()
  .min(8, "密码至少8个字符")
  .max(100, "密码不能超过100个字符")
  .regex(/[0-9]/, "密码必须包含数字")
  .regex(/[a-zA-Z]/, "密码必须包含字母");

export const verificationCodeSchema = z
  .string()
  .length(6, "验证码必须是6位数字")
  .regex(/^\d+$/, "验证码必须是数字");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const verifyCodeSchema = z.object({
  email: emailSchema,
  code: verificationCodeSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "请输入密码"),
});

export const messageSchema = z.object({
  content: z.string().min(1, "请输入内容").max(500, "内容不能超过500个字符"),
  imageUrl: z.string().url().optional().nullable(),
  editRegion: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().min(0).max(1),
      height: z.number().min(0).max(1),
    })
    .optional()
    .nullable(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional().nullable(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: passwordSchema,
});

export const updateThemeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
