import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Описываем, как выглядит наш пользователь
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
}

// Описываем, как выглядит состояние авторизации
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false, // по умолчанию пользователь гость
  isLoading: true, // при первом запуске сайта мы не знаем, вдруг куки еще живы (идет проверка)
}

// Создаем слайс для авторизации
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Экшен (действие), когда мы успешно получили данные с сервера
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.isLoading = false
    },

    // Экшен, когда пользователь выходит
    logoutSuccess: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
    },

    // Экшен для управления индикатором загрузки
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

// Экспортируем экшены, чтобы вызывать их из компонентов
// например, при нажатии кнопки "Войти"
export const { loginSuccess, logoutSuccess, setLoading } = authSlice.actions

// Экспортируем редюсер для подключения в общий store
export default authSlice.reducer
