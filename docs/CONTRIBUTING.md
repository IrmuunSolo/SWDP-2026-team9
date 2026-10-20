# Нэгдсэн branch ба PR MR заавар

GitHub дээр **Pull Request (PR)** гэж нэрлэдэг, GitLab-ийн ижил ойлголт нь **Merge Request (MR)**. Энэ repo GitHub ашигладаг тул PR нээнэ. Нэг story/task → нэг богино хугацааны branch → нэг review хийсэн PR. Main дээр шууд код бичиж push хийхгүй.

## Суурийг анх main-д оруулах

Энэ код одоо локал working tree-д байна. Эхлээд гурван гишүүн суурийн contract, file ownership-ийг уншаад bootstrap PR-ийг review хийнэ. Доорхийг repo root дээр ажиллуулна:

```powershell
git status
git switch -c chore/team-foundation
git add README.md AGENTS.md package.json package-lock.json frontend backend database devops packages scripts docs .github .env.example .gitignore .gitattributes .editorconfig .node-version .npmrc .prettierrc.json .prettierignore
git diff --cached --stat
git diff --cached --check
git commit -m "chore: establish CampusFind team foundation"
git push -u origin chore/team-foundation
```

GitHub → Pull requests → New pull request → base `main`, compare `chore/team-foundation`. Нармандах эсвэл Амарболдоор review хийлгэж, CI ногоон болсны дараа Squash and merge. Шинэ package/schema/contract бүх feature branch-д хэрэгтэй тул энэ PR-ийг эхэлж нэгтгэнэ. Өөрийн нэмэлт локал өөрчлөлт байвал `git add`-ын жагсаалтыг review хийж зөвхөн суурьтай холбоотой файлыг stage хийнэ.

## Өдөр тутмын жишээ

Ирмүүн US-09 хайлт хийх жишээ; бусад хүн story/нэрийг солино:

```powershell
git status
git switch main
git pull --ff-only origin main
git switch -c feat/w10-us09-frontend-search
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:deploy
```

Main руу switch хийхэд хадгалаагүй засвар байвал Git-ийн зогсоосон шалтгааныг шийднэ: одоогийн branch дээрээ commit хийх эсвэл `git stash push -m "wip before switching"` → дараа `git stash pop`. `reset --hard`, `clean -fd`-ээр алга болгохгүй.

Ирмүүн зөвхөн `frontend/src/features/posts/search/` UI-г бичнэ. Нармандах HTTP facade, Амарболд `database/src/queries/` query/index-ээ тусдаа PR-аар бичнэ. Shared contract нь эхэлж main-д орно.

```powershell
npm.cmd run check
npm.cmd test
git diff --check
git status
git add frontend/src/features/posts/search
git diff --cached
git commit -m "feat(posts): implement keyword search for US-09"
git push -u origin feat/w10-us09-frontend-search
```

Тест/баримт нэмж өөрчилсөн бол тэдгээрийн **тодорхой замыг** `git add`-д нэмнэ. Тест бичээгүй, хоосон frontend directory байвал command дахь замаа бодит файлуудтай тааруул. `git add .`-аар .env, санамсаргүй тайлан/зураг холихгүй.

## PR нээх ба review

1. GitHub → Compare & pull request. Base main зөв эсэхийг шалга. Эхлээд Draft нээж API/schema өөрчлөлтийг багт харуулж болно.
2. Гарчиг: `feat(posts): US-09 keyword search`. Template-д issue, scope, API ids, migration, шалгалтын үр дүн, UI зураг/жишээ request оруул.
3. Issue-г дуусгаж байгаа үед `Closes #9`; хэсэгчилсэн task бол `Refs #9` бич. Амжилтгүй CI байхад Done болгохгүй.
4. Reviewer: frontend Ирмүүн → API Нармандах; backend Нармандах → DB Амарболд; database/DevOps болон comments/admin Амарболд → Нармандах. UI гэрээнд Ирмүүн давхар review хийнэ. Availability муу бол гурав дахь хүн review хийнэ. Зохиогч өөрийн PR-ийг approve хийхгүй.
5. Reviewer зөвхөн approve дарахгүй: permission/бусдын өгөгдөл, acceptance criteria, schema, tests, UI-г шалгана. Change requested бол зохиогч ижил branch дээр засвар commit push хийж дахин review хүснэ; шинэ PR шаардлагагүй.
6. CI, нэг approval, бүх comment resolved, main-тай conflict-гүй бол Squash and merge. Shared PR-ийг холбогдох давхаргын owner-той тохирч reviewer/maintainer нэгтгэнэ; contract өөрчлөлтөд гурван давхаргын нөлөөг хамт шалгана.
7. Issue/Project статусыг `done` болгож acceptance/evidence холбоно. Branch-ийг GitHub-ийн Delete branch-аар хааж болно.

