import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { api } from '../services/api'
import type { AxiosError } from 'axios'
import type { StoredFile } from './filesSlice'

// возвращает всех юзеров
export interface AdminUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  files_count: number
  total_size: number // размер в байтах, который мы потом превратим в МБ
}

interface AdminState {
  users: AdminUser[] // массив всех пользователей
  selectedUser: AdminUser | null // выбранный пользователь
  selectedUserFile: StoredFile[] // файлы выбранного пользователя
  isLoading: boolean // идет ли загрузка списка пользователей
  isFilesLoading: boolean // идут ли загрузки файлов
  error: string | null // текст ошибки
}

const initialState: AdminState = {
  users: [],
  selectedUser: null,
  selectedUserFile: [],
  isLoading: false,
  isFilesLoading: false,
  error: null,
}

// Thunk для получения списка пользователей со статистикой
export const fetchUsers = createAsyncThunk<AdminUser[], void>(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<AdminUser[]>('/users/')
      return response.data
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>
      return rejectWithValue(
        err.response?.data?.detail || 'Не удалось загрузить список пользователей'
      )
    }
  }
)

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.error = null
        state.isLoading = true
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<AdminUser[]>) => {
        state.isLoading = false
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearAdminError } = adminSlice.actions
export default adminSlice.reducer
