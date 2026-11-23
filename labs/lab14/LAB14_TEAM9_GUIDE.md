# Баг 9 — Лаборатори 14: Prometheus, Grafana ашиглан хяналтын самбар

**Гарын авлага:** Лаборатори 13 (14-р долоо хоног, Лекц 14) · CLO4 · 2 цаг
**Дараалал:** Г.Нармандах → Э.Амарболд → Л.Ирмүүн
**Branch:** `lab14/narmandakh-metrics-endpoint` → `lab14/amarbold-prometheus-grafana` → `lab14/irmuun-dashboard`
**Нотолгоо:** `labs/lab14/` · **Тайлан:** `labs/docx/Lab14_report_team9.md`

## 1. Зорилго ба deliverable

1. Апп, Prometheus, Grafana-г Docker Compose-оор нэг дор ажиллуулах.
2. Аппаас **2-оос доошгүй metric** (хүсэлтийн тоо, хариу өгөх хугацаа) цуглуулж Prometheus-т холбох.
3. Grafana дээр **3-аас доошгүй panel**-тэй dashboard үүсгэх, нэг **alert rule** тохируулах.
4. Хиймэл ачаалал үүсгэж dashboard real-time өөрчлөгдөж байгааг screenshot-оор баталгаажуулах.

**Багшид өгөх:** compose файл + dashboard screenshot + богино тайлбар.

Порт: Prometheus `localhost:9090`, Grafana `localhost:3001`, API `localhost:13000`, Web `localhost:15173`. Лаб 9-ийн `devops/compose.lab09.yaml`-ийг суурь болгоно.

## 2. Хуваарилалт

| Ээлж | Гишүүн | Ажил | Reviewer |
| --- | --- | --- | --- |
| 1 | Г.Нармандах | Backend-д `GET /metrics` endpoint, 2 metric (`http_requests_total`, `http_request_duration_seconds`) + default process metric | Э.Амарболд |
| 2 | Э.Амарболд | `devops/compose.lab14.yaml` (Prometheus, Grafana), `prometheus.yml`, alert rule, Grafana datasource provisioning | Л.Ирмүүн |
| 3 | Л.Ирмүүн | 3+ panel dashboard, JSON export, ачааллын скрипт, screenshot, нийт дүгнэлт | Г.Нармандах |

## 3. 1-р ээлж — Г.Нармандах: `/metrics` endpoint

### 3.1. Dependency

Prometheus-ийн албан ёсны Node.js client `prom-client`-ийг ашиглана.

```
git switch main
git pull --ff-only origin main
git switch -c lab14/narmandakh-metrics-endpoint
npm install prom-client@15 -w @campusfind/api
npm audit --omit=dev
```

`package.json`, `package-lock.json` хоёулаа өөрчлөгдөнө. Audit-д шинэ High/Critical гарвал тайланд тэмдэглэнэ (Лаб 12-ын дүрэм).

### 3.2. `backend/src/common/metrics.ts`

```ts
import type { INestApplication } from '@nestjs/common';
import type { Express, NextFunction, Request, Response } from 'express';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

const labelNames = ['method', 'route', 'status_code'] as const;

export const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames,
  registers: [registry],
});

export const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [registry],
});

export function configureMetrics(app: INestApplication) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/metrics') {
      next();
      return;
    }
    const stop = httpDuration.startTimer();
    res.on('finish', () => {
      const matched = (req.route as { path?: string } | undefined)?.path;
      const labels = {
        method: req.method,
        route: matched ? `${req.baseUrl}${matched}` : 'unmatched',
        status_code: String(res.statusCode),
      };
      httpRequests.inc(labels);
      stop(labels);
    });
    next();
  });

  const server = app.getHttpAdapter().getInstance() as Express;
  server.get('/metrics', (_req: Request, res: Response) => {
    void registry.metrics().then((body) => {
      res.setHeader('Content-Type', registry.contentType);
      res.end(body);
    });
  });
}
```

Санамж:

- `route` label-д бодит URL (`/api/v1/posts/8f3c…`) биш **route pattern** (`/api/v1/posts/:id`) орно. Ингэснээр ID бүр шинэ time series үүсгэхгүй (high cardinality-гаас сэргийлнэ).
- `/metrics` нь global prefix (`api/v1`)-ээс гадуур, гарын авлагад заасан `/metrics` зам дээр байна.
- Хэрэглэгчийн и-мэйл, token зэрэг хувийн мэдээллийг label-д оруулахгүй.
- Production-д `/metrics`-ийг зөвхөн дотоод сүлжээнд нээх ёстойг тайланд дурдана. Энэ лаб локал орчинд ажиллана.

### 3.3. Холбох

`backend/src/app.ts`-ийн `configureApp` дотор `app.setGlobalPrefix('api/v1');`-ийн дараа, CSRF middleware-ээс **өмнө** дуудна. Ингэснээр 403, 429 хариунууд ч тоологдоно:

```ts
import { configureMetrics } from './common/metrics';
// ...
  app.setGlobalPrefix('api/v1');
  configureMetrics(app);
```

