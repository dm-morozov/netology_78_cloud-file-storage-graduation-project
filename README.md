# My Cloud

Дипломный проект по профессии **«Fullstack-разработчик на Python»**.

`My Cloud` — это веб-приложение облачного файлового хранилища. На текущем этапе в проекте реализован backend на Django и Django REST Framework с хранением файлов на диске и метаданных в PostgreSQL. Пользователь может зарегистрироваться, войти в систему, управлять своими файлами и делиться ими через публичные ссылки. Для администратора предусмотрено управление пользователями и просмотр чужих хранилищ.

## Что реализовано

### Пользователи

- регистрация пользователя с валидацией логина и пароля;
- авторизация через сессию;
- получение данных текущего пользователя;
- выход из системы;
- административный список пользователей;
- изменение признака администратора (`is_staff`);
- удаление пользователя администратором.

### Файлы

- загрузка файла;
- хранение файла под уникальным именем на диске;
- хранение оригинального имени файла в базе данных;
- получение списка файлов текущего пользователя;
- получение информации о конкретном файле;
- изменение имени файла и комментария;
- удаление файла из базы данных и с диска;
- скачивание файла;
- фиксация даты последнего скачивания;
- создание публичной ссылки;
- скачивание файла по публичной ссылке;
- разграничение доступа между обычным пользователем и администратором.

### Техническая часть

- PostgreSQL как основная база данных;
- конфигурация через `.env`;
- шаблон конфигурации в `.env.example`;
- консольное логирование ключевых событий;
- API-тесты на `users` и `files`;
- тесты прав доступа;
- тесты на физическое удаление файлов с диска;
- изоляция `MEDIA_ROOT` во `files`-тестах через временную директорию.

## Текущий статус

### Backend

Backend-часть реализована и покрывает обязательный функционал дипломного проекта:

- обязательный функционал `users` реализован;
- обязательный функционал `files` реализован;
- написаны тесты на основные сценарии и права доступа;
- конфигурация вынесена в `.env`;
- логирование настроено.

### Frontend

Frontend-часть находится в разработке. В репозитории предусмотрена папка `frontend/`, но основная завершённая работа на текущем этапе относится к backend.

Этот README в первую очередь описывает backend-часть проекта: её функциональность, запуск, тестирование и API.

## Требования

Для локального запуска backend понадобятся:

- Python 3.12+
- PostgreSQL
- pip
- виртуальное окружение Python (`venv`)

## Стек технологий

### Backend

- Python 3.12+
- Django 6
- Django REST Framework
- PostgreSQL
- python-decouple

### Планируемый frontend

- React
- TypeScript
- Redux Toolkit
- React Router

## Архитектура backend

Backend построен по принципу разделения ответственности:

- `api.py` — HTTP-слой, работа с запросами и ответами;
- `serializers.py` — валидация и сериализация данных;
- `services.py` — бизнес-логика;
- `models.py` — модели и структура данных;
- `common/permissions.py` — кастомные permissions;
- `config/settings.py` — конфигурация проекта.

Такой подход упрощает развитие проекта, тестирование и поддержку кода.

## Формат API-ответов

Для обычных endpoint’ов API использует JSON-ответы.

- успешные ответы возвращают сериализованные данные;
- ошибки возвращаются в JSON, как правило с ключом `detail`;
- endpoint’ы скачивания файлов возвращают не JSON, а сам файл как бинарный ответ.

Это поведение особенно важно учитывать на frontend.

## Авторизация и права доступа

В проекте используется **сессионная аутентификация**.

Есть два основных уровня доступа:

- обычный пользователь;
- администратор.

### Обычный пользователь

- может работать только со своими файлами;
- не может просматривать чужое хранилище;
- не может изменять, скачивать и удалять чужие файлы;
- не может использовать административные endpoint'ы.

### Администратор

- может получать список пользователей;
- может изменять `is_staff`;
- может удалять пользователей;
- может просматривать чужие хранилища через `owner_id`.

### Важно про CSRF

Поскольку проект использует сессионную аутентификацию, для браузерных `POST`, `PATCH`, `PUT` и `DELETE` запросов требуется корректный CSRF-токен.

## Хранение файлов

Файлы хранятся на диске сервера:

- в директории `MEDIA_ROOT`;
- под уникальными именами без конфликтов;
- с сохранением метаданных в базе данных.

Для каждого файла в базе данных сохраняются:

- оригинальное имя;
- уникальное имя в хранилище;
- размер;
- комментарий;
- дата загрузки;
- дата последнего скачивания;
- публичный токен;
- путь к файлу через `FileField`.

Публичная ссылка формируется в обезличенном виде и не содержит имени пользователя или оригинального имени файла.

## Конфигурация через `.env`

Backend использует `python-decouple`. Все чувствительные параметры и настройки подключения к БД вынесены в `.env`.

Шаблон файла конфигурации: [backend/.env.example](./backend/.env.example)

Используемые переменные:

| Переменная | Назначение |
| --- | --- |
| `SECRET_KEY` | секретный ключ Django |
| `DEBUG` | режим разработки |
| `ALLOWED_HOSTS` | список разрешённых хостов |
| `DB_NAME` | имя базы данных PostgreSQL |
| `DB_USER` | пользователь PostgreSQL |
| `DB_PASSWORD` | пароль PostgreSQL |
| `DB_HOST` | хост PostgreSQL |
| `DB_PORT` | порт PostgreSQL |

## Логирование

В проекте настроено консольное логирование через `LOGGING` в [backend/config/settings.py](./backend/config/settings.py).

Логи выводятся в формате:

```text
дата время [уровень] имя_модуля: сообщение
```

В сервисах `users` и `files` логируются ключевые события:

- регистрация пользователя;
- вход и неуспешные попытки входа;
- выход из системы;
- изменение административного статуса;
- удаление пользователя;
- загрузка файла;
- удаление файла;
- создание публичного токена;
- обновление времени скачивания файла.

## Структура проекта

```text
.
├── backend/
│   ├── apps/
│   │   ├── users/
│   │   │   ├── api.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── services.py
│   │   │   └── tests/
│   │   │       ├── test_admin.py
│   │   │       └── test_auth.py
│   │   └── files/
│   │       ├── api.py
│   │       ├── models.py
│   │       ├── public_api.py
│   │       ├── serializers.py
│   │       ├── services.py
│   │       └── tests/
│   │           └── test_files_api.py
│   ├── common/
│   │   ├── exceptions.py
│   │   ├── permissions.py
│   │   └── utils.py
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── storage/
│   │   ├── media/
│   │   └── static/
│   ├── .env.example
│   ├── manage.py
│   └── requirements.txt
├── docs/
├── frontend/
├── svg/
└── README.md
```

## Запуск backend локально

### Клонирование репозитория

```bash
git clone <URL_РЕПОЗИТОРИЯ>
cd <ИМЯ_ПАПКИ>/backend
```

### Создание виртуального окружения

#### Windows PowerShell

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
```

#### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Установка зависимостей

```bash
pip install -r requirements.txt
```

### Создание `.env`

Создайте файл `.env` рядом с `manage.py` на основе `.env.example`.

#### Windows PowerShell

```bash
copy .env.example .env
```

#### Linux / macOS

```bash
cp .env.example .env
```

Пример содержимого `.env`:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

DB_NAME=cloud_storage
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
```

### Подготовка PostgreSQL

Нужно заранее:

- установить PostgreSQL;
- создать базу данных;
- создать пользователя базы данных;
- выдать права пользователю;
- указать параметры подключения в `.env`.

### Применение миграций

```bash
python manage.py migrate
```

### Создание администратора

Для доступа к административным функциям можно создать суперпользователя:

```bash
python manage.py createsuperuser
```

Суперпользователь в Django получает `is_staff=True`, поэтому может использовать admin-only endpoint'ы проекта.

### Проверка конфигурации

```bash
python manage.py check
```

### Запуск сервера

```bash
python manage.py runserver
```

Сервер будет доступен по адресу:

```text
http://127.0.0.1:8000/
```

## Основные API endpoint'ы

### Users

```http
POST   /api/users/register/
POST   /api/users/login/
GET    /api/users/me/
POST   /api/users/logout/
GET    /api/users/
PATCH  /api/users/<user_id>/
DELETE /api/users/<user_id>/
```

Примечания:

- `register` и `login` доступны без авторизации;
- `me` и `logout` требуют аутентификации;
- `GET /api/users/`, `PATCH /api/users/<user_id>/` и `DELETE /api/users/<user_id>/` доступны только администратору.

### Files

```http
GET    /api/files/
POST   /api/files/
GET    /api/files/<file_id>/
PATCH  /api/files/<file_id>/
DELETE /api/files/<file_id>/
GET    /api/files/<file_id>/download/
POST   /api/files/<file_id>/public-link/
GET    /api/public/files/<token>/
```

