# GitHub тохиргоог maintainer хийх

Энэ файл нь хийх заавар; remote repo-ийн Settings/Projects-д автоматаар өөрчлөлт хийгдээгүй.

## Main хамгаалах

Repo Settings → Rules → Rulesets (эсвэл Branches → Branch protection) → main-д зориулсан rule. Repo-ийн plan/visibility-аас сонголтын боломж хамаарна.

1. Pull Request заавал, дор хаяж 1 approval.
2. Шинэ commit орвол өмнөх approval-г хуучирсанд тооцох; conversation resolved байх.
3. Required checks: одоо байгаа `CampusFind checks`, шинэ workflow анх ажилласны дараа гарч ирэх `Foundation checks` нэрийг сонго. Main up-to-date байх шаардлага идэвхжүүл.
4. Force push ба branch deletion-ийг main дээр хоригло. Боломжтой бол maintainer bypass-ийг мөн хязгаарла.
5. Squash merge-ийг багийн default болго. Main-д push хийхээс өмнө setting-ээ баталгаажуул; CI yaml файл өөрөө branch protection-ийг асаадаггүй.

Албан ёсны тайлбар: [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

## CODEOWNERS

`.github/CODEOWNERS` нь `frontend/`, `packages/contracts/` хавтаст @IrmuunSolo-г owner болгосон. Нармандахын username тайланд `Narmandah-cyber` гэж байгаа ч одоогийн collaborator permission-ийг шалгаагүй; Амарболдын username баталгаажаагүй. Нэрийг тааж CODEOWNERS-д оруулаагүй. Contributor-уудын GitHub username, write access-ийг maintainer баталгаажуулсны дараа DELIVERY_PLAN-ийн хавтасны хуваариар мөрүүд нэмнэ. GitHub owner автомат reviewer болохын тулд write эрхтэй байх ёстой.

Ирмүүн өөрийн shared PR-ийг review хийж чадахгүй тул бусад гишүүнийг тусдаа reviewer-ээр сонгоно. Гурван хүний багт нэг account-ыг заавал approve owner болгож түгжихээс болгоомжил: require-code-owner-review-г owner map бүрэн болсны дараа асаах эсвэл нэг ердийн approval-г required байлга.

## GitHub Projects

- Үндсэн 15 issue-г хадгалж, Assignees-д DELIVERY_PLAN-ийн owner, хичээлийн Sprint түүхийг хадгална. Үлдсэн ажлын Week Block=8-9/10-11/12-13/14-15, Layer=frontend/backend/database/devops, Assignee-г шинэ төлөвлөгөөгөөр онооно.
- Priority нь `high-must have`, `medium-should have`, `low - could have` гэсэн багийн одоогийн нэршилтэй байна; өмнөх утгыг давхар үүсгэхгүй.
- Sprint-ийг Status-тай холихгүй. Одоогийн `todo`, `in progress`, `done`, `in sprint 1`, `in spring 2/3/4` option-уудыг багийн шийдвэрээр жигдрүүл; байнгын Sprint view-г `Sprint` талбараар шүүнэ.
- Review үе шатыг хянахын тулд баг тохирвол Status-д `review` нэмэх эсвэл PR label ашиглах; In Progress/Review WIP=2. Trello нь Лаб 4-ийн симуляцийн нотолгоо, үндсэн product backlog GitHub Projects хэвээр.
- Task issue гаргавал эх User Story issue-г parent/link болго. SP-ийг дэд task-д давхар тооцохгүй.
- PR-ийг issue-тэй Development холбоосоор холбоно. `Refs #n` хэсэгчилсэн, `Closes #n` бүрэн дууссан PR-д хэрэглэ.

## Нэгдсэн ажил эхлэхээс өмнө

Гурван гишүүн repo-д write access-тэй, өөрийн credential хэрэглэдэг, shared account байхгүй; CI workflow ажиллах эрхтэй; main protection тохирсон; school domain болон campus code жагсаалт батлагдсан; PR reviewer map тохирсон байна. Сургуулийн жинхэнэ код/хэрэглэгчийн өгөгдлийг demo fixture болгож public commit хийхгүй.
