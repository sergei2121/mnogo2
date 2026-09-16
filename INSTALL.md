# 📦 Инструкция по развертыванию в Docker

## 📋 Требования

Перед началом убедитесь, что у вас установлены:

- **Docker** (версия 20.10 или выше)
- **Docker Compose** (версия 2.0 или выше)
- **Git** (для клонирования репозитория)

### Проверка установки

```bash
docker --version
# Docker version 20.10.x или выше

docker-compose --version
# Docker Compose version 2.x.x или выше

git --version
# git version 2.x.x
```

### Установка Docker (если не установлен)

#### Ubuntu/Debian
```bash
# Обновление пакетов
sudo apt-get update

# Установка зависимостей
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Добавление GPG ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавление пользователя в группу docker (без sudo)
sudo usermod -aG docker $USER
newgrp docker

# Проверка
docker run hello-world
```

#### CentOS/RHEL
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

#### Windows
1. Скачайте [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Установите и запустите
3. Перезагрузите компьютер

#### macOS
```bash
# Через Homebrew
brew install --cask docker

# Или скачайте Docker Desktop с сайта
```

---

## 🚀 Пошаговая инструкция развертывания

### Шаг 1: Клонирование проекта

```bash
git clone <repository-url>
cd multi-launcher
```

Или создайте структуру вручную:
```bash
mkdir multi-launcher && cd multi-launcher
```

### Шаг 2: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
nano .env
```

Добавьте содержимое:

```env
# Секретный ключ для JWT токенов (ОБЯЗАТЕЛЬНО измените!)
JWT_SECRET=your-super-secret-random-string-here-min-32-chars

# Порт сервера (опционально, по умолчанию 3001)
PORT=3001

# Режим работы
NODE_ENV=production
```

**Генерация случайного JWT_SECRET:**

```bash
# Linux/macOS
openssl rand -base64 32

# Или
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Пример `.env`:
```env
JWT_SECRET=k9Xp2s5v8y/B?E(H+MbQeThWmZq4t7w!zC&F)J@NcRfUjXn2r5u8x/A%D*G-KaPd
PORT=3001
NODE_ENV=production
```

### Шаг 3: Изменение порта (опционально)

Если нужно запустить на другом порту, отредактируйте `docker-compose.yml`:

```yaml
services:
  nginx:
    ports:
      - "8080:80"  # Измените 80 на нужный порт
```

### Шаг 4: Сборка и запуск

```bash
# Сборка образов и запуск в фоне
docker-compose up -d --build

# Проверка статуса
docker-compose ps
```

Ожидаемый вывод:
```
NAME                COMMAND                  SERVICE             STATUS              PORTS
multi-launcher-nginx-1    "/docker-entrypoint.…"   nginx               running             0.0.0.0:80->80/tcp
multi-launcher-server-1   "docker-entrypoint.s…"   server              running             3001/tcp
```

### Шаг 5: Проверка работы

```bash
# Просмотр логов
docker-compose logs -f

# Проверка API
curl http://localhost/api/health
# Ожидаемый ответ: {"status":"ok","timestamp":"2024-..."}

# Открыть в браузере
# http://localhost
```

### Шаг 6: Первый вход

1. Откройте браузер: `http://localhost`
2. Войдите с данными по умолчанию:
   - **Логин:** `admin`
   - **Пароль:** `admin123`
3. ⚠️ **Сразу смените пароль администратора!**

---

## 🔧 Управление контейнерами

### Основные команды

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Просмотр логов (в реальном времени)
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f server
docker-compose logs -f nginx

# Статус контейнеров
docker-compose ps

# Остановка и удаление volumes (⚠️ удалит базу данных!)
docker-compose down -v
```

### Обновление приложения

```bash
# Остановить контейнеры
docker-compose down

# Пересобрать образы
docker-compose build --no-cache

# Запустить заново
docker-compose up -d
```

### Вход в контейнер

```bash
# В backend контейнер
docker-compose exec server sh

# В frontend контейнер
docker-compose exec nginx sh

# Выполнить команду в контейнере
docker-compose exec server node -e "console.log('Hello')"
```

---

## 🗄️ Работа с базой данных

### Резервное копирование

```bash
# Создать бэкап
docker-compose exec server cp /data/multi-launcher.db /data/backup-$(date +%Y%m%d).db

# Скопировать бэкап на хост
docker cp $(docker-compose ps -q server):/data/multi-launcher.db ./backup-$(date +%Y%m%d).db

# Автоматический бэкап (cron)
# Добавьте в crontab:
# 0 2 * * * cd /path/to/project && docker cp $(docker-compose ps -q server):/data/multi-launcher.db /backups/ml-$(date +\%Y\%m\%d).db
```

### Восстановление из бэкапа

```bash
# Остановить сервер
docker-compose stop server

# Скопировать бэкап в контейнер
docker cp ./backup.db $(docker-compose ps -q server):/data/multi-launcher.db

# Запустить сервер
docker-compose start server
```

### Просмотр данных

```bash
# Войти в контейнер
docker-compose exec server sh

# Установить sqlite3 (если нет)
apk add sqlite

# Открыть базу
sqlite3 /data/multi-launcher.db

# SQL запросы
.tables
SELECT * FROM users;
SELECT * FROM app_configs;
.quit
```

---

## 🔒 Настройка безопасности

### 1. Смените пароль администратора

После первого входа создайте нового администратора и удалите пользователя `admin` с паролем по умолчанию.

### 2. Настройте HTTPS (опционально)

Создайте `nginx/ssl.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

Получите SSL сертификат (Let's Encrypt):
```bash
# Установите certbot
sudo apt install certbot

# Получите сертификат
sudo certbot certonly --standalone -d your-domain.com

# Скопируйте в проект
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/key.pem
```

Обновите `docker-compose.yml`:
```yaml
nginx:
  volumes:
    - ./nginx/ssl:/etc/nginx/ssl:ro
  ports:
    - "80:80"
    - "443:443"
```

### 3. Ограничьте доступ

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Или iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### 4. Используйте firewall для API

Если API должен быть доступен только из внутренней сети:

```yaml
# docker-compose.yml
server:
  ports:
    - "127.0.0.1:3001:3001"  # Только localhost
```

---

## 🐛 Устранение неполадок

### Контейнер не запускается

```bash
# Проверьте логи
docker-compose logs server

# Частые ошибки:

# 1. Порт занят
Error: listen EADDRINUSE: address already in use 0.0.0.0:3001

# Решение: измените порт в docker-compose.yml или остановите другой сервис
sudo lsof -i :3001  # Найти процесс
sudo kill -9 <PID>  # Остановить

# 2. Нет прав на volume
Error: EACCES: permission denied, open '/data/multi-launcher.db'

# Решение:
docker-compose down
sudo chown -R $USER:$USER ./data  # Если используете bind mount
docker-compose up -d

# 3. Ошибка сборки
Error: failed to solve: failed to compute cache key

# Решение: очистите кэш
docker-compose down
docker system prune -a
docker-compose up -d --build
```

### Не могу подключиться к API

```bash
# Проверьте, что контейнеры запущены
docker-compose ps

# Проверьте логи nginx
docker-compose logs nginx

# Проверьте доступность из контейнера
docker-compose exec nginx wget -qO- http://server:3001/api/health

# Проверьте сеть
docker network ls
docker network inspect multi-launcher_app-network
```

### База данных повреждена

```bash
# Остановите сервер
docker-compose stop server

# Проверьте целостность
docker-compose exec server sqlite3 /data/multi-launcher.db ".integrity-check"

# Если есть ошибки, восстановите из бэкапа
docker cp ./backup.db $(docker-compose ps -q server):/data/multi-launcher.db

# Запустите сервер
docker-compose start server
```

### JWT токены не работают

```bash
# Проверьте JWT_SECRET в .env
cat .env | grep JWT_SECRET

# Перезапустите сервер
docker-compose restart server

# Очистите localStorage в браузере
# F12 -> Application -> Local Storage -> Clear
```

---

## 📊 Мониторинг

### Просмотр ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Детальная информация
docker inspect multi-launcher-server-1
```

### Логи

```bash
# Все логи
docker-compose logs -f

# Только ошибки
docker-compose logs | grep -i error

# Последние 100 строк
docker-compose logs --tail=100 server
```

### Health check

```bash
# Проверка API
curl -f http://localhost/api/health || echo "API down"

# Автоматическая проверка (cron)
# */5 * * * * curl -f http://localhost/api/health > /dev/null 2>&1 || docker-compose restart
```

---

## 🔄 Обновление версии

```bash
# 1. Остановите контейнеры
docker-compose down

# 2. Сделайте бэкап базы
docker cp $(docker-compose ps -q server):/data/multi-launcher.db ./backup-before-update.db

# 3. Обновите код
git pull

# 4. Пересоберите образы
docker-compose build --no-cache

# 5. Запустите
docker-compose up -d

# 6. Проверьте логи
docker-compose logs -f
```

---

## 📝 Дополнительные команды

```bash
# Создать нового администратора через API
curl -X POST http://localhost/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"username":"newadmin","password":"securepass","role":"admin"}'

# Экспорт всех конфигураций
curl -H "Authorization: Bearer <TOKEN>" http://localhost/api/apps > apps.json

# Импорт конфигураций (нужно написать скрипт)
# Или используйте веб-интерфейс
```

---

## 🆘 Поддержка

Если возникли проблемы:

1. Проверьте логи: `docker-compose logs`
2. Проверьте требования к системе
3. Убедитесь, что порты не заняты
4. Проверьте файл `.env`
5. Попробуйте пересобрать: `docker-compose build --no-cache`

---

## ✅ Чек-лист после развертывания

- [ ] Docker и Docker Compose установлены
- [ ] Файл `.env` создан с уникальным JWT_SECRET
- [ ] Контейнеры запущены (`docker-compose ps`)
- [ ] API доступен (`curl http://localhost/api/health`)
- [ ] Веб-интерфейс открывается в браузере
- [ ] Вход выполнен под admin/admin123
- [ ] Пароль администратора изменен
- [ ] Создан бэкап базы данных
- [ ] Настроен HTTPS (если нужно)
- [ ] Настроена автоматическая резервная копия

---

**Готово!** 🎉 Ваше приложение Multi Launcher развернуто и готово к использованию.
