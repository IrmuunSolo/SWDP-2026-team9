# Баг 9 — Лаборатори 15: DORA Metrics тооцоолол, Спринт Ретроспектив

**Гарын авлага:** Лаборатори 14 (15-р долоо хоног, Лекц 15) · CLO2, CLO6 · 2 цаг
**Дараалал:** Э.Амарболд → Л.Ирмүүн → Г.Нармандах
**Branch:** `lab15/amarbold-repo-dora` → `lab15/irmuun-sample-dora` → `lab15/narmandakh-retro`
**Нотолгоо:** `labs/lab15/` · **Тайлан:** `labs/docx/Lab15_report_team9.md`

## 1. Зорилго ба deliverable

1. Багшийн өгсөн **жишиг өгөгдлөөс** DORA-ийн 4 үзүүлэлтийг тооцоолох.
2. Elite / High / Medium / Low ангилалтай харьцуулж дүгнэх.
3. Багаараа бодит retrospective хийж, 3 асуултад хариулж, **3–5 action item** бичих.

**Багшид өгөх:** DORA тооцооллын хүснэгт + Retrospective баримт бичиг.

Гарын авлагын шаардлага нь жишиг өгөгдөл. Нэмэлтээр өөрсдийн repo-гийн бодит өгөгдлөөр харьцуулалт хийнэ (Амарболдын ээлж). Энэ нь ретроспективд бодит баримт болно.

## 2. Хуваарилалт

| Ээлж | Гишүүн | Ажил | Reviewer |
| --- | --- | --- | --- |
| 1 | Э.Амарболд | GitHub-ийн PR, CI түүхээс бодит өгөгдөл татаж DORA тооцоолох скрипт | Л.Ирмүүн |
| 2 | Л.Ирмүүн | Багшийн жишиг өгөгдлийг Sheets-д тооцоолох, ангилал, хүснэгт | Г.Нармандах |
| 3 | Г.Нармандах | Ретроспектив зохион байгуулах, 3 асуулт, action item, нийт дүгнэлт | Э.Амарболд |

Ретроспективын уулзалтад **гурвуулаа** заавал оролцоно (30–40 минут). Ирмүүний ээлж дууссаны дараа товлоно.

## 3. Тодорхойлолт ба ангилал

| Үзүүлэлт | Томьёо |
| --- | --- |
| Deployment Frequency | Нийт амжилттай deploy ÷ хугацаа (өдөр эсвэл долоо хоног) |
| Lead Time for Changes | Дундаж (deploy хийсэн цаг − commit хийсэн цаг), цагаар |
| Change Failure Rate | Амжилтгүй deploy ÷ нийт deploy × 100% |
| Time to Restore | Амжилтгүй deploy бүрийн дундаж (засагдсан цаг − илэрсэн цаг), цагаар |

Ангиллын түгээмэл хүснэгт (DORA тайлангуудаас хялбарчилсан). **Лекц 15-ын слайдад өөр хүснэгт байвал түүнийг баримтална.**

| Ангилал | Deploy Frequency | Lead Time | Change Failure Rate | Time to Restore |
| --- | --- | --- | --- | --- |
| Elite | Өдөрт олон удаа (on-demand) | < 1 цаг | 0–15% | < 1 цаг |
| High | Өдөрт нэгээс 7 хоногт нэг | 1 өдөр – 1 долоо хоног | 16–30% | < 1 өдөр |
| Medium | 7 хоногт нэгээс сард нэг | 1 долоо хоног – 1 сар | 16–30% | 1 өдөр – 1 долоо хоног |
| Low | Сард нэгээс цөөн | > 1 сар | > 30% | > 1 долоо хоног |

## 4. 1-р ээлж — Э.Амарболд: repo-гийн бодит өгөгдөл

Төсөлд production deploy байхгүй тул дараах **proxy**-г ашиглана. Үүнийг тайланд тодорхой бичнэ:

- **Deploy** = `main` руу merge хийсний дараах `Foundation` workflow-ийн run.
- **Амжилтгүй deploy** = `main` дээрх `failure` төгсгөлтэй run.
- **Restore** = `main` дээрх failure-аас дараагийн success хүртэлх хугацаа.
- **Lead time** = PR-ийн эхний commit → merge.

### 4.1. Өгөгдөл татах (GitHub CLI)

```
git switch main
git pull --ff-only origin main
git switch -c lab15/amarbold-repo-dora
mkdir -p labs/lab15
gh pr list --repo IrmuunSolo/SWDP-2026-team9 --state merged --limit 200 --json number,title,mergedAt,commits > labs/lab15/prs.json
gh run list --repo IrmuunSolo/SWDP-2026-team9 --branch main --event push --workflow Foundation --limit 200 --json databaseId,conclusion,createdAt,updatedAt,headSha > labs/lab15/runs-main.json
```

