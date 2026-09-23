# Портал результатов измерений

MVP веб-портала для хранения записей об измерениях и связанных файлов.

## Возможности MVP

- схема PostgreSQL для `users`, `measurements`, `files`, `sessions`;
- последовательные SQL-миграции;
- CRUD API измерений;
- серверные фильтры и пагинация;
- один администратор и серверные сессии в `HttpOnly` cookie;
- защищённые `/api/measurements/*`;
- загрузка, замена, скачивание и удаление файлов любого типа до 10 МБ;
- приватный Yandex Object Storage через S3 API;
- backend-валидация и единый формат ошибок;
- readiness-проверки PostgreSQL и Object Storage;
- ограничение неудачных попыток входа и очистка просроченных сессий;
- OpenAPI 3.1 и Swagger UI;
- Docker-образ, автоматические production-миграции и резервное копирование;
- unit- и интеграционные тесты;
- React-интерфейс с таблицей, фильтрами и серверной пагинацией;
- создание, просмотр и редактирование записи в боковой панели;
- подтверждение удаления и управление файлами из интерфейса.

## Локальный запуск

Требования: Node.js 22+, npm и Docker.

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:migrate
npm run admin:create
npm run dev
```

Интерфейс разработки будет доступен на `http://localhost:5173`. Vite проксирует
API-запросы на `http://localhost:4000`.

Перед `npm run admin:create` задайте данные администратора только для этой команды:

```bash
ADMIN_LOGIN=admin ADMIN_PASSWORD='ваш-пароль' npm run admin:create
```

Повторный запуск с тем же логином безопасно меняет пароль. Для локальной разработки
допускается временный простой пароль, но перед публикацией используйте длинный уникальный пароль.

## Yandex Object Storage

Создайте приватный бакет и статический ключ сервисного аккаунта с доступом к объектам
этого бакета. Заполните в `.env`:

```text
YANDEX_STORAGE_ENDPOINT=https://storage.yandexcloud.net
YANDEX_STORAGE_REGION=ru-central1
YANDEX_STORAGE_BUCKET=имя-бакета
YANDEX_STORAGE_ACCESS_KEY_ID=идентификатор-ключа
YANDEX_STORAGE_SECRET_ACCESS_KEY=секретный-ключ
```

Проверка доступа без загрузки файла:

```bash
npm run storage:check
```

Полная проверка загрузки, скачивания и удаления временного файла:

```bash
npm run storage:smoke
```

Проверка состояния API:

```bash
curl http://localhost:4000/health
```

Проверки для оркестратора:

```text
GET /health/live   — процесс API запущен
GET /health/ready  — PostgreSQL и Yandex Object Storage доступны
```

Интерактивная документация API после запуска:

```text
http://localhost:4000/api/docs/
```

OpenAPI JSON:

```text
http://localhost:4000/api/openapi.json
```

## API авторизации

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Все endpoint'ы измерений и файлов требуют cookie, полученную при входе.

## API измерений

- `GET /api/measurements`
- `POST /api/measurements`
- `GET /api/measurements/:id`
- `PATCH /api/measurements/:id`
- `DELETE /api/measurements/:id`

Параметры списка: `page`, `pageSize`, `dateFrom`, `dateTo`, `sampleName`,
`sampleNumber`, `organization`, `customer`, `mode1`, `mode2`, `mode3`,
`isReference`, `isRepair`, `hasFile`.

Допустимые размеры страницы: `20`, `50`, `100`.

## API файлов

- `POST /api/measurements/:id/file` — `multipart/form-data`, поле `file`;
- `GET /api/measurements/:id/file`;
- `DELETE /api/measurements/:id/file`.

Разрешены файлы любого типа размером не более 10 МБ. Один файл на измерение;
повторная загрузка заменяет предыдущий.

## Проверки

```bash
npm test
npm run typecheck
npm run build
npm run test:integration
npm run test:integration:storage
```

Для интеграционных тестов PostgreSQL должен быть запущен, а миграции применены.

