import { Link } from 'react-router-dom'
import styles from './LoginForm.module.css'
import { useState } from 'react'
import ErrorView from '../../components/ErrorView/ErrorView'

export const LoginForm = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Стейт для понимания, летит ли сейчас запрос (крутится ли спиннер)
  const [isLoading, setIsLoading] = useState(false)
  // Стейт для хранения текста ошибки от сервера
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log(username, password)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Произошла неизвестная ошибка')
      }
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