Workflow-ийн нэр өөр бол `gh workflow list`-ээр шалгана. JSON-д хувийн мэдээлэл (и-мэйл) орсон эсэхийг commit-оос өмнө шалгана. `commits`-ийн `authors` хэсэгт и-мэйл байвал `jq`-ээр хасна.

### 4.2. `labs/lab15/dora.mjs`

```js
import { readFileSync } from 'node:fs';

const hours = (a, b) => (new Date(b) - new Date(a)) / 36e5;
const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);

const prs = JSON.parse(readFileSync(new URL('./prs.json', import.meta.url)));
const runs = JSON.parse(readFileSync(new URL('./runs-main.json', import.meta.url)))
  .filter((r) => r.conclusion === 'success' || r.conclusion === 'failure')
  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

const leadTimes = prs
  .filter((p) => p.mergedAt && p.commits.length)
  .map((p) => {
    const first = p.commits.map((c) => c.committedDate).sort()[0];
    return hours(first, p.mergedAt);
  });

const failures = runs.filter((r) => r.conclusion === 'failure');
const restores = [];
for (const f of failures) {
  const fixed = runs.find(
    (r) => r.conclusion === 'success' && new Date(r.createdAt) > new Date(f.createdAt),
  );
  if (fixed) restores.push(hours(f.createdAt, fixed.updatedAt));
}

const spanDays = runs.length ? hours(runs[0].createdAt, runs.at(-1).createdAt) / 24 || 1 : NaN;
const successCount = runs.length - failures.length;

console.table({
  'Хугацаа (өдөр)': spanDays.toFixed(1),
  'Deploy (нийт run)': runs.length,
  'Deploy Frequency (7 хоногт)': ((successCount / spanDays) * 7).toFixed(2),
  'Lead Time дундаж (цаг)': avg(leadTimes).toFixed(1),
  'Change Failure Rate (%)': ((failures.length / runs.length) * 100).toFixed(1),
  'Time to Restore дундаж (цаг)': avg(restores).toFixed(1),
});
```

```
node labs/lab15/dora.mjs | tee labs/lab15/repo-dora.txt
npx --no-install eslint labs/lab15 --max-warnings=0
```

Гарсан утгыг 3-р хэсгийн хүснэгттэй харьцуулж ангилна. Proxy-ийн хязгаарлалт (оюутны баг, долоо хоногт нэг лаб, бодит хэрэглэгчгүй)-ыг тайлбарлана. `labs/docx/Lab15_report_team9.md`-ийг 8-р хэсгийн загвараар үүсгэж өөрийн хэсгийг бөглөнө. PR reviewer: Л.Ирмүүн.

## 5. 2-р ээлж — Л.Ирмүүн: багшийн жишиг өгөгдөл

1. Багшийн өгсөн өгөгдлийг (10–15 deploy) Google Sheets эсвэл Excel-д оруулна. Багана:

| A deploy_id | B commit_at | C deployed_at | D status | E detected_at | F restored_at |
| --- | --- | --- | --- | --- | --- |

2. Огноо-цагийн баганыг **Date time** формат болгоно. Томьёо (2–16-р мөр гэж үзэв):

| Үзүүлэлт | Sheets томьёо |
| --- | --- |
| Хугацаа (өдөр) | `=MAX(C2:C16)-MIN(C2:C16)` |
| Deploy Frequency (7 хоногт) | `=COUNTA(A2:A16)/(MAX(C2:C16)-MIN(C2:C16))*7` |
| Lead Time (цаг) | `=AVERAGE(ARRAYFORMULA((C2:C16-B2:B16)*24))` |
| Change Failure Rate | `=COUNTIF(D2:D16,"failed")/COUNTA(D2:D16)` (хувь формат) |
| Time to Restore (цаг) | `=AVERAGE(FILTER((F2:F16-E2:E16)*24,D2:D16="failed"))` |

Excel-д `ARRAYFORMULA` шаардлагагүй. Status-ийн бичиглэл багшийн өгөгдөлд өөр (`fail`, `rollback`) бол томьёог тааруулна.

3. Үзүүлэлт бүрийг ангилж, нэг мөр үндэслэл бичнэ.
4. Хүснэгтийг `labs/lab15/dora-sample.xlsx` (эсвэл `.csv`) болгон хадгалж, томьёо харагдах screenshot-ийг `labs/lab15/01-dora-sheet.png` болгоно.
5. Гараар нэг утгыг (жишээ нь CFR) шалгаж томьёо зөв эсэхийг батална.

```
git switch main
git pull --ff-only origin main
git switch -c lab15/irmuun-sample-dora
```

Тайлангийн өөрийн хэсгийг бөглөж PR нээнэ. Reviewer: Г.Нармандах.

