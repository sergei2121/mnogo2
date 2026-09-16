# Multi Launcher

Веб-приложение для генерации скриптов запуска нескольких копий .exe-файлов на Windows.

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   Nginx:80   │───▶│  Server:3001 │───▶│  SQLite   │ │
│  │  (Frontend)  │    │   (Express)  │    │  (volume) │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│        │                    │                            │
│   React SPA          REST API + JWT                      │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Быстрый старт

### 1. Клонировать и запустить

```bash
docker-compose up -d --build
```

### 2. Открыть в браузере

```
http://localhost
```

### 3. Войти

- **Логин:** `admin`
- **Пароль:** `admin123`

> ⚠️ **Важно:** Смените пароль администратора после первого входа!

## 📁 Структура проекта

```
.
├── docker-compose.yml      # Оркестрация контейнеров
├── Dockerfile              # Frontend + Nginx
├── nginx/
│   └── nginx.conf          # Reverse proxy конфиг
├── server/
│   ├── Dockerfile          # Backend контейнер
│   ├── package.json
│   └── src/
│       ├── index.js        # Express сервер
│       ├── db.js           # SQLite инициализация
│       ├── middleware/
│       │   └── auth.js     # JWT аутентификация
│       └── routes/
│           ├── auth.js     # /api/auth — логин
│           ├── apps.js     # /api/apps — CRUD конфигов
│           ├── users.js    # /api/users — управление юзерами
│           └── launch.js   # /api/launch — генерация скриптов
├── src/                    # React фронтенд
│   ├── App.tsx
│   ├── api.ts              # API клиент
│   └── components/
│       ├── LoginPage.tsx
│       ├── AdminPanel.tsx
│       ├── AppsManager.tsx
│       └── LaunchHistory.tsx
└── package.json
```

## 🔧 Конфигурация

### Переменные окружения

Создайте `.env` в корне проекта:

```env
# Сервер
JWT_SECRET=your-super-secret-key-here
PORT=3001
```

### Изменение порта

В `docker-compose.yml` измените:

```yaml
ports:
  - "8080:80"   # Вместо 80
```

## 👥 Роли

### Администратор
- Управление пользователями (создание, редактирование, удаление)
- Просмотр всех конфигураций и истории
- Создание/редактирование/удаление любых конфигураций

### Пользователь
- Создание своих конфигураций
- Запуск скриптов
- Просмотр своей истории

## 📡 API Endpoints

| Метод | Путь | Описание | Доступ |
|-------|------|----------|--------|
| POST | `/api/auth/login` | Авторизация | Публичный |
| GET | `/api/auth/me` | Текущий пользователь | Auth |
| GET | `/api/apps` | Список конфигов | Auth |
| POST | `/api/apps` | Создать конфиг | Auth |
| PUT | `/api/apps/:id` | Обновить конфиг | Auth |
| DELETE | `/api/apps/:id` | Удалить конфиг | Auth |
| GET | `/api/users` | Список пользователей | Admin |
| POST | `/api/users` | Создать пользователя | Admin |
| PUT | `/api/users/:id` | Обновить пользователя | Admin |
| DELETE | `/api/users/:id` | Удалить пользователя | Admin |
| POST | `/api/launch/generate` | Генерация скрипта | Auth |
| GET | `/api/launch/history` | История запусков | Auth |

## 🗄️ База данных

SQLite хранится в Docker volume `db_data`. Бэкап:

```bash
docker-compose exec server cp /data/multi-launcher.db /data/backup.db
docker cp $(docker-compose ps -q server):/data/backup.db ./backup.db
```

## 🛠️ Разработка

```bash
# Backend
cd server
npm install
npm run dev

# Frontend (в другом терминале)
npm install
npm run dev
```

## 🔒 Безопасность

1. **Смените JWT_SECRET** в docker-compose.yml
2. **Смените пароль** администратора после первого входа
3. Используйте HTTPS (настройте SSL в nginx)
4. Ограничьте доступ к порту 80 файрволом

## 📝 Лицензия

MIT
