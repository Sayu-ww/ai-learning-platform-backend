# Learning Platform - Backend

Backend API для платформы совместного обучения на базе NestJS.

## Технологический стек

- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Cache & Pub/Sub**: Redis 7
- **File Storage**: MinIO (S3-compatible)
- **Real-time**: Socket.IO
- **Authentication**: JWT + Passport
- **API Documentation**: OpenAPI/Swagger
- **Testing**: Vitest

## Начало работы

### Требования

- Node.js >= 20.0.0
- Docker & Docker Compose
- pnpm (рекомендуется) или npm

### Установка

1. Установите зависимости:

```bash
pnpm install
```

2. Скопируйте файл окружения:

```bash
cp .env.example .env
```

3. Запустите инфраструктуру:

```bash
docker-compose up -d
```

4. Сгенерируйте и примените миграции:

```bash
pnpm db:generate
pnpm db:migrate
```

5. Запустите сервер разработки:

```bash
pnpm start:dev
```

Сервер будет доступен по адресу: http://localhost:3000

API документация: http://localhost:3000/api/docs

## Основные команды

### Разработка

```bash
pnpm start:dev        # Запуск в режиме разработки
pnpm start:debug      # Запуск с отладчиком
pnpm build            # Сборка продакшн версии
pnpm start:prod       # Запуск продакшн версии
```

### База данных

```bash
pnpm db:generate      # Генерация миграций из схем
pnpm db:migrate       # Применение миграций
pnpm db:push          # Прямое применение схем (dev only)
pnpm db:studio        # Запуск Drizzle Studio
```

### Тестирование

```bash
pnpm test             # Запуск unit тестов
pnpm test:watch       # Запуск тестов в watch режиме
pnpm test:cov         # Запуск с coverage
pnpm test:e2e         # Запуск e2e тестов
```

### Код-стайл

```bash
pnpm lint             # Проверка кода
pnpm format           # Форматирование кода
```

## Структура проекта

```
src/
├── modules/           # Доменные модули
│   ├── auth/         # Аутентификация
│   ├── users/        # Пользователи
│   ├── rooms/        # Комнаты
│   ├── courses/      # Курсы
│   ├── videos/       # Видео
│   ├── chat/         # Чат
│   ├── board/        # Доска
│   ├── voice/        # Голос
│   └── ai/           # AI
├── common/           # Общие компоненты
│   ├── guards/       # Guards
│   ├── decorators/   # Декораторы
│   ├── filters/      # Exception filters
│   └── pipes/        # Validation pipes
├── database/         # База данных
│   ├── schemas/      # Drizzle схемы
│   └── migrations/   # Миграции
├── config/           # Конфигурация
└── gateways/         # WebSocket gateways
```

## Переменные окружения

См. `.env.example` для полного списка переменных окружения.

Ключевые переменные:

- `DATABASE_URL` - URL подключения к PostgreSQL
- `REDIS_URL` - URL подключения к Redis
- `JWT_SECRET` - Секретный ключ для JWT
- `MINIO_*` - Настройки MinIO
- `AI_API_KEY` - API ключ для AI провайдера

## API Документация

После запуска сервера документация доступна по адресу:

http://localhost:3000/api/docs

## Лицензия

MIT