## 6. 3-р ээлж — Г.Нармандах: ретроспектив

### 6.1. Уулзалтын бүтэц (35 минут)

| Минут | Хэсэг |
| --- | --- |
| 0–5 | Зорилго, дүрэм: хүнийг биш процессыг шүүмжлэх; хүн бүр ижил хугацаатай ярина |
| 5–10 | Баримт: Лаб 1–14-ийн төлөв, DORA-ийн хоёр хүснэгт (жишиг ба repo) |
| 10–25 | 3 асуулт: хүн бүр санаагаа бичиж (sticky note, Trello эсвэл FigJam), дараа нь бүлэглэнэ |
| 25–32 | Санал хураалт (хүн бүр 3 оноо), хамгийн өндөр оноотой 3–5 сэдвийг action item болгоно |
| 32–35 | Хариуцагч, хугацаа баталгаажуулах |

### 6.2. Гурван асуулт

1. **Юу сайн болсон бэ?**
2. **Юу сайжруулах шаардлагатай вэ?**
3. **Дараагийн удаа юуг өөрчлөх вэ?**

Хариултыг гишүүдийн өөрсдийн хэлсэн үгээр бичнэ, зохиож бичихгүй. Ярилцлагыг эхлүүлэх бодит баримтууд (repo, PR-ийн түүхээс):

- Лаб 10, 11 цагтаа хийгдээгүй, ээлжийн дараалал хүлээлт үүсгэсэн.
- PR #31-д тайлангийн файл орхигдож дахин PR шаардсан.
- Push хийх эрх, token-оос болж хоцрогдол гарсан.
- Гурван OS (Windows, macOS, Fedora/Podman)-ийн командын ялгаа.
- Review дүрэм, CI, ESLint, тест нэмэгдсэнээр PR-ийн чанар сайжирсан эсэх.

### 6.3. Action item (3–5)

Тодорхой, хэмжигдэхүйц, хариуцагч ба хугацаатай байна. Бие даалт 2-т хэрэглэнэ.

| № | Action item | Хариуцагч | Хугацаа | Амжилтын шалгуур |
| --- | --- | --- | --- | --- |
| 1 | [жишээ: PR template-д «тайлан шинэчилсэн» checkbox нэмэх] | [ ] | [ ] | [дараагийн 3 PR-д тайлан орхигдоогүй] |
| 2 | | | | |
| 3 | | | | |

### 6.4. Хадгалах

```
git switch main
git pull --ff-only origin main
git switch -c lab15/narmandakh-retro
```

Уулзалтын самбарын screenshot `labs/lab15/02-retro-board.png`. Тайлангийн ретро хэсэг, нийт дүгнэлтийг бөглөж PR нээнэ. Reviewer: Э.Амарболд.

## 7. Шалгах хуудас

- [ ] Жишиг өгөгдлийн 4 үзүүлэлт тооцоологдож, томьёо харагдана
- [ ] Үзүүлэлт бүр ангилагдаж, үндэслэлтэй
- [ ] Repo-гийн бодит DORA (proxy тодорхойлолттой) тооцоологдсон
- [ ] Ретро гурвуулаа оролцож хийгдсэн, 3 асуултын хариулт бодит
- [ ] 3–5 action item хариуцагч, хугацаа, шалгууртай
- [ ] JSON-д хувийн мэдээлэл ороогүй; PR бүр өөр гишүүний review-тай

## 8. Тайлангийн загвар (`labs/docx/Lab15_report_team9.md`)

```markdown
# Лаборатори 15 — DORA Metrics тооцоолол, Спринт Ретроспектив

**Баг:** 9 · **Төсөл:** CampusFind / SWDP-2026-team9
**Огноо:** [эхэлсэн] – [дууссан] · **Дараалал:** Э.Амарболд → Л.Ирмүүн → Г.Нармандах

## 1. Жишиг өгөгдлийн DORA (Л.Ирмүүн)
Төлөв: Хүлээгдэж байна
| Үзүүлэлт | Утга | Ангилал | Үндэслэл |
| --- | --- | --- | --- |
| Deployment Frequency | | | |
| Lead Time | | | |
| Change Failure Rate | | | |
| Time to Restore | | | |

## 2. Repo-гийн бодит DORA (Э.Амарболд)
Төлөв: Хүлээгдэж байна
Proxy тодорхойлолт: ...

## 3. Ретроспектив (Г.Нармандах)
Төлөв: Хүлээгдэж байна
Огноо, оролцогч: ...
### Юу сайн болсон бэ?
### Юу сайжруулах шаардлагатай вэ?
### Дараагийн удаа юуг өөрчлөх вэ?
### Action items
| № | Action item | Хариуцагч | Хугацаа | Шалгуур |

## Нийт дүгнэлт
[Сүүлийн ээлжид бөглөнө]
```
