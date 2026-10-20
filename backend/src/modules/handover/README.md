# Handover — Нармандах, 12–13-р долоо хоног

Үүсгэх файлууд: handover.module/controller/service + transaction integration tests. OperationId: assignOwner, confirmHandover, getHandover. US-08 claim verification PR main-д орсны дараа owner assignment-ийг нэгтгэ.

Finder сонгосон chatId-аар claimantId-г server өөрөө тогтооно. Нэг post-д unique handover; өөр owner дахин сонгоход 409. Хоёр тал өөр хүмүүс, only participant confirm, давтан confirm idempotent. Confirmation + post CLOSED + outbox event-ийг нэг transaction-д хадгал. Зэрэг ирэх confirm хүсэлтүүдийн race condition-ийг PostgreSQL integration test-ээр шалга. Эх санааг labs/lab07/campusfind.js-ээс харж болно; API actorId-г body-оос бүү ав.
