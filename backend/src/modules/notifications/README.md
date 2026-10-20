# Notification — Нармандах, 12–13-р долоо хоног

OperationId: listNotifications, readNotification, setPreferences. Өөрийн notification-ийг л query/update хийнэ. OutboxEvent table бэлэн; producer ба retry worker хараахан хэрэгжээгүй.

PostCreated payload: postId, authorId, category, location, type. ChatMessageCreated: messageId, chatId, senderId, recipientId, postId. HandoverConfirmed: handoverId, postId, actorId, recipientId. Payload-д password/token/full code/secret answer оруулахгүй. Producer бизнес өөрчлөлттэй нэг transaction-д event бичнэ. Matching нь opposite type + category/location ACTIVE зарын зохиогчид; sender/self notification үүсгэхгүй. Idempotency key/eventId-тай duplicate хамгаалалтыг schema PR-д нэм.

Worker process retry/backoff, preference тус бүр, ≤5 минутын хэмжилт, SMTP унасан ч post/message хэвийн хадгалагдах integration test шаардлагатай.
