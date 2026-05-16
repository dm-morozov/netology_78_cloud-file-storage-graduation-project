import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { StoragePage } from './pages/StoragePage'
import { AdminPage } from './pages/AdminPage'
import styles from './App.module.css'
import { useAppDispatch, useAppSelector } from './store/store'
import { useEffect } from 'react'
import { api } from './services/api'
import { loginSuccess, logoutSuccess, setLoading } from './store/authSlice'
import type { AxiosError } from 'axios'
import Spinner from './components/Spinner/Spinner'

const App = () => {
  // гость не должен видеть хранилище, а авторизованный пользователь - вход/регистрацию
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  // Достаем флаг загрузки
  const isLoading = useAppSelector((state) => state.auth.isLoading)

  const dispatch = useAppDispatch() // Нужен, чтобы отправлять команды в Redux

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Стучимся на эндпоинт, который мы написали в Django.
        const response = await api.get('users/me/')
        dispatch(loginSuccess(response.data))
      } catch (error: unknown) {
        const err = error as AxiosError
        // Куки нет или протухла. Сбрасываем Redux надежно.
        console.error('Ошибка загрузки пользователя:', err.response?.data || err.message)
        dispatch(logoutSuccess())
      } finally {
        dispatch(setLoading(false))
      }
    }

    checkAuth()
  }, [dispatch])

  if (isLoading) {
    return <Spinner />
  }

  return (
    <BrowserRouter>
      <nav className={styles.nav}>
        <Link to='/' className={styles.link}>
          Главная
        </Link>
        {/* Показываем ссылки В зависимости от того, вошел ли пользователь */}
        {!isAuthenticated ? (
          <>
            <Link to='/login' className={styles.link}>
              Вход
            </Link>
            <Link to='/register' className={styles.link}>
              Регистрация
            </Link>
          </>
        ) : (
          <>
            <Link to='/storage' className={styles.link}>
              Хранилище
            </Link>
            <Link to='/admin' className={styles.link}>
              Админка
            </Link>
          </>
        )}
      </nav>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/storage' element={<StoragePage />} />
        <Route path='/admin' element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
