# JWT шилжилт — Нармандах 8–9-р долоо хоног

Нэвтрэлтийн суурь **opaque HttpOnly session cookie + DB fingerprint** ашигладаг. 8–9-р долоо хоногт auth owner Нармандах JWT нэвтрэлтийг тусдаа PR-аар хэрэгжүүлнэ.

1. Backend-д баталгаатай JWT library, secret/issuer/audience/expiry тохиргоо нэмэх shared dependency/config PR гаргана. Secret нь зөвхөн root `.env`, production secret manager-д байна.
2. JWT-г HttpOnly/SameSite cookie-оор дамжуулж, frontend-ийн JSON response ба `credentials: include` гэрээг хэвээр хадгалж болно. localStorage-д token хадгалахгүй. Cookie name өөрчлөх бол contract-оо эхэлж шинэчилнэ.
3. Guard нь signature, зөвшөөрсөн algorithm, issuer, audience, expiry-г шалгана. Logout/block-ийг шууд хэрэгжүүлэхийн тулд session/jti revoke state-г DB-д хадгалж хүсэлт бүрд шалгана. JWT payload дахь role-г дангаар нь итгэхгүй; verified/blocked/role-ийн серверийн төлвийг шалгана.
4. Raw opaque token-ийн 64-hex regex болон fingerprint lookup-ийг JWT+jti lookup болгохдоо session guard, login/logout, session schema/migration, HTTP/integration fixture-үүдийг **нэг PR-д** шинэчилнэ. Хуучин session-уудыг хүчингүй болгож дахин login шаардах шилжилтийн заавар бичнэ.
5. Expired, forged, wrong issuer/audience/algorithm, revoked/logout, blocked user, CSRF, 5/10 lockout тестүүд шаардлагатай. Legacy session cookie-г JWT мэт parse хийх эсвэл token-ийг шалгалтгүй decode хийж хэрэглэхгүй.

Ирмүүн UI алдааны нөхцөл ба дахин login урсгалыг review; Амарболд jti/session migration ба CI тестийг review хийнэ. Access/refresh rotation нэмэхээр шийдвэл endpoint/schema-г implementation-ээс өмнө contract PR-д тохиролцоно.
