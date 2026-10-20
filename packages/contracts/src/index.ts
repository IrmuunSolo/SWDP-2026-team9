import { z } from 'zod';
export { z };
export const CATEGORIES = ['ELECTRONICS', 'DOCUMENTS', 'KEYS', 'CLOTHING', 'OTHER'] as const;
// Sample campus buildings; confirm real labels with the team before release.
export const LOCATIONS = ['MAIN', 'BUILDING_1', 'BUILDING_2', 'LIBRARY'] as const;
export const CATEGORY_LABELS = {
  ELECTRONICS: 'Цахилгаан хэрэгсэл',
  DOCUMENTS: 'Бичиг баримт',
  KEYS: 'Түлхүүр',
  CLOTHING: 'Хувцас',
  OTHER: 'Бусад',
} as const;
export const LOCATION_LABELS = {
  MAIN: 'Төв байр',
  BUILDING_1: '1-р байр',
  BUILDING_2: '2-р байр',
  LIBRARY: 'Номын сан',
} as const;
export const idSchema = z.string().uuid();
export const userSchema = z.object({
  id: idSchema,
  displayName: z.string(),
  studentCodeMasked: z.string(),
  role: z.enum(['MEMBER', 'ADMIN']),
});
export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    studentCode: z
      .string()
      .trim()
      .regex(/^[A-Z]\d{9}$/, 'B232270021 хэлбэртэй байна'),
    password: z.string().min(12).max(128),
  })
  .strict();
export const loginSchema = z
  .object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) })
  .strict();
export const verifySchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const authResultSchema = z.object({ user: userSchema });
export const messageSchema = z.object({ message: z.string() });
const basePostInput = {
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(3000),
  category: z.enum(CATEGORIES),
  location: z.enum(LOCATIONS),
  occurredOn: z.string().date(),
};
export const lostPostSchema = z.object({ ...basePostInput, type: z.literal('LOST') }).strict();
export const foundPostSchema = z
  .object({
    ...basePostInput,
    type: z.literal('FOUND'),
    handoverMethod: z.enum(['MEET', 'GUARD']),
    guardLocation: z.enum(LOCATIONS).optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.handoverMethod === 'GUARD' && !v.guardLocation)
      c.addIssue({
        code: 'custom',
        path: ['guardLocation'],
        message: 'Жижүүрийн байр шаардлагатай',
      });
    if (v.handoverMethod === 'MEET' && v.guardLocation)
      c.addIssue({
        code: 'custom',
        path: ['guardLocation'],
        message: 'Уулзах аргад жижүүрийн байр оруулахгүй',
      });
  });
export const createPostSchema = z.union([lostPostSchema, foundPostSchema]);
export const postSchema = z.object({
  id: idSchema,
  author: userSchema,
  type: z.enum(['LOST', 'FOUND']),
  status: z.enum(['ACTIVE', 'CLOSED', 'HIDDEN']),
  title: z.string(),
  description: z.string(),
  category: z.enum(CATEGORIES),
  location: z.enum(LOCATIONS),
  occurredOn: z.string().date(),
  handoverMethod: z.enum(['MEET', 'GUARD']).nullable(),
  guardLocation: z.enum(LOCATIONS).nullable(),
  createdAt: z.string().datetime(),
});
export const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    q: z.string().trim().max(120).optional(),
    type: z.enum(['LOST', 'FOUND']).optional(),
    category: z.enum(CATEGORIES).optional(),
    location: z.enum(LOCATIONS).optional(),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
  })
  .strict()
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: 'from нь to-оос хойш байж болохгүй',
  });
