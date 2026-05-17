import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { StoragePage } from './pages/StoragePage'
import { AdminPage } from './pages/AdminPage'
import { MainLayout } from './components/layout/MainLayout/MainLayout'
import { useAppDispatch, useAppSelector } from './store/store'
import { useEffect } from 'react'
import { api } from './services/api'
import { loginSuccess, logoutSuccess, setLoading } from './store/authSlice'
import type { AxiosError } from 'axios'
import Spinner from './components/Spinner/Spinner'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'

const App = () => {
  // Достаем флаг загрузки
  const isLoading = useAppSelector((state) => state.auth.isLoading)

  const dispatch = useAppDispatch() // Нужен, чтобы отправлять команды в Redux

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Стучимся на эндпоинт, который мы написали в Django.
        const response = await api.get('/users/me/')
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
      <Routes>
        {/* Родительский роут - наш каркас. Он оборачивает всё внутри */}
        <Route element={<MainLayout />}>
          {/* Эти страницы будут подставляться вместо <Outlet /> внутри MainLayout */}
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />

          {/* Приватный маршрут (только для авторизованных) */}
          <Route
            path='/storage'
            element={
              <ProtectedRoute>
                <StoragePage />
              </ProtectedRoute>
            }
          />

          <Route
            path='/admin'
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
