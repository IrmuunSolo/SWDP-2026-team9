# Локал хөгжүүлэлтийн орчин

Бүх команд Windows PowerShell дээр. `npm.cmd` нь PowerShell-ийн npm.ps1 execution policy-оос хамаарахгүй. Global Nest CLI, Python эсвэл global Prisma суулгах шаардлагагүй.

## Нэг удаа суулгах зүйл

| Технологи      | Хувилбар ба зориулалт                           | Албан ёсны таталт                                              |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| Git            | 2.x, branch/commit/PR                           | https://git-scm.com/downloads/win                              |
| Node.js        | 24.x LTS, npm 11.x; Лаб 7-тай ижил major        | https://nodejs.org/en/download                                 |
| VS Code        | Код бичих, Git diff                             | https://code.visualstudio.com/download                         |
| Docker Desktop | PostgreSQL 17 + Mailpit; WSL 2 Linux containers | https://docs.docker.com/desktop/setup/install/windows-install/ |

Docker-ийн Windows/WSL шаардлага, лицензийг албан ёсны суулгагчийн заавраар шалга. Суулгасны дараа Docker Desktop-оо нээж engine бэлэн болгоно. Git тохиргоонд өөрийн нэр, GitHub бүртгэлийн и-мэйлийг ашиглана:

```powershell
git config --global user.name "Өөрийн нэр"
git config --global user.email "өөрийн GitHub и-мэйл"
git --version
node --version
npm.cmd --version
docker version
docker compose version
```

## Кодоо татах

Шинээр татах бол:

```powershell
git clone https://github.com/IrmuunSolo/SWDP-2026-team9.git
cd SWDP-2026-team9
```

