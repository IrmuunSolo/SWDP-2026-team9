# Search UI — Ирмүүн, 10–11-р долоо хоног

Search input state, q query parameter, loading/empty/error нөхцөлүүдийг энд хэрэгжүүл. GET /posts-ийн params-ийг filters-ийн state-тэй нэгтгэх shared shell PR-ийг Нармандахтай зөвшилц. Keystroke бүрт хязгааргүй fetch хийхгүй; submit эсвэл 300ms debounce, хуучин хүсэлтийг cancel/ignore хийнэ. Үр дүн PostView[] гэрээтэй.
