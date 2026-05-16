import { Link, useNavigate } from 'react-router-dom'
import styles from './LoginForm.module.css'
import { useState } from 'react'
import ErrorView from '../../components/ErrorView/ErrorView'
import { useAppDispatch } from '../../store/store'
import { api } from '../../services/api'
import { loginSuccess } from '../../store/authSlice'
import { AxiosError } from 'axios'

export const LoginForm = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Стейт для понимания, летит ли сейчас запрос (крутится ли спиннер)
  const [isLoading, setIsLoading] = useState(false)
  // Стейт для хранения текста ошибки от сервера
  const [error, setError] = useState('')
  // dispatch — это "курьер", который понесет данные в наш глобальный Redux store
  const dispatch = useAppDispatch()

  // navigate — это "руль", который перебросит пользователя на другой URL без перезагрузки
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Стучимся в Django. api (наш настроенный Axios) отправит логин и пароль.
      // Если пароль верный, Django пришлет заголовки с куками (Set-Cookie).
      // Axios автоматически сохранит эту куку в браузере.
      await api.post('/users/login/', { username, password })

      // Теперь, когда у нас есть кука сессии, мы спрашиваем: "Кто я?"
      // Axios сам подклеит куку к этому запросу. Django узнает нас и вернет объект пользователя.
      const meResponse = await api.get('/users/me/')

      // Успех! Кладем полученные данные (meResponse.data) в Redux.
      // В этот момент во всем приложении (например, в навигации) флаг isAuthenticated станет true!
      dispatch(loginSuccess(meResponse.data))

      // Редирект. Пользователю больше нечего делать на форме логина.
      // Принудительно отправляем его в хранилище.
      navigate('/storage')
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ detail?: string }>

      setError(axiosError.response?.data?.detail || 'Неверный логин или пароль')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2>Выполните авторизацию</h2>
      {error && <ErrorView message={error} />}

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          name='username'
          type='text'
          placeholder='Логин'
          autoComplete='off'
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input
          className={styles.input}
          name='password'
          type='password'
          placeholder='Пароль'
          autoComplete='off'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className={styles.button} type='submit' disabled={isLoading}>
          {isLoading ? 'Входим...' : 'Войти'}
        </button>
      </form>
      <Link to='/register'>Зарегистрироваться</Link>
    </div>
  )
}
