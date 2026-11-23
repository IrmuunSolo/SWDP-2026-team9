# Баг 9 — Лаборатори 10: Minikube орчинд Deployment, Service үүсгэх

**Гарын авлага:** Лаборатори 9 (10-р долоо хоног, Лекц 10) · CLO4 · 2 цаг
**Дараалал:** Г.Нармандах → Л.Ирмүүн → Э.Амарболд
**Branch:** `lab10/narmandakh-k8s-infra` → `lab10/irmuun-api-deployment` → `lab10/amarbold-web-service`
**Manifest-ийн хавтас:** `devops/k8s/` · **Нотолгоо:** `labs/lab10/` · **Тайлан:** `labs/docx/Lab10_report_team9.md`

## 1. Зорилго ба deliverable

Лаб 9-ийн Docker image-ээр CampusFind-ийг Minikube дээр ажиллуулна. API-г 3 replica-тай Deployment болгож, Service-ээр нээнэ. Нэг Pod-ийг устгаж Kubernetes автоматаар сэргээж байгааг (self-healing) баталгаажуулна.

**Багшид өгөх:** `deployment.yaml` + `service.yaml` + 2 screenshot (apply хийгээд 3 Pod ажиллаж байгаа, Pod устгасны дараа шинээр үүссэн).

## 2. Бүтэц ба хуваарилалт

```
devops/k8s/
  infra.yaml            Нармандах — ConfigMap, Secret, Postgres, Mailpit (+Service)
  migrate-job.yaml      Нармандах — Prisma migration Job
  deployment.yaml       Ирмүүн    — API Deployment, replicas: 3
  service.yaml          Ирмүүн    — api Service; Амарболд — web Service нэмнэ
  web-deployment.yaml   Амарболд  — Web (Vite) Deployment
labs/lab10/
  01-apply-pods.png     Ирмүүн    — 3 API Pod Running
  02-self-healing.png   Ирмүүн    — устгасан Pod-ийн оронд шинэ Pod
  03-app-browser.png    Амарболд  — minikube service-ээр нээсэн апп
  *.txt                 гишүүн бүрийн kubectl гаралт
```

| Ээлж | Гишүүн | Ажил | Reviewer |
| --- | --- | --- | --- |
| 1 | Г.Нармандах | Minikube орчин, image build, `infra.yaml`, `migrate-job.yaml`, тайлангийн загвар | Л.Ирмүүн |
| 2 | Л.Ирмүүн | `deployment.yaml`, `service.yaml` (api), apply, self-healing, 01–02 screenshot | Э.Амарболд |
| 3 | Э.Амарболд | `web-deployment.yaml`, web Service, `minikube service`, бүтэн урсгал, 03 screenshot, нийт дүгнэлт | Г.Нармандах |

Production код өөрчлөхгүй. Лаб 9-ийн `Dockerfile`-ийг тэр хэвээр ашиглана.

## 3. Нийтлэг бэлтгэл (гишүүн бүр)

Docker engine асаалттай байна: Windows — Docker Desktop, macOS — Colima (`colima start --cpu 4 --memory 6`), Fedora — Podman эсвэл Docker. Minikube болон kubectl суулгана:

| OS | Суулгах |
| --- | --- |
| Windows | `winget install Kubernetes.minikube Kubernetes.kubectl` |
| macOS | `brew install minikube kubectl` |
| Fedora | [minikube суулгах заавар](https://minikube.sigs.k8s.io/docs/start/), `sudo dnf install kubectl` |

```
minikube start --driver=docker --cpus=4 --memory=6g
kubectl get nodes
```

`kubectl get nodes` нь `minikube   Ready` гэж харуулна. Podman ашиглавал `--driver=podman`.

Image-ийг minikube дотор build хийнэ. Ингэснээр registry руу push хийх шаардлагагүй:

```
minikube image build -t campusfind:lab10 .
minikube image ls | grep campusfind
```

PowerShell дээр `grep`-ийн оронд `Select-String campusfind` ашиглана. Manifest-ууд `imagePullPolicy: Never` ашигладаг тул image minikube дотор байх ёстой. Код өөрчлөгдсөн бол image-ийг дахин build хийнэ.

## 4. 1-р ээлж — Г.Нармандах: infra

### 4.1. `devops/k8s/infra.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: campusfind-config
data:
  NODE_ENV: development
  HOST: 0.0.0.0
  PORT: '3000'
  UNIVERSITY_EMAIL_DOMAINS: example.edu
  WEB_ORIGIN: http://localhost:15173
  SMTP_HOST: mailpit
  SMTP_PORT: '1025'
  SMTP_SECURE: 'false'
  MAIL_FROM: CampusFind <noreply@example.edu>
---
# Зөвхөн локал лабын утга. Бодит нууц үг commit хийхгүй.
apiVersion: v1
kind: Secret
metadata:
  name: campusfind-db
type: Opaque
stringData:
  POSTGRES_PASSWORD: local_dev_only
  DATABASE_URL: postgresql://campusfind:local_dev_only@postgres:5432/campusfind?schema=public
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  labels:
    app: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:17-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: campusfind
            - name: POSTGRES_DB
              value: campusfind
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: campusfind-db
                  key: POSTGRES_PASSWORD
          readinessProbe:
            exec:
              command: ['pg_isready', '-U', 'campusfind', '-d', 'campusfind']
            periodSeconds: 5
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: postgres-data
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mailpit
  labels:
    app: mailpit
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mailpit
  template:
    metadata:
      labels:
        app: mailpit
    spec:
      containers:
        - name: mailpit
          image: axllent/mailpit:v1.27
          ports:
            - containerPort: 1025
            - containerPort: 8025
---
apiVersion: v1
kind: Service
metadata:
  name: mailpit
spec:
  selector:
    app: mailpit
  ports:
    - name: smtp
      port: 1025
      targetPort: 1025
    - name: web
      port: 8025
      targetPort: 8025
```

### 4.2. `devops/k8s/migrate-job.yaml`

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: campusfind-migrate
spec:
  backoffLimit: 6
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: migrate
          image: campusfind:lab10
          imagePullPolicy: Never
          command: ['npm', 'run', 'db:deploy']
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: campusfind-db
                  key: DATABASE_URL
```

Postgres бэлэн болохоос өмнө ажиллавал Job өөрөө дахин оролдоно (`backoffLimit: 6`).

### 4.3. Ажиллуулах ба шалгах

```
kubectl apply -f devops/k8s/infra.yaml
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s
kubectl apply -f devops/k8s/migrate-job.yaml
kubectl wait --for=condition=complete job/campusfind-migrate --timeout=180s
kubectl logs job/campusfind-migrate
kubectl get pods,svc
```

Гаралтыг `labs/lab10/narmandakh-infra.txt`-д хадгална. Migration log-д `All migrations have been successfully applied` эсвэл `No pending migrations` гарна.

Job-ийг дахин ажиллуулах шаардлагатай бол: `kubectl delete job campusfind-migrate`, тэгээд дахин `apply`.

### 4.4. Тайлангийн загвар ба PR

`labs/docx/Lab10_report_team9.md`-ийг 9-р хэсгийн загвараар үүсгэж, өөрийн хэсгийг бөглөнө. Бусдынх «Хүлээгдэж байна».

```
git add devops/k8s/infra.yaml devops/k8s/migrate-job.yaml labs/lab10 labs/docx/Lab10_report_team9.md
git commit -m "feat(lab10): add Kubernetes infra manifests and migration job"
git push -u origin lab10/narmandakh-k8s-infra
```

PR reviewer: Л.Ирмүүн.

## 5. 2-р ээлж — Л.Ирмүүн: API Deployment, Service, self-healing

### 5.1. `devops/k8s/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: campusfind-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: campusfind-api
  template:
    metadata:
      labels:
        app: campusfind-api
    spec:
      containers:
        - name: api
          image: campusfind:lab10
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: campusfind-config
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: campusfind-db
                  key: DATABASE_URL
          readinessProbe:
            httpGet:
              path: /api/v1/health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /api/v1/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 10
          resources:
            requests:
              cpu: 100m
              memory: 192Mi
            limits:
              memory: 512Mi
```

### 5.2. `devops/k8s/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: campusfind-api
  ports:
    - port: 3000
      targetPort: 3000
```

Service-ийн нэр `api` нь web-ийн proxy (`http://api:3000`) болон Лаб 9-ийн Compose-ийн нэртэй ижил.

### 5.3. Ажиллуулах ба screenshot

Нармандахын PR merge болсны дараа main-аа шинэчилж, 3-р хэсгийн бэлтгэл болон 4.3-ыг өөрийн машин дээр давтаж infra-г асаана. Дараа нь:

```
kubectl apply -f devops/k8s/deployment.yaml -f devops/k8s/service.yaml
kubectl rollout status deployment/api --timeout=180s
kubectl get deployment api
kubectl get pods -l app=campusfind-api -o wide
```

`READY 3/3`, 3 Pod `Running` болсон үед **`labs/lab10/01-apply-pods.png`** авна. Зурагт `kubectl apply` болон `kubectl get pods`-ийн гаралт харагдана.

Self-healing:

```
kubectl get pods -l app=campusfind-api
kubectl delete pod <api-pod-нэр>
kubectl get pods -l app=campusfind-api
```

Устгасан Pod `Terminating`, шинэ Pod `ContainerCreating` → `Running` болж, нийт 3 Pod сэргэсэн үед **`labs/lab10/02-self-healing.png`** авна. Зурагт устгасан Pod-ийн нэр болон шинэ Pod-ийн бага `AGE` харагдана.

API ажиллаж байгааг шалгах:

```
kubectl port-forward service/api 13000:3000
curl http://localhost:13000/api/v1/health/ready
```

`{"data":{"status":"ready"}}` гарна. Port-forward-ийг `Ctrl+C`-ээр зогсооно. Командуудын гаралтыг `labs/lab10/irmuun-api.txt`-д хадгална.

### 5.4. PR

Тайлангийн өөрийн хэсгийг бөглөж `lab10/irmuun-api-deployment` branch-аас PR нээнэ. Reviewer: Э.Амарболд.

## 6. 3-р ээлж — Э.Амарболд: Web, гаднаас хандах, нийт шалгалт

### 6.1. `devops/k8s/web-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: campusfind-web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: campusfind-web
  template:
    metadata:
      labels:
        app: campusfind-web
    spec:
      containers:
        - name: web
          image: campusfind:lab10
          imagePullPolicy: Never
          command: ['npm', 'run', 'dev', '-w', '@campusfind/web', '--', '--host', '0.0.0.0']
          ports:
            - containerPort: 5173
          env:
            - name: API_PROXY_TARGET
              value: http://api:3000
```

### 6.2. `devops/k8s/service.yaml`-д web Service нэмэх

Файлын төгсгөлд нэмнэ:

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: NodePort
  selector:
    app: campusfind-web
  ports:
    - port: 5173
      targetPort: 5173
```

### 6.3. Ажиллуулах ба хандах

Бүх manifest-ийг өөрийн машин дээр дарааллаар нь apply хийнэ (4.3, 5.3-ын командууд). Дараа нь:

```
kubectl apply -f devops/k8s/web-deployment.yaml -f devops/k8s/service.yaml
kubectl rollout status deployment/web --timeout=180s
minikube service web --url
```

Гарсан URL-ийг browser-оор нээж нүүр хуудас харагдсан үед **`labs/lab10/03-app-browser.png`** авна.

**Бүртгэл, нэвтрэлт шалгах бол:** API нь `WEB_ORIGIN`-оор CSRF origin шалгадаг. URL-аа тохируулна:

```
kubectl set env deployment/api WEB_ORIGIN=<minikube service web --url-ийн гаралт>
kubectl rollout status deployment/api
```

Mailpit: `kubectl port-forward service/mailpit 18025:8025` → `http://localhost:18025`.

### 6.4. Тайлангийн нийт дүгнэлт, PR

Тайланд өөрийн хэсэг, нийт дүгнэлт (Docker Compose-оос Kubernetes руу юу өөрчлөгдсөн, self-healing-ийн ажиглалт, хязгаарлалт), дуусах огноог бичнэ. PR reviewer: Г.Нармандах.

Ажил дууссаны дараа цэвэрлэх: `kubectl delete -f devops/k8s/`, `minikube stop`.

## 7. Түгээмэл алдаа

| Шинж | Шалгах зүйл |
| --- | --- |
| `ErrImageNeverPull` | Image minikube дотор build хийгдээгүй: `minikube image build -t campusfind:lab10 .` |
| API Pod `0/1 Running`, readiness fail | Postgres бэлэн эсэх, migration Job дууссан эсэх: `kubectl logs job/campusfind-migrate` |
| `CrashLoopBackOff` | `kubectl logs <pod>`, `kubectl describe pod <pod>`; `DATABASE_URL`, `UNIVERSITY_EMAIL_DOMAINS` тохирсон эсэх |
| Web нээгдэхгүй | `kubectl logs deployment/web`; `API_PROXY_TARGET=http://api:3000`; NodePort Service байгаа эсэх |
| Бүртгэлд 403 | `WEB_ORIGIN` browser-ийн URL-тай яг таарах ёстой (6.3) |
| Minikube эхлэхгүй | Docker engine асаалттай эсэх; санах ой хүрэлцэх эсэх; `minikube delete` хийгээд дахин эхлүүлэх |

## 8. Шалгах хуудас

- [ ] `infra.yaml`, `migrate-job.yaml`, `deployment.yaml`, `service.yaml`, `web-deployment.yaml` commit хийгдсэн
- [ ] API Deployment `replicas: 3`, 3 Pod Running (`01-apply-pods.png`)
- [ ] Pod устгасны дараа автоматаар сэргэсэн (`02-self-healing.png`)
- [ ] `minikube service`-ээр апп нээгдсэн (`03-app-browser.png`)
- [ ] Гишүүн бүрийн kubectl гаралт `labs/lab10/`-д
- [ ] Тайлан гурван хэсэг, нийт дүгнэлттэй
- [ ] PR бүр өөр гишүүний review-тай

## 9. Тайлангийн загвар (`labs/docx/Lab10_report_team9.md`)

```markdown
# Лаборатори 10 — Minikube орчинд Deployment, Service үүсгэх

**Баг:** 9 · **Төсөл:** CampusFind / SWDP-2026-team9
**Огноо:** [эхэлсэн] – [дууссан] · **Дараалал:** Г.Нармандах → Л.Ирмүүн → Э.Амарболд
**Орчин:** [гишүүн бүрийн OS, Minikube, kubectl хувилбар]

## Зорилго
Лаб 9-ийн Docker image-ээр CampusFind-ийг Minikube дээр ажиллуулж, API-г 3 replica-тай Deployment, Service болгон нээж, self-healing-ийг баталгаажуулах.

## Г.Нармандах — Infra (Postgres, Mailpit, Secret, ConfigMap, migration)
Төлөв: Хүлээгдэж байна

## Л.Ирмүүн — API Deployment, Service, self-healing
Төлөв: Хүлээгдэж байна

## Э.Амарболд — Web, гаднаас хандах, нийт шалгалт
Төлөв: Хүлээгдэж байна

## Нотолгоо
![3 API Pod ажиллаж байгаа](../lab10/01-apply-pods.png)
![Устгасан Pod-ийн оронд шинэ Pod](../lab10/02-self-healing.png)
![Minikube service-ээр нээсэн апп](../lab10/03-app-browser.png)

## Нийт дүгнэлт
[Сүүлийн ээлжид бөглөнө]
```