### 3.4. Шалгах

```
npm run check
npm test
npx --no-install eslint backend --max-warnings=0
docker compose -f devops/compose.lab09.yaml up -d --build
curl -s http://localhost:13000/api/v1/health
curl -s http://localhost:13000/metrics | grep -E "^http_request"
```

Гаралтад `http_requests_total{method="GET",route="/api/v1/health",status_code="200"} 1` маягийн мөр гарна. Гаралтыг `labs/lab14/narmandakh-metrics.txt`-д хадгална. ESLint `req.route`-ийн төрлөөс болж алдаа өгвөл `any` ашиглахгүйгээр төрлийг нарийсгана.

`labs/docx/Lab14_report_team9.md`-ийг 7-р хэсгийн загвараар үүсгэж өөрийн хэсгийг бөглөнө. PR reviewer: Э.Амарболд.

## 4. 2-р ээлж — Э.Амарболд: Prometheus, Grafana, alert

### 4.1. Файлын бүтэц

```
devops/
  compose.lab14.yaml
  prometheus/
    prometheus.yml
    alert.rules.yml
  grafana/
    provisioning/
      datasources/prometheus.yaml
      dashboards/campusfind.yaml
    dashboards/            (Ирмүүн JSON-оо энд хадгална)
```

### 4.2. `devops/compose.lab14.yaml`

Лаб 9-ийн compose-ийг давхарлаж (override) ажиллуулна. Апп, Postgres, Mailpit хэвээрээ.

```yaml
services:
  prometheus:
    image: prom/prometheus:v3.5.0
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.retention.time=2d
    volumes:
      - ./prometheus:/etc/prometheus:ro
      - lab14_prometheus:/prometheus
    ports:
      - '127.0.0.1:9090:9090'
    depends_on:
      api:
        condition: service_healthy

  grafana:
    image: grafana/grafana:12.1.0
    environment:
      GF_USERS_ALLOW_SIGN_UP: 'false'
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
      - lab14_grafana:/var/lib/grafana
    ports:
      - '127.0.0.1:3001:3000'
    depends_on:
      - prometheus

volumes:
  lab14_prometheus:
  lab14_grafana:
```

### 4.3. `devops/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 5s
  evaluation_interval: 5s

rule_files:
  - /etc/prometheus/alert.rules.yml

scrape_configs:
  - job_name: campusfind-api
    metrics_path: /metrics
    static_configs:
      - targets: ['api:3000']
```

### 4.4. `devops/prometheus/alert.rules.yml`

```yaml
groups:
  - name: campusfind
    rules:
      - alert: CampusFindApiDown
        expr: up{job="campusfind-api"} == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: CampusFind API scrape хийгдэхгүй байна
      - alert: CampusFindHighRequestRate
        expr: sum(rate(http_requests_total[1m])) > 5
        for: 30s
        labels:
          severity: warning
        annotations:
          summary: Минутад дунджаар секундэд 5-аас олон хүсэлт ирж байна
```

Хоёр дахь дүрэм нь ачааллын тестээр санаатай өдөөж шалгах зориулалттай. Threshold-ийг тайланд тайлбарлана.

### 4.5. Grafana provisioning

`devops/grafana/provisioning/datasources/prometheus.yaml`:

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    uid: prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

`devops/grafana/provisioning/dashboards/campusfind.yaml`:

```yaml
apiVersion: 1
providers:
  - name: campusfind
    folder: CampusFind
    type: file
    options:
      path: /var/lib/grafana/dashboards
```

`devops/grafana/dashboards/.gitkeep` хоосон файл нэмнэ.

### 4.6. Ажиллуулах, шалгах

```
git switch main
git pull --ff-only origin main
git switch -c lab14/amarbold-prometheus-grafana
docker compose -f devops/compose.lab09.yaml -f devops/compose.lab14.yaml config --quiet
docker compose -f devops/compose.lab09.yaml -f devops/compose.lab14.yaml up -d --build
docker compose -f devops/compose.lab09.yaml -f devops/compose.lab14.yaml ps
```

Fedora/Podman дээр `docker compose`-ийн оронд `podman compose`. SELinux-ийн улмаас volume уншигдахгүй бол mount-ийн төгсгөлд `:ro,Z` гэж бичнэ.

- `http://localhost:9090/targets` → `campusfind-api` **UP**. Screenshot: `labs/lab14/01-prometheus-targets.png`.
- `http://localhost:9090/alerts` → хоёр дүрэм харагдана. Screenshot: `labs/lab14/02-prometheus-alerts.png`.
- `http://localhost:3001` → анхны нэвтрэлт `admin` / `admin`, дараа нь шинэ нууц үг тохируулна (нууц үгийг repo-д бичихгүй). Connections → Data sources → Prometheus → **Save & test** амжилттай.

Тайлангийн өөрийн хэсгийг бөглөж PR нээнэ. Reviewer: Л.Ирмүүн.

## 5. 3-р ээлж — Л.Ирмүүн: dashboard, ачаалал, дүгнэлт

### 5.1. Dashboard (3+ panel)

