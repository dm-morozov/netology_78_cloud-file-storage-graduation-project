import { useState } from 'react'
import styles from './RegisterForm.module.css'
import { api } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/store'
import type { AxiosError } from 'axios'
import { loginSuccess } from '../../store/authSlice'
import ErrorView from '../../components/ErrorView/ErrorView'

export const RegisterForm = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // Место для хранения текста ошибки
  const [error, setError] = useState('')
  // Индикатор процесса сетевого запроса
  const [isLoading, setIsLoading] = useState(false)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await api.post('/users/register/', {
        username,
        email,
        password,
        first_name: firstName, // Трансформируем camelCase в snake_case специально для Django
        last_name: lastName, // Трансформируем camelCase в snake_case специально для Django
      })

      // Выполняем физический вход, чтобы бэкенд выдал нам куку
      await api.post('/users/login/', { username, password })

      // Автоматический логин после регистрации
      const meResponse = await api.get('/users/me/')
      dispatch(loginSuccess(meResponse.data))

      // Перенаправляем пользователя прямиком в хранилище
      navigate('/storage')
    } catch (err: unknown) {
      // Приводим тип к AxiosError и описываем форму JSON-данных, которую возвращает Django
      const axiosError = err as AxiosError<{
        detail?: string // Общая ошибка (например, сбой сервера)
        username?: string[] // Массив ошибок валидации логина
        password?: string[] // Массив ошибок валидации пароля
        email?: string[] // Массив ошибок валидации почты
      }>

      const data = axiosError.response?.data

      // Каскадный разбор проверяем поля по очереди
      if (data) {
        if (data.username) {
          setError(data.username[0]) // Выведет например: "Логин должен начинаться с латинской буквы..."
        } else if (data.password) {
          setError(data.password[0]) // Выведет например: "Пароль должен содержать хотя бы одну цифру."
        } else if (data.email) {
          setError(data.email[0]) // Выведет например: "Пользователь с таким email уже существует."
        } else if (data.detail) {
          setError(data.detail) // Глобальная ошибка от DRF
        } else {
          setError('Ошибка при регистрации. Проверьте данные.')
        }
      } else {
        setError('Сетевая ошибка: сервер недоступен')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2>Регистрация в MyCloud</h2>

      {error && <ErrorView message={error} />}

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type='text'
          placeholder='Логин (буквы и цифры)*'
          required // HTML5 валидация: браузер не даст отправить пустую форму
          value={username}
          onChange={(e) => setUsername(e.target.value)} // На каждый клик обновляем state
          name='username'
          autoComplete='off'
        />
        <input
          className={styles.input}
          type='email'
          placeholder='E-mail*'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          name='email'
          autoComplete='off'
        />
        <input
          className={styles.input}
          type='password'
          placeholder='Пароль*'
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          name='password'
          autoComplete='off'
        />
        <input
          className={styles.input}
          type='text'
          placeholder='Имя (необязательно)' // Для этих полей required НЕ пишем
          value={firstName}
          name='first_name'
          autoComplete='off'
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className={styles.input}
          type='text'
          placeholder='Фамилия (необязательно)'
          value={lastName}
          name='last_name'
          autoComplete='off'
          onChange={(e) => setLastName(e.target.value)}
        />
        <button className={styles.button} type='submit' disabled={isLoading}>
          {isLoading ? 'Отправка...' : 'Создать аккаунт'}
        </button>
      </form>
    </div>
  )
}
