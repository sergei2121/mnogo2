# 🚀 Multi Launcher

Веб-приложение для генерации скриптов запуска нескольких копий .exe-файлов на Windows.

## 📖 Описание

Multi Launcher позволяет:
- Указывать путь к .exe файлу
- Выбирать метод запуска (простой, через Sandboxie, копирование, переменные окружения)
- Настраивать количество копий и задержку между запусками
- Генерировать .bat скрипты для автоматического запуска
- Управлять конфигурациями через веб-интерфейс
- Администрировать пользователей

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

## ⚡ Быстрый старт

### 1. Требования

- Docker 20.10+
- Docker Compose 2.0+

### 2. Установка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd multi-launcher

# Создать .env файл
cat > .env << EOF
JWT_SECRET=$(openssl rand -base64 32)
PORT=3001
NODE_ENV=production
EOF

# Запустить
docker-compose up -d --build
```

### 3. Открыть в браузере

```
http://localhost
```

### 4. Войти

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

## 📚 Документация

- **[INSTALL.md](INSTALL.md)** — Подробная инструкция по развертыванию
- **[API.md](API.md)** — Документация API (скоро)

## 🔧 Конфигурация

### Переменные окружения

Создайте `.env` в корне проекта:

```env
# Секретный ключ для JWT (ОБЯЗАТЕЛЬНО измените!)
JWT_SECRET=your-super-secret-key-here

# Порт сервера (опционально)
PORT=3001

# Режим работы
NODE_ENV=production
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

SQLite хранится в Docker volume `db_data`. 

### Бэкап

```bash
docker cp $(docker-compose ps -q server):/data/multi-launcher.db ./backup.db
```

### Восстановление

```bash
docker-compose stop server
docker cp ./backup.db $(docker-compose ps -q server):/data/multi-launcher.db
docker-compose start server
```

## 🔒 Безопасность

1. **Смените JWT_SECRET** в `.env`
2. **Смените пароль** администратора после первого входа
3. Используйте HTTPS (настройте SSL в nginx)
4. Ограничьте доступ к порту файрволом

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

## 🐛 Устранение неполадок

### Контейнер не запускается

```bash
# Проверьте логи
docker-compose logs server

# Пересоберите
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Порт занят

```bash
# Найдите процесс
sudo lsof -i :80

# Остановите или измените порт в docker-compose.yml
```

### База данных повреждена

```bash
# Восстановите из бэкапа
docker cp ./backup.db $(docker-compose ps -q server):/data/multi-launcher.db
```

## 📊 Мониторинг

```bash
# Статус контейнеров
docker-compose ps

# Логи в реальном времени
docker-compose logs -f

# Использование ресурсов
docker stats
```

## 🔄 Обновление

```bash
docker-compose down
git pull
docker-compose build --no-cache
docker-compose up -d
```

## 📝 Лицензия

MIT

## 🆘 Поддержка

Если возникли проблемы:

1. Проверьте логи: `docker-compose logs`
2. Убедитесь, что Docker запущен
3. Проверьте файл `.env`
4. Попробуйте пересобрать: `docker-compose build --no-cache`

Подробная инструкция: **[INSTALL.md](INSTALL.md)**
