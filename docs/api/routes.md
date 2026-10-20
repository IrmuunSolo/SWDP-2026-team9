# API замууд

Эх гэрээ: `packages/contracts/src/index.ts`. Энэ хүснэгт ба OpenAPI-г `npm run contract:generate` командаар үүсгэнэ.

| Method | Зам /api/v1 | Эрх | Долоо хоног | API owner | Frontend | Database | Төлөв | Үүрэг |
|---|---|---|---|---|---|---|---|---|
| POST | /auth/register | PUBLIC | 8-9 | narmandakh | irmuun | amarbold | ready | Бүртгэл үүсгэж и-мэйл илгээх |
| POST | /auth/verify-email | PUBLIC | 8-9 | narmandakh | irmuun | amarbold | ready | И-мэйл баталгаажуулах |
| POST | /auth/login | PUBLIC | 8-9 | narmandakh | irmuun | amarbold | ready | Session cookie үүсгэх |
| POST | /auth/logout | MEMBER | 8-9 | narmandakh | irmuun | amarbold | ready | Session хүчингүй болгох |
| GET | /users/me | MEMBER | 8-9 | narmandakh | irmuun | amarbold | ready | Өөрийн нэвтрэлтийн мэдээлэл |
| POST | /posts | MEMBER | 10-11 | narmandakh | irmuun | amarbold | ready | LOST эсвэл FOUND зар үүсгэх |
| GET | /posts | MEMBER | 10-11 | narmandakh | irmuun | amarbold | ready | Идэвхтэй зарууд; q болон filter-үүд 10–11-р долоо хоногийн хэрэгжүүлэлт хүртэл 501 |
| GET | /posts/{postId} | MEMBER | 10-11 | narmandakh | irmuun | amarbold | ready | Идэвхтэй зарын дэлгэрэнгүй |
| PATCH | /posts/{postId} | AUTHOR | 12-13 | narmandakh | irmuun | amarbold | planned | Зөвхөн өөрийн ACTIVE зарыг засах |
| POST | /posts/{postId}/close | AUTHOR | 12-13 | narmandakh | irmuun | amarbold | planned | Өөрийн зарыг архивлах; completed handover-оос тусдаа |
| POST | /posts/{postId}/photos | AUTHOR | 10-11 | narmandakh | irmuun | amarbold | planned | multipart file: JPG/PNG, <5MB, дээд тал нь 3 |
| GET | /photos/{photoId} | MEMBER | 10-11 | narmandakh | irmuun | amarbold | planned | Эрх шалгасан binary image; private filesystem |
| DELETE | /posts/{postId}/photos/{photoId} | AUTHOR | 10-11 | narmandakh | irmuun | amarbold | planned | Өөрийн зураг устгах |
| POST | /chats | MEMBER | 12-13 | narmandakh | irmuun | amarbold | planned | FOUND зарын зохиогчтой хоёр хүний чат нээх |
| GET | /chats | MEMBER | 12-13 | narmandakh | irmuun | amarbold | planned | Өөрийн чатны жагсаалт |
| GET | /chats/{chatId} | PARTICIPANT | 12-13 | narmandakh | irmuun | amarbold | planned | Чатны хоёр оролцогчид л харагдана |
| GET | /chats/{chatId}/messages | PARTICIPANT | 12-13 | narmandakh | irmuun | amarbold | planned | Polling; after UUID query, limit ≤50; хугацаагаар дараалуулах |
| POST | /chats/{chatId}/messages | PARTICIPANT | 12-13 | narmandakh | irmuun | amarbold | planned | Чатад мессеж бичих |
| PATCH | /posts/{postId}/secret | FINDER | 10-11 | narmandakh | irmuun | amarbold | planned | Нууц асуулт ба answer hash тохируулах; шалгагдсан claim байвал 409 |
| GET | /chats/{chatId}/secret | PARTICIPANT | 12-13 | narmandakh | irmuun | amarbold | planned | Зөвхөн асуулт, hasSecret; хариу/hash буцаахгүй |
| POST | /chats/{chatId}/verify-claim | PARTICIPANT | 12-13 | narmandakh | irmuun | amarbold | planned | Нэхэмжлэгч хариулна; ≤5 оролдлого/10 минут, алдаанд ерөнхий хариу |
| POST | /posts/{postId}/owner | FINDER | 12-13 | narmandakh | irmuun | amarbold | planned | Чатны нэхэмжлэгчийг эзэмшигч болгох; secret байвал verified claim шаардана |
| POST | /handovers/{handoverId}/confirm | PARTICIPANT | 12-13 | narmandakh | irmuun | amarbold | planned | Хоёр өөр оролцогч баталмагц CLOSED; transaction, давтан дуудлага idempotent |
| GET | /handovers/{handoverId} | PARTICIPANT | 12-13 | narmandakh | irmuun | amarbold | planned | Шилжүүлэг ба баталгааны төлөв |
| GET | /notifications | MEMBER | 12-13 | narmandakh | irmuun | amarbold | planned | Өөрийн мэдэгдлүүд, cursor/limit ≤50 |
| PATCH | /notifications/{notificationId}/read | MEMBER | 12-13 | narmandakh | irmuun | amarbold | planned | Зөвхөн өөрийн мэдэгдлийг уншсан болгох |
| PATCH | /users/me/notification-preferences | MEMBER | 12-13 | narmandakh | irmuun | amarbold | planned | Хоёр сувгийг тус тусад нь тохируулах |
| GET | /chats/{chatId}/identity | PARTICIPANT | 12-13 | narmandakh | irmuun | amarbold | planned | Чатын хоёр талын бүтэн код; админд тусгай эрх өгөхгүй |
| GET | /posts/{postId}/comments | MEMBER | 12-13 | amarbold | irmuun | amarbold | planned | Зарын нийтийн сэтгэгдэл; cursor/limit ≤50 |
| POST | /posts/{postId}/comments | MEMBER | 12-13 | amarbold | irmuun | amarbold | planned | Нууц нотолгоо бүү бич гэсэн UI санамжтай |
| POST | /posts/{postId}/reports | MEMBER | 12-13 | amarbold | irmuun | amarbold | planned | Зөрчилтэй зар мэдээлэх |
| GET | /admin/reports | ADMIN | 12-13 | amarbold | irmuun | amarbold | planned | Мэдээлэгдсэн зарууд, cursor/limit ≤50 |
| PATCH | /admin/reports/{reportId} | ADMIN | 12-13 | amarbold | irmuun | amarbold | planned | Шалтгаан, audit log-той шийдвэр |
| PATCH | /admin/users/{userId}/block | ADMIN | 12-13 | amarbold | irmuun | amarbold | planned | Өөрийгөө блоклохгүй; блоклосон хэрэглэгчийн бүх session хүчингүй |