Аль хэдийн татсан бол тэр хавтас руу орж `git status` шалга. Хадгалаагүй өөрчлөлтөө commit/stash хийсний дараа `git switch main`, `git pull --ff-only origin main` ажиллуул.

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run db:generate
npm.cmd run infra:up
npm.cmd run db:deploy
npm.cmd run build
```

`Copy-Item`-ийг эхний удаа л хийнэ; өөрийн тохируулсан `.env`-ийг дараа нь дарж бичихгүй. `npm ci` root `package-lock.json`-ийн хувилбарыг яг суулгана. Workspace бүрд тусдаа `npm install` ажиллуулахгүй.

root `.env` дахь `UNIVERSITY_EMAIL_DOMAINS` нь локал жишээнд `example.edu`. Бодит сургуулийн домэйныг PO-гоор батлуулаад жагсаалтаа таслалаар оруулна. Subdomain автоматаар зөвшөөрөгдөхгүй. `LOCATIONS` нь мөн жишиг байрны код; `packages/contracts/src/index.ts` дахь нэршлийг багтайгаа батална. Бодит хэрэглэгчийн өгөгдөл, нууц үгийг репод оруулахгүй.

## API ба вэб ажиллуулах

Repo root дээр хоёр terminal нээнэ:

```powershell
# Terminal 1
npm.cmd run dev:api
```

```powershell
# Terminal 2
npm.cmd run dev:web
```

| Хаяг                                      | Юуг шалгах                                                   |
| ----------------------------------------- | ------------------------------------------------------------ |
| http://localhost:5173                     | React апп                                                    |
| http://localhost:3000/api/v1/health       | API процесс ажиллаж байгаа эсэх                              |
| http://localhost:3000/api/v1/health/ready | PostgreSQL холболт                                           |
| http://localhost:3000/docs                | Swagger UI, ready/planned төлөв                              |
| http://localhost:3000/openapi.json        | Машин унших API гэрээ                                        |
| http://localhost:8025                     | Mailpit inbox; локал и-мэйл жинхэнэ гадаад хаяг руу гарахгүй |

Бүх browser URL-д **localhost** хэрэглэ; `127.0.0.1` ба localhost хооронд cookie/origin сольж ашиглахгүй. Vite `/api` хүсэлтийг 3000 порт руу proxy хийнэ. Frontend `.env`, API key хэрэггүй. Глобал host-д биш зөвхөн loopback-д сонсож байна.

Shared contract-д шинэ export/schema нэмсэн үед `npm.cmd run contract:generate` ажиллуулаад хоёр dev серверээ дахин эхлүүл. `dev:web` нь `--force` тохиргоогоор prebundle cache-г сэргээдэг. API портыг өөрчилсөн бол `API_PROXY_TARGET`-ийг шинэ API хаягтай тааруул; WEB_ORIGIN нь browser-ийн хаягтай яг ижил байна.

## Эхний туршилт

1. `/register` дээр `name@example.edu`, форматын шаардлага хангасан жишиг оюутны код, дор хаяж 12 тэмдэгт нууц үгээр бүртгүүл.
2. Mailpit inbox дахь холбоосыг нээж «Баталгаажуулах» дар. Холбоос 24 цаг хүчинтэй, нэг удаа хэрэглэгдэнэ.
3. Нэвтэрч LOST болон FOUND зар үүсгэ. GUARD сонговол байр шаардана. Гарсны дараа зарын API-д 401 ирэх ёстой.
4. Нууц үгийг 5 удаа буруу оруулбал 10 минутын lock гарна. HTTP client-д body хоосон `{}`/schema-д тохирохгүй өгөгдөл 400 болно.

SMTP ажиллахгүй үед 503 гарна. `docker compose -p swdp-2026-team9 -f devops/compose.yaml logs mailpit` шалгаад серверээ асаасны дараа **ижил и-мэйл ба нууц үгээр** бүртгэлийг дахин явуулж холбоос авна. Нууц үг сэргээх урсгал MVP-ийн одоогийн хүрээнд байхгүй.

## Өдөр бүр ба main шинэчлэгдсэний дараа

```powershell
git pull --ff-only origin main
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:deploy
npm.cmd run check
npm.cmd test
```

Database owner Амарболд л `npm.cmd run db:migrate -- --name story_short_name` ажиллуулж migration үүсгэнэ. Бусад хүн нэгтгэсэн migration-ийг `db:deploy`-оор хэрэглэнэ. Өөрийн development DB рүү migration хийхэд л `db:migrate` хэрэглэ; хамтын/production DB-д `migrate dev`, `db push`, `reset` ажиллуулахгүй.

## Админ эрх ба үйлчилгээ зогсоох

Админ нь нийтийн register input-оор үүсэхгүй. Репог хариуцагч өөрийн DB дээр, урьдчилан баталгаажуулсан локал бүртгэлийг зориуд админ болгох бол:

```powershell
npm.cmd run db:admin -w @campusfind/api -- admin@example.edu
npm.cmd run infra:down
```

`infra:down` өгөгдлийн volume-ийг хадгална. Volume устгах нь өгөгдөл алдах үйлдэл; ердийн setup/алдаа засах зааварт `down -v` хэрэглэхгүй.

## Түгээмэл алдаа

| Шинж                                   | Шийдэл                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `docker` олдохгүй                      | Docker Desktop суулгаж terminal-аа дахин нээ                                                                    |
| 5432 порт эзлэгдсэн                    | Өөр PostgreSQL ажиллаж байгаа эсэхийг шалга; compose host порт ба DATABASE_URL-ийг хамт өөрчил                  |
| Prisma Client олдохгүй                 | Root-оос `npm.cmd run db:generate`                                                                              |
| DB холболт/хүснэгт олдохгүй            | `docker compose -p swdp-2026-team9 -f devops/compose.yaml ps`, `.env`, дараа нь `npm.cmd run db:deploy`         |
| 403 CSRF_REJECTED                      | Mutation-д `X-CampusFind: web`, зөв Origin; browser-д localhost ашигла                                          |
| 501                                    | Тухайн функц planned; багийн story дагуу хэрэгжүүлэх ажил                                                       |
| npm registry/Prisma binary татагдахгүй | Internet, proxy, firewall шалга; lockfile устгаж тойрохгүй                                                      |
| Windows мөр төгсгөлийн diff их         | `.gitattributes` LF; файлыг UTF-8 LF хадгал                                                                     |
| npm package өөрчлөх шаардлагатай       | Shared PR-аар root-оос `npm.cmd install package-name -w @campusfind/api` гэх мэт; root lockfile-ийг хамт commit |

Node dependency-ууд root `package-lock.json`-д түгжигдсэн. Prisma 6.19.3-тай таарах schema ашиглаж байгаа; major шинэчлэл хийх бол тусдаа ADR/PR. `deepmerge-ts`-ийн security override-ийг root package.json-д хадгалсан бөгөөд Prisma generate/validate-тай хамт шалгана.