Примечания:

- endpoint'ы `/api/files/...` требуют аутентификации;
- `GET /api/public/files/<token>/` — публичный endpoint и не требует логина;
- download endpoint'ы возвращают файл, а не JSON.

## Примеры запросов

### Регистрация

```http
POST /api/users/register/
Content-Type: application/json
```

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test_123",
  "first_name": "Test",
  "last_name": "User"
}
```

### Вход

```http
POST /api/users/login/
Content-Type: application/json
```

```json
{
  "username": "testuser",
  "password": "Test_123"
}
```

### Загрузка файла

```http
POST /api/files/
Content-Type: multipart/form-data
```

Поля формы:

- `file`
- `comment`

## Как быстро проверить backend после запуска

После `runserver` можно пройти минимальный ручной сценарий:

1. зарегистрировать пользователя через `POST /api/users/register/`;
2. выполнить вход через `POST /api/users/login/`;
3. загрузить файл через `POST /api/files/`;
4. получить список файлов через `GET /api/files/`;
5. скачать файл через `GET /api/files/<file_id>/download/`;
6. создать публичную ссылку через `POST /api/files/<file_id>/public-link/`;
7. проверить публичное скачивание через `GET /api/public/files/<token>/`.

Для проверки административного функционала:

1. создать администратора через `createsuperuser`;
2. войти под администратором;
3. получить список пользователей через `GET /api/users/`;
4. изменить `is_staff` у пользователя через `PATCH /api/users/<user_id>/`;
5. при необходимости удалить пользователя через `DELETE /api/users/<user_id>/`.

## Тестирование

В backend написаны тесты на:

- регистрацию;
- авторизацию;
- `me` и `logout`;
- административные действия с пользователями;
- загрузку файла;
- получение списка файлов;
- detail / patch / delete;
- скачивание файла;
- создание публичной ссылки;
- скачивание по публичной ссылке;
- обновление `last_downloaded_at`;
- права доступа к чужим файлам и хранилищам;
- физическое удаление файла с диска.

Тесты модуля `files` используют временную директорию для `MEDIA_ROOT`, поэтому тестовые файлы не засоряют основное файловое хранилище проекта.

### Запуск всех backend-тестов

Из папки `backend`:

```bash
python manage.py test
```

### Запуск только users-тестов

```bash
python manage.py test apps.users.tests
```

### Запуск только files-тестов

```bash
python manage.py test apps.files.tests
```

## Что ещё остаётся по проекту

На текущем этапе основной незавершённый блок — frontend и финальная документация по полному fullstack-развёртыванию.

В рамках дальнейшей работы нужно:

1. завершить frontend;
2. описать запуск frontend в README;
3. проверить развёртывание проекта с нуля по инструкции;
4. при необходимости подготовить деплой на reg.ru;
5. дополнить README финальными скриншотами и ссылками на развёрнутое приложение.

## Полезные замечания

- Файл `.env` не должен попадать в репозиторий.
- Перед запуском проекта нужно установить зависимости из [backend/requirements.txt](./backend/requirements.txt).
- Если при запуске возникает ошибка `ModuleNotFoundError: No module named 'decouple'`, значит зависимости не были установлены в активированное виртуальное окружение.
- Настройки подключения к БД, static/media и логирование описаны в [backend/config/settings.py](./backend/config/settings.py).

## Известные особенности

- backend использует session auth и CSRF-защиту для браузерных изменяющих запросов;
- для локального запуска нужен PostgreSQL;
- администратор создаётся вручную через `python manage.py createsuperuser`;
- frontend в этом репозитории ещё не завершён, поэтому основной рабочий объём сейчас находится в backend.

## Автор

Дмитрий Морозов

- ![LinkedIn](./svg/linkedin-icon.svg) [LinkedIn](https://www.linkedin.com/in/dm-morozov/)
- ![Telegram](./svg/telegram.svg) [Telegram](https://t.me/dem2014)
- ![GitHub](./svg/github-icon.svg) [GitHub](https://github.com/dm-morozov/)
- ![LeetCode](./svg/leetcode-icon.svg) [LeetCode](https://leetcode.com/u/dm-morozov/) — задачи для подготовки к собеседованиям
- ![Codewars](./svg/codewars-icon.svg) [Codewars](https://www.codewars.com/users/dm-morozov) — ежедневная практика и тренировка

## Лицензия

Учебный проект в рамках дипломной работы Netology.
