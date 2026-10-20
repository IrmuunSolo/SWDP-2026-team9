# Verification — Нармандах, 10–11-р долоо хоног

OperationId: setSecret, getSecret, verifyClaim. Controller нь `/posts/:postId/secret`, `/chats/:chatId/secret`, `/chats/:chatId/verify-claim`-г contract-тай ижил хэрэгжүүлнэ. Secret/hash Post projection-д орохгүй. setSecret зөвхөн found author; getSecret chat participant; verifyClaim зөвхөн claimant.

Answer normalization/hash, 5 оролдлого/10 минут, claimVerifiedAt, асуултгүй эд зүйл, асуулт солих 409 дүрмийг docs/ARCHITECTURE.md-ээс дагана. Claim verified болсон event-ийг notification producer-тэй зөвшилц. Handover owner нь энэ service/DB claim state-д найдна.