## Docker

PostgreSQL отдельно для локальной разработки:

```bash
docker compose up -d postgres
```

Полное приложение с автоматическим применением миграций:

```bash
docker compose up -d --build
docker compose ps
```

Портал будет доступен на `http://localhost:4000`, Swagger — на
`http://localhost:4000/api/docs/`. В production-сборке React-интерфейс раздаётся
тем же Express-сервером, поэтому отдельный веб-сервер не требуется.

## Production-развёртывание

Для production используется отдельный `compose.prod.yaml`:

- PostgreSQL доступен только во внутренней Docker-сети;
- API доступен только reverse proxy;
- Caddy публикует порты `80/443`, автоматически получает TLS-сертификат и
  перенаправляет HTTP на HTTPS;
- миграции применяются при запуске API;
- состояние PostgreSQL и сертификаты Caddy хранятся в Docker volumes.

На сервере скопируйте шаблон переменных и заполните его:

```bash
cp deploy/production.env.example .env
nano .env
```

Значение `DOMAIN` указывается без протокола, например `lablog.example.ru`.
Для `POSTGRES_PASSWORD` используйте длинный URL-safe пароль из букв и цифр,
поскольку он включается в строку подключения PostgreSQL. Файл `.env` нельзя
добавлять в Git.

Перед запуском DNS-запись домена должна указывать на сервер, а входящие порты
`80` и `443` должны быть открыты. Запуск:

```bash
docker compose -f compose.prod.yaml config --quiet
docker compose -f compose.prod.yaml up -d --build
docker compose -f compose.prod.yaml ps
```

Проверка после запуска:

```bash
curl https://ВАШ-ДОМЕН/health/ready
```

Создание или смена пароля администратора без сохранения пароля в истории shell:

```bash
read -rsp "Новый пароль администратора: " ADMIN_PASSWORD
echo
docker compose -f compose.prod.yaml exec \
  -e ADMIN_LOGIN=admin \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  api npm run admin:create:prod --workspace @measurement-portal/api
unset ADMIN_PASSWORD
```

### Автоматический deploy из GitHub

Workflow `.github/workflows/deploy.yml` при каждом push в `main` выполняет
typecheck, unit-тесты и production-сборку. Сам deploy изначально отключён, чтобы
push не завершался ошибкой до появления сервера.

После первого ручного развёртывания добавьте в GitHub repository secrets:

- `DEPLOY_HOST` — IP или домен сервера;
- `DEPLOY_USER` — пользователь Linux для deploy;
- `DEPLOY_SSH_KEY` — приватный ключ, разрешённый на сервере;
- `DEPLOY_KNOWN_HOSTS` — проверенная строка `known_hosts` сервера.

Добавьте repository variables:

- `DEPLOY_ENABLED=true` — включает автоматический deploy;
- `DEPLOY_PATH=/opt/lablog` — каталог репозитория на сервере;
- `DEPLOY_PORT=22` — SSH-порт сервера.

Production `.env` остаётся только на сервере и не передаётся через GitHub Actions.
При включённом deploy workflow подключается к серверу и запускает
`scripts/deploy-production.sh`, который обновляет `main`, пересобирает контейнеры
и ожидает успешный `/health/ready`.

## Резервное копирование PostgreSQL

```bash
npm run db:backup
```

Резервная копия в custom-формате PostgreSQL будет создана в каталоге `backups/`.
Этот каталог исключён из Git. В production копии необходимо дополнительно переносить
во внешнее защищённое хранилище и периодически проверять восстановление.

## Перед публикацией

- заменить временный пароль `admin/admin` длинным уникальным паролем;
- установить `NODE_ENV=production`, чтобы session cookie передавалась только по HTTPS;
- установить `TRUST_PROXY=true`, если API работает за доверенным reverse proxy;
- не добавлять `.env` и резервные копии в Git;
- закрыть порт PostgreSQL от внешней сети;
- включить HTTPS и настроить регулярное резервное копирование.
