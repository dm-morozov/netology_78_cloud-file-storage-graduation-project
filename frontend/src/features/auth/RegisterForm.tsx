import { useState } from 'react'
import styles from './RegisterForm.module.css'

export const RegisterForm = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  return (
    <div className={styles.container}>
      <h2>Регистрация в MyCloud</h2>
      <form className={styles.form}>
        <input
          className={styles.input}
          type='text'
          placeholder='Логин (буквы и цифры)*'
          required // HTML5 валидация: браузер не даст отправить пустую форму
          value={username}
          onChange={(e) => setUsername(e.target.value)} // На каждый клик обновляем state
        />
        <input
          className={styles.input}
          type='email'
          placeholder='E-mail*'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          type='password'
          placeholder='Пароль*'
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className={styles.input}
          type='text'
          placeholder='Имя (необязательно)' // Для этих полей required НЕ пишем
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className={styles.input}
          type='text'
          placeholder='Фамилия (необязательно)'
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <button className={styles.button} type='submit'>
          Создать аккаунт
        </button>
      </form>
    </div>
  )
}
