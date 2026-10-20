# Chat — Нармандах, 12–13-р долоо хоног

Үүсгэх файлууд: `chat.module.ts`, `chat.controller.ts`, `chat.service.ts`, `chat.service.test.ts`. AppModule-д PostsModule-ийн дараа, PlannedModule-ийн өмнө холбоно.

Contract operationId: createChat, listChats, getChat, listMessages, sendMessage. Request/response-ийг packages/contracts-оос import хий. Header/session parsing-ийг дахин бичихгүй.

Chat.finder нь Post.author, Chat.claimantId нь хүсэлт гаргасан хэрэглэгч. Өөрийн зар, LOST/CLOSED/HIDDEN зар дээр шинэ chat нээхгүй. list нь зөвхөн өөрийн chats. get/messages бүрд `canReadChat` шалга; ADMIN bypass байхгүй. Sender-ийг req.user.id-аас авна. UI 5 секундийн polling хийж, unmount-д timer/call-аа цэвэрлэнэ; realtime/WebSocket нь V2.

Файл эзэмшигчээс гадуур өөрчлөх шаардлага: AppModule import, contract.status → shared PR; PostCreated/ChatMessageCreated outbox producer → Нармандахтай хамтарсан PR. Үйлчилгээ бэлэн бол planned reservation-ийг ready болгож HTTP/DB permission tests нэм.
