import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../services/api'

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

// Создаем наш Thunk (Асинхронный экшен)
export const logoutUser = createAsyncThunk(
  // Первый аргумент: просто имя (ярлык). Оно нужно только для того,
  // чтобы мы видели красивые надписи в плагине Redux DevTools.
  'auth/logout',

  // Второй аргумент: асинхронная функция.
  // Здесь происходит вся "грязная" работа с сервером.
  async () => {
    // Мы просим API сделать POST запрос на логаут
    const response = await api.post('/users/logout/', {}) // Пустой объект, потому что нам нечего отправлять
    return response.data // Возвращаем ответ от сервера
  }
)

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
  extraReducers: (builder) => {
    // builder - это строитель, с помощью которого мы "цепляемся" к стадиям Thunk-а
    builder
      // Thunk завершился УСПЕШНО (fulfilled)
      .addCase(logoutUser.fulfilled, (state) => {
        // Запрос прошел, кука на сервере убита. Чистим данные на клиенте:
        state.user = null
        state.isAuthenticated = false
      })
      // Thunk завершился ОШИБКОЙ (rejected)
      .addCase(logoutUser.rejected, (state, action) => {
        // Выводим ошибку
        console.error('Сервер отклонил логаут! Причина:', action.error)
        // Если сервер упал или мы оффлайн — мы всё равно обязаны
        // "выкинуть" пользователя на клиенте ради безопасности.
        state.user = null
        state.isAuthenticated = false
      })
  },
})

// Экспортируем экшены, чтобы вызывать их из компонентов
// например, при нажатии кнопки "Войти"
export const { loginSuccess, logoutSuccess, setLoading } = authSlice.actions

// Экспортируем редюсер для подключения в общий store
export default authSlice.reducer