export const pageMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export const pagedPostsSchema = z.object({ items: z.array(postSchema), meta: pageMetaSchema });
export const updatePostSchema = z
  .object({
    title: basePostInput.title.optional(),
    description: basePostInput.description.optional(),
    category: basePostInput.category.optional(),
    location: basePostInput.location.optional(),
    occurredOn: basePostInput.occurredOn.optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0);
export const commentInputSchema = z.object({ body: z.string().trim().min(1).max(1000) }).strict();
export const commentSchema = z.object({
  id: idSchema,
  postId: idSchema,
  author: userSchema,
  body: z.string(),
  createdAt: z.string().datetime(),
});
export const chatSchema = z.object({
  id: idSchema,
  postId: idSchema,
  participants: z.array(userSchema).length(2),
  createdAt: z.string().datetime(),
});
export const chatInputSchema = z.object({ postId: idSchema }).strict();
export const chatMessageSchema = z.object({
  id: idSchema,
  chatId: idSchema,
  senderId: idSchema,
  body: z.string(),
  createdAt: z.string().datetime(),
});
export const secretInputSchema = z
  .object({
    question: z.string().trim().min(1).max(200),
    answer: z.string().trim().min(1).max(200),
  })
  .strict();
export const answerInputSchema = z.object({ answer: z.string().trim().min(1).max(200) }).strict();
export const claimInputSchema = z.object({ chatId: idSchema }).strict();
export const handoverSchema = z.object({
  id: idSchema,
  postId: idSchema,
  ownerId: idSchema,
  finderId: idSchema,
  ownerConfirmed: z.boolean(),
  finderConfirmed: z.boolean(),
  completedAt: z.string().datetime().nullable(),
});
export const preferencesSchema = z.object({ inApp: z.boolean(), email: z.boolean() }).strict();
export const notificationSchema = z.object({
  id: idSchema,
  type: z.string(),
  postId: idSchema.nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export const reportInputSchema = z.object({ reason: z.string().trim().min(5).max(1000) }).strict();
export const reportSchema = z.object({
  id: idSchema,
  postId: idSchema,
  reason: z.string(),
  status: z.enum(['OPEN', 'RESOLVED']),
  createdAt: z.string().datetime(),
});
export const moderationSchema = z
  .object({ action: z.enum(['DISMISS', 'HIDE_POST']), reason: z.string().trim().min(5).max(1000) })
  .strict();
export const blockSchema = z
  .object({ blocked: z.boolean(), reason: z.string().trim().min(5).max(1000) })
  .strict();
export const photoSchema = z.object({
  id: idSchema,
  url: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png']),
  bytes: z.number(),
});
export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    details: z.unknown().optional(),
  }),
});
export type PublicUser = z.infer<typeof userSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type PostView = z.infer<typeof postSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type Access = 'PUBLIC' | 'MEMBER' | 'AUTHOR' | 'PARTICIPANT' | 'FINDER' | 'ADMIN';
export interface RouteContract {
  id: string;
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string;
  owner: 'irmuun' | 'narmandakh' | 'amarbold';
  frontendOwner: 'irmuun';
  dataOwner: 'amarbold';
  weekBlock: '8-9' | '10-11' | '12-13' | '14-15';
  stories: string[];
  access: Access;
  status: 'ready' | 'planned';
  summary: string;
  input?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  output: z.ZodTypeAny;
  success: number;
}
export const routes: RouteContract[] = [
  {
    id: 'register',
    method: 'post',
    path: '/auth/register',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '8-9',
    stories: ['US-01'],
    access: 'PUBLIC',
    status: 'ready',
    summary: 'Бүртгэл үүсгэж и-мэйл илгээх',
    input: registerSchema,
    output: messageSchema,
    success: 202,
  },
  {
    id: 'verifyEmail',
    method: 'post',
    path: '/auth/verify-email',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '8-9',
    stories: ['US-01'],
    access: 'PUBLIC',
    status: 'ready',
    summary: 'И-мэйл баталгаажуулах',
    input: verifySchema,
    output: messageSchema,
    success: 200,
  },
  {
    id: 'login',
    method: 'post',
    path: '/auth/login',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '8-9',
    stories: ['US-02'],
    access: 'PUBLIC',
    status: 'ready',
    summary: 'Session cookie үүсгэх',
    input: loginSchema,
    output: authResultSchema,
    success: 200,
  },
  {
    id: 'logout',
    method: 'post',
    path: '/auth/logout',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '8-9',
    stories: ['US-02'],
    access: 'MEMBER',
    status: 'ready',
    summary: 'Session хүчингүй болгох',
    output: messageSchema,
    success: 200,
  },
  {
    id: 'me',
    method: 'get',
    path: '/users/me',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '8-9',
    stories: ['US-02'],
    access: 'MEMBER',
    status: 'ready',
    summary: 'Өөрийн нэвтрэлтийн мэдээлэл',
    output: userSchema,
    success: 200,
  },
  {
    id: 'createPost',
    method: 'post',
    path: '/posts',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '10-11',
    stories: ['US-04', 'US-07'],
    access: 'MEMBER',
    status: 'ready',
    summary: 'LOST эсвэл FOUND зар үүсгэх',
    input: createPostSchema,
    output: postSchema,
    success: 201,
  },
  {
    id: 'listPosts',
    method: 'get',
    path: '/posts',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '10-11',
    stories: ['US-04', 'US-07', 'US-09', 'US-10'],
    access: 'MEMBER',
    status: 'ready',
    summary: 'Идэвхтэй зарууд; q болон filter-үүд 10–11-р долоо хоногийн хэрэгжүүлэлт хүртэл 501',
    query: listQuerySchema,
    output: pagedPostsSchema,
    success: 200,
  },
  {
    id: 'getPost',
    method: 'get',
    path: '/posts/{postId}',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '10-11',
    stories: ['US-04', 'US-07'],
    access: 'MEMBER',
    status: 'ready',
    summary: 'Идэвхтэй зарын дэлгэрэнгүй',
    output: postSchema,
    success: 200,
  },
  {
    id: 'updatePost',
    method: 'patch',
    path: '/posts/{postId}',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-06'],
    access: 'AUTHOR',
    status: 'planned',
    summary: 'Зөвхөн өөрийн ACTIVE зарыг засах',
    input: updatePostSchema,
    output: postSchema,
    success: 200,
  },
  {
    id: 'closePost',
    method: 'post',
    path: '/posts/{postId}/close',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-06'],
    access: 'AUTHOR',
    status: 'planned',
    summary: 'Өөрийн зарыг архивлах; completed handover-оос тусдаа',
    output: postSchema,
    success: 200,
  },
  {
    id: 'uploadPhoto',
    method: 'post',
    path: '/posts/{postId}/photos',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '10-11',
    stories: ['US-05'],
    access: 'AUTHOR',
    status: 'planned',
    summary: 'multipart file: JPG/PNG, <5MB, дээд тал нь 3',
    output: photoSchema,
    success: 201,
  },
  {
    id: 'getPhoto',
    method: 'get',
    path: '/photos/{photoId}',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '10-11',
    stories: ['US-05'],
    access: 'MEMBER',
    status: 'planned',
    summary: 'Эрх шалгасан binary image; private filesystem',
    output: photoSchema,
    success: 200,
  },
  {
    id: 'deletePhoto',
    method: 'delete',
    path: '/posts/{postId}/photos/{photoId}',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '10-11',
    stories: ['US-05'],
    access: 'AUTHOR',
    status: 'planned',
    summary: 'Өөрийн зураг устгах',
    output: messageSchema,
    success: 200,
  },
  {
    id: 'createChat',
    method: 'post',
    path: '/chats',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-12'],
    access: 'MEMBER',
    status: 'planned',
    summary: 'FOUND зарын зохиогчтой хоёр хүний чат нээх',
    input: chatInputSchema,
    output: chatSchema,
    success: 201,
  },
  {
    id: 'listChats',
    method: 'get',
    path: '/chats',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-12'],
    access: 'MEMBER',
    status: 'planned',
    summary: 'Өөрийн чатны жагсаалт',
    output: z.array(chatSchema),
    success: 200,
  },
  {
    id: 'getChat',
    method: 'get',
    path: '/chats/{chatId}',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-12'],
    access: 'PARTICIPANT',
    status: 'planned',
    summary: 'Чатны хоёр оролцогчид л харагдана',
    output: chatSchema,
    success: 200,
  },
  {
    id: 'listMessages',
    method: 'get',
    path: '/chats/{chatId}/messages',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-12'],
    access: 'PARTICIPANT',
    status: 'planned',
    summary: 'Polling; after UUID query, limit ≤50; хугацаагаар дараалуулах',
    output: z.array(chatMessageSchema),
    success: 200,
  },
  {
    id: 'sendMessage',
    method: 'post',
    path: '/chats/{chatId}/messages',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-12'],
    access: 'PARTICIPANT',
    status: 'planned',
    summary: 'Чатад мессеж бичих',
    input: commentInputSchema,
    output: chatMessageSchema,
    success: 201,
  },
  {
    id: 'setSecret',
    method: 'patch',
    path: '/posts/{postId}/secret',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '10-11',
    stories: ['US-08'],
    access: 'FINDER',
    status: 'planned',
    summary: 'Нууц асуулт ба answer hash тохируулах; шалгагдсан claim байвал 409',
    input: secretInputSchema,
    output: messageSchema,
    success: 200,
  },
  {
    id: 'getSecret',
    method: 'get',
    path: '/chats/{chatId}/secret',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-08'],
    access: 'PARTICIPANT',
    status: 'planned',
    summary: 'Зөвхөн асуулт, hasSecret; хариу/hash буцаахгүй',
    output: z.object({ question: z.string().nullable(), hasSecret: z.boolean() }),
    success: 200,
  },
  {
    id: 'verifyClaim',
    method: 'post',
    path: '/chats/{chatId}/verify-claim',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-08'],
    access: 'PARTICIPANT',
    status: 'planned',
    summary: 'Нэхэмжлэгч хариулна; ≤5 оролдлого/10 минут, алдаанд ерөнхий хариу',
    input: answerInputSchema,
    output: z.object({ verified: z.boolean() }),
    success: 200,
  },
  {
    id: 'assignOwner',
    method: 'post',
    path: '/posts/{postId}/owner',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-13'],
    access: 'FINDER',
    status: 'planned',
    summary: 'Чатны нэхэмжлэгчийг эзэмшигч болгох; secret байвал verified claim шаардана',
    input: claimInputSchema,
    output: handoverSchema,
    success: 201,
  },
  {
    id: 'confirmHandover',
    method: 'post',
    path: '/handovers/{handoverId}/confirm',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-13'],
    access: 'PARTICIPANT',
    status: 'planned',
    summary: 'Хоёр өөр оролцогч баталмагц CLOSED; transaction, давтан дуудлага idempotent',
    output: handoverSchema,
    success: 200,
  },
  {
    id: 'getHandover',
    method: 'get',
    path: '/handovers/{handoverId}',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-13'],
    access: 'PARTICIPANT',
    status: 'planned',
    summary: 'Шилжүүлэг ба баталгааны төлөв',
    output: handoverSchema,
    success: 200,
  },
  {
    id: 'listNotifications',
    method: 'get',
    path: '/notifications',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-14'],
    access: 'MEMBER',
    status: 'planned',
    summary: 'Өөрийн мэдэгдлүүд, cursor/limit ≤50',
    output: z.array(notificationSchema),
    success: 200,
  },
  {
    id: 'readNotification',
    method: 'patch',
    path: '/notifications/{notificationId}/read',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-14'],
    access: 'MEMBER',
    status: 'planned',
    summary: 'Зөвхөн өөрийн мэдэгдлийг уншсан болгох',
    output: notificationSchema,
    success: 200,
  },
  {
    id: 'setPreferences',
    method: 'patch',
    path: '/users/me/notification-preferences',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-14'],
    access: 'MEMBER',
    status: 'planned',
    summary: 'Хоёр сувгийг тус тусад нь тохируулах',
    input: preferencesSchema,
    output: preferencesSchema,
    success: 200,
  },
  {
    id: 'chatIdentity',
    method: 'get',
    path: '/chats/{chatId}/identity',
    owner: 'narmandakh',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-03'],
    access: 'PARTICIPANT',
    status: 'planned',
    summary: 'Чатын хоёр талын бүтэн код; админд тусгай эрх өгөхгүй',
    output: z.array(z.object({ userId: idSchema, studentCode: z.string() })),
    success: 200,
  },
  {
    id: 'listComments',
    method: 'get',
    path: '/posts/{postId}/comments',
    owner: 'amarbold',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-11'],
    access: 'MEMBER',
    status: 'planned',
    summary: 'Зарын нийтийн сэтгэгдэл; cursor/limit ≤50',
    output: z.array(commentSchema),
    success: 200,
  },
  {
    id: 'createComment',
    method: 'post',
    path: '/posts/{postId}/comments',
    owner: 'amarbold',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-11'],
    access: 'MEMBER',
    status: 'planned',
    summary: 'Нууц нотолгоо бүү бич гэсэн UI санамжтай',
    input: commentInputSchema,
    output: commentSchema,
    success: 201,
  },
  {
    id: 'reportPost',
    method: 'post',
    path: '/posts/{postId}/reports',
    owner: 'amarbold',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-15'],
    access: 'MEMBER',
    status: 'planned',
    summary: 'Зөрчилтэй зар мэдээлэх',
    input: reportInputSchema,
    output: reportSchema,
    success: 201,
  },
  {
    id: 'adminReports',
    method: 'get',
    path: '/admin/reports',
    owner: 'amarbold',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-15'],
    access: 'ADMIN',
    status: 'planned',
    summary: 'Мэдээлэгдсэн зарууд, cursor/limit ≤50',
    output: z.array(reportSchema),
    success: 200,
  },
  {
    id: 'moderateReport',
    method: 'patch',
    path: '/admin/reports/{reportId}',
    owner: 'amarbold',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-15'],
    access: 'ADMIN',
    status: 'planned',
    summary: 'Шалтгаан, audit log-той шийдвэр',
    input: moderationSchema,
    output: reportSchema,
    success: 200,
  },
  {
    id: 'blockUser',
    method: 'patch',
    path: '/admin/users/{userId}/block',
    owner: 'amarbold',
    frontendOwner: 'irmuun',
    dataOwner: 'amarbold',
    weekBlock: '12-13',
    stories: ['US-15'],
    access: 'ADMIN',
    status: 'planned',
    summary: 'Өөрийгөө блоклохгүй; блоклосон хэрэглэгчийн бүх session хүчингүй',
    input: blockSchema,
    output: messageSchema,
    success: 200,
  },
];
