# Admin — Амарболд, 12–13-р долоо хоног

OperationId: reportPost, adminReports, moderateReport, blockUser. Public register admin үүсгэхгүй. Role guard-ийг session guard-ийн дараа хэрэглэ; reason + AuditLog нэг transaction. HIDE_POST → post HIDDEN; block → blockedAt + session.deleteMany. Өөрийгөө block хийхийг 409 буцаана. Admin role нь бусдын chat/secret/full code-г унших эрх биш.

Report list default OPEN, cursor/limit ≤50. Report resolution, авторын зарын жагсаалт ба visibility-д үзүүлэх нөлөөг Posts owner-той review хий. UI дээр role-г нуух төдий нь server authorization биш.