Grafana → Dashboards → New → Add visualization → Prometheus:

| Panel | Төрөл | PromQL |
| --- | --- | --- |
| Хүсэлтийн хурд (route-аар) | Time series | `sum by (route) (rate(http_requests_total[1m]))` |
| Хариу өгөх хугацаа p95 | Time series | `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[1m])))` |
| 4xx/5xx хувь | Stat | `sum(rate(http_requests_total{status_code=~"4..\|5.."}[1m])) / sum(rate(http_requests_total[1m]))` |
| Санах ой (нэмэлт) | Time series | `process_resident_memory_bytes{job="campusfind-api"}` |

Grafana-ийн query талбарт `\|`-ийн оронд `|` гэж бичнэ (markdown хүснэгтийн escape). Dashboard-ийг «CampusFind API» нэрээр хадгалж, refresh-ийг `5s`, хугацааг `Last 15 minutes` болгоно. Share → Export → JSON-ийг `devops/grafana/dashboards/campusfind-api.json` нэрээр хадгална. Дараагийн `up` хийхэд автоматаар ачаалагдана.

### 5.2. Хиймэл ачаалал

`labs/lab14/load.mjs`:

```js
const base = process.env.API_URL ?? 'http://localhost:13000';
const paths = ['/api/v1/health', '/api/v1/health/ready', '/api/v1/does-not-exist'];
const total = Number(process.argv[2] ?? 600);

let done = 0;
for (let i = 0; i < total; i += 1) {
  const response = await fetch(base + paths[i % paths.length]);
  await response.arrayBuffer();
  done += 1;
  if (done % 100 === 0) console.log(`${done}/${total}`);
  await new Promise((resolve) => setTimeout(resolve, 50));
}
console.log(`Нийт ${done} хүсэлт илгээв`);
```

```
git switch main
git pull --ff-only origin main
git switch -c lab14/irmuun-dashboard
node labs/lab14/load.mjs 1200
```

`/does-not-exist` нь 404 буцааж 4xx panel-ийг хөдөлгөнө. Секундэд ~20 хүсэлт тул `CampusFindHighRequestRate` alert эхлээд **Pending**, 30 секундын дараа **Firing** болно.

### 5.3. Screenshot

| Файл | Юу харагдах |
| --- | --- |
| `labs/lab14/03-dashboard-idle.png` | Ачааллын өмнөх dashboard |
| `labs/lab14/04-dashboard-load.png` | Ачааллын үеийн dashboard (графикууд өссөн) |
| `labs/lab14/05-alert-firing.png` | `localhost:9090/alerts` дээр Firing төлөв |

### 5.4. Нийт дүгнэлт

Metric-ийн сонголт, ачааллын үр дүн (p95 ойролцоогоор хэд байсан, 4xx хувь), alert ажилласан эсэх, сайжруулах санааг тайланд бичнэ. Хийгдээгүй зүйл байвал шалтгаантай нь тэмдэглэнэ. PR reviewer: Г.Нармандах.

## 6. Шалгах хуудас

- [ ] `GET /metrics` Prometheus text format буцаана; 2+ өөр metric
- [ ] `route` label нь pattern, хувийн мэдээлэлгүй
- [ ] `docker compose ... up` нэг командаар апп, Prometheus, Grafana асна
- [ ] Prometheus target UP, alert rule ачаалагдсан
- [ ] Grafana datasource ажилласан, 3+ panel-тэй dashboard JSON repo-д
- [ ] Ачааллын өмнө/үеийн screenshot, alert Firing screenshot
- [ ] `npm run check`, `npm test`, ESLint ногоон; Grafana-ийн нууц үг commit хийгдээгүй
- [ ] PR бүр өөр гишүүний review-тай

## 7. Тайлангийн загвар (`labs/docx/Lab14_report_team9.md`)

```markdown
# Лаборатори 14 — Prometheus, Grafana ашиглан хяналтын самбар

**Баг:** 9 · **Төсөл:** CampusFind / SWDP-2026-team9
**Огноо:** [эхэлсэн] – [дууссан] · **Дараалал:** Г.Нармандах → Э.Амарболд → Л.Ирмүүн

## Зорилго
Аппын metrics-ийг Prometheus-оор цуглуулж, Grafana dashboard болон alert-аар хянах.

## Архитектур
API (`/metrics`) ← scrape 5s ← Prometheus (:9090, alert rules) ← datasource ← Grafana (:3001)

## Г.Нармандах — `/metrics` endpoint
Төлөв: Хүлээгдэж байна
| Metric | Төрөл | Label | Утга |

## Э.Амарболд — Prometheus, Grafana, alert
Төлөв: Хүлээгдэж байна

## Л.Ирмүүн — Dashboard, ачаалал
Төлөв: Хүлээгдэж байна
![Ачааллын өмнө](../lab14/03-dashboard-idle.png)
![Ачааллын үед](../lab14/04-dashboard-load.png)
![Alert](../lab14/05-alert-firing.png)

## Нийт дүгнэлт
[Сүүлийн ээлжид бөглөнө]
```