`gh` CLI суулгасан хүн ижил үйлдлийг `gh pr create --base main --head feat/w10-us09-frontend-search` гэж эхлүүлж болно; CLI заавал шаардахгүй.

## Main шинэчлэгдэхэд

```powershell
git fetch origin
git switch feat/w10-us09-frontend-search
git merge origin/main
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:deploy
npm.cmd run check
npm.cmd test
git push
```

Merge commit ашиглах тул нийтэд push хийсэн feature branch-д force push хийх шаардлагагүй. Dependency PR-ууд main-д орж дуусаагүй байхад dependent PR-ийг Draft байлгаж, blocker-ийг description-д бичнэ. Нэг гишүүний branch-аас нөгөө нь өөрийн feature branch-ийг удаан хугацаагаар салбарлуулахгүй.

## Conflict шийдвэрлэх

1. `git status`-аар файлуудаа хар. Common schema/config бол owner-тайгаа хамт шийднэ.
2. VS Code merge editor/diff-ээр хоёр өөрчлөлтийг уншиж, хоёулангийн зорилгыг хадгал. Blindly Accept Current/Incoming бүү сонго.
3. `<<<<<<<`, `=======`, `>>>>>>>` marker арилгаж, TypeScript, contract/schema хамаарлаа шалга.
4. Файл бүрийг тодорхой `git add path/to/file` хийж, `git diff --check`, `npm.cmd run check`, `npm.cmd test` ажиллуулаад `git commit -m "merge: integrate main and resolve ..."`, `git push`.

`package-lock.json` зөрчилдвөл хамаарлын өөрчлөлтүүдийг package.json дээр эхэлж нэгтгээд `npm.cmd install`-аар lockfile-ийг дахин бодож, diff-ээ review хийнэ. Lockfile-ийн мөрүүдийг гараар эвлүүлэхгүй. Migration хоёр зэрэг үүссэн бол нэгийг нь эхэлж merge; нөгөө branch latest main-аа авч өөрийн **нэгтгээгүй шинэ** migration-ийг local development DB дээр дахин үүсгэнэ. Main-д нэгэнт орсон migration-ийг дахин бичихгүй.

## Буцаах

Алдаатай merge-ийг түүх устгаж биш, шинэ revert PR-аар буцаана. Squash merge commit жишээ:

```powershell
git switch main
git pull --ff-only origin main
git switch -c revert/us09-search
git revert <squash-commit-sha>
npm.cmd run check
npm.cmd test
git push -u origin revert/us09-search
```

Дараа нь PR нээ. Түүхэнд жинхэнэ merge commit буцаах бол GitHub Revert эсвэл maintainer-ийн хамт `git revert -m 1`-ийг зөв parent-тэй хэрэглэнэ. DB migration буцаах асуудлыг code revert-тэй хамт шийднэ: production өгөгдөл устгах rollback хийхийн оронд forward repair migration хэрэгтэй байж болно.

## Нийтлэг файл ба давхаргын дүрэм

- Contract/Prisma/package/App shell-ийн өөрчлөлт → эхлээд shared PR, дараа dependent feature PR.
- Суурь helper өөрчлөх бол бусад модулийн unit/integration тестийг хамт ажиллуул.
- Нэг PR-д форматлах нэрээр бүх repo-г өөрчлөхгүй. LF, UTF-8, Prettier-ийг мөрдөнө.
- Password, .env, raw verification/session/SMTP secret, uploads, node_modules, dist commit хийхгүй.
- Тестээр батлагдсан approval нь main protection-ийн автомат enforcement-тэй хамт хэрэгтэй; тохиргоог [REPOSITORY_SETTINGS.md](REPOSITORY_SETTINGS.md)-аар maintainer хийнэ.
