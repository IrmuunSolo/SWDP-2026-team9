# Photos — Нармандах, 10–11-р долоо хоног

OperationId: uploadPhoto, getPhoto, deletePhoto. multipart file, jpg/png, magic bytes шалгах, bytes <5242880, нэг post-д ≤3 зураг. Квотыг concurrent upload-д transaction/locking-тай шалгана. Storage key random; хэрэглэгчийн filename-аар filesystem path зохиохгүй. File-г static public folder-оор expose хийхгүй; getPhoto нь member ба post visibility шалган binary image буцаана. DB insert унавал түр файл цэвэрлэх, зураг устгахад DB/file consistency хэрэгтэй.
