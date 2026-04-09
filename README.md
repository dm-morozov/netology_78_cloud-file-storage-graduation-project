# ☁️ Cloud File Storage (My Cloud)

Дипломный проект по профессии «Fullstack-разработчик на Python»

---

## 📌 О проекте

**My Cloud** — это веб-приложение, реализующее базовый функционал облачного файлового хранилища.

Пользователь может:

- регистрироваться и авторизовываться
- загружать файлы
- просматривать список файлов
- скачивать файлы
- переименовывать и удалять файлы
- делиться файлами через специальные ссылки

Администратор дополнительно может:

- управлять пользователями
- просматривать и управлять чужими хранилищами

---

## 🧱 Архитектура проекта

Проект реализован как fullstack-приложение:

```text
backend/   → Django + DRF (API, бизнес-логика, БД)
frontend/  → React (SPA-интерфейс)
```

---

## ⚙️ Технологии

### Backend

- Python 3.12+
- Django
- Django REST Framework
- PostgreSQL (в production)
- SQLite (в development)

### Frontend

- React
- Redux Toolkit
- TypeScript
- React Router

### Инфраструктура

- Git + GitHub
- VPS (reg.ru)
- Linux (production)

---

## 📁 Структура backend

```text
backend/
├── config/            # настройки Django
├── apps/
│   ├── users/         # управление пользователями
│   └── files/         # файловое хранилище
├── common/            # общие модули
└── storage/           # файлы (media / static)
```

---

## 🧩 Архитектурные принципы

Проект построен с разделением ответственности:

- `api.py` → обработка HTTP-запросов
- `serializers.py` → валидация и преобразование данных
- `services.py` → бизнес-логика
- `common/utils.py` → вспомогательные функции
- `common/permissions.py` → правила доступа
- `common/exceptions.py` → пользовательские ошибки

---

## 🔐 Авторизация и доступ

- Аутентификация через сессии
- Два уровня доступа:
  - пользователь
  - администратор

Ограничения:

- пользователь работает только со своими файлами
- администратор имеет полный доступ

---

## 📦 Основной функционал API

### Пользователи

- регистрация
- авторизация (login)
- выход (logout)
- получение списка пользователей
- удаление пользователя

### Файлы

- загрузка файла
- получение списка файлов
- удаление файла
- переименование
- изменение комментария
- скачивание файла
- генерация публичной ссылки
- скачивание по публичной ссылке

---

## 🗂 Хранение файлов

- файлы сохраняются на сервере
- используются уникальные имена
- оригинальные имена хранятся в базе данных
- публичные ссылки обезличены

---

## 🚀 Запуск проекта (backend)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

---

## 🧪 Пример API

```http
POST /api/users/register/
POST /api/users/login/
GET  /api/files/
POST /api/files/upload/
```

---

## 📌 Статус проекта

В разработке 🚧
Дипломный проект (Netology)

---

## 🌐 Профили и контакты

Если возникнут вопросы, пишите:

- ![LinkedIn](./svg/linkedin-icon.svg) [LinkedIn](https://www.linkedin.com/in/dm-morozov/)
- ![Telegram](./svg/telegram.svg) [Telegram](https://t.me/dem2014)
- ![GitHub](./svg/github-icon.svg) [GitHub](https://github.com/dm-morozov/)
- ![LeetCode](./svg/leetcode-icon.svg) [LeetCode](https://leetcode.com/u/dm-morozov/) — задачи для подготовки к собеседованиям
- ![Codewars](./svg/codewars-icon.svg) [Codewars](https://www.codewars.com/users/dm-morozov) — ежедневная практика и тренировка
