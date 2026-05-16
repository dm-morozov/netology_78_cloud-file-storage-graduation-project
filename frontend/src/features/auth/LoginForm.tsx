import { Link } from 'react-router-dom'
import styles from './LoginForm.module.css'
import { useState } from 'react'

export const LoginForm = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className={styles.container}>
      <h2>Выполните авторизацию</h2>
      <form className={styles.form}>
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
        <button className={styles.button} type='submit'>
          Войти
        </button>
      </form>
      <Link to='/register'>Зарегистрироваться</Link>
    </div>
  )
}
