# Edit ба archive — Нармандах, 12–13-р долоо хоног

OperationId: updatePost, closePost. Зөвхөн post.authorId=req.user.id, ACTIVE post. Type/author/secret/system status-ийг update body-оос өөрчлөхгүй. Close нь ARCHIVED гэсэн шинэ API enum үүсгэхгүй; CLOSED + closedReason=AUTHOR_ARCHIVED, completedAt үүсэхгүй. Pending handover байвал 409. Handover service-тэй transaction/race дүрмээ зөвшилц; deleted record биш archive хэвээр хадгал.
