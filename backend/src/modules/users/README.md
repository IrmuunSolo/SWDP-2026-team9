# Identity — Нармандах, 12–13-р долоо хоног

Одоогийн `/users/me` auth controller-д байна. Public projection бүх кодыг mask хийдэг. `chatIdentity` operation-ийг `users/identity.controller.ts`, service-д нэмж, зөвхөн тухайн chat-ийн хоёр талд бүтэн code үзүүлнэ. Admin bypass нэмэхгүй. Chat owner-той permission query ба privacy test-ээ review хийнэ.
