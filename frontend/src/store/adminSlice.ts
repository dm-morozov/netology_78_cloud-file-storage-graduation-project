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

export const fetchUserFiles = createAsyncThunk<StoredFile[], number>(
  'admin/fetchUserFiles',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await api.get<StoredFile[]>('/files/', {
        params: { owner_id: userId }, // Axios сам превратит это в ?owner_id=userId
      })
      return response.data
    } catch (error: unknown) {
      const err = error as AxiosError<{ detail?: string }>
      return rejectWithValue(
        err.response?.data?.detail || 'Не удалось загрузить файлы пользователя'
      )
    }
  }
)

export const deleteUserFileAdmin = createAsyncThunk<
  { fileId: number; size: number },
  { fileId: number; size: number }
>('admin/deleteUserFileAdmin', async ({ fileId, size }, { rejectWithValue }) => {
  try {
    await api.delete(`/files/${fileId}/`)
    return { fileId, size }
  } catch (error: unknown) {
    const err = error as AxiosError<{ detail?: string }>
    return rejectWithValue(err.response?.data?.detail || 'Не удалось удалить файл')
  }
})

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null
    },
    selectUser: (state, action: PayloadAction<AdminUser | null>) => {
      const user = action.payload
      if (user) {
        state.selectedUser = user
      } else {
        state.selectedUserFile = []
        state.selectedUser = null
      }
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

      // файлы пользователя
      .addCase(fetchUserFiles.pending, (state) => {
        state.error = null
        state.isFilesLoading = true
      })
      .addCase(fetchUserFiles.fulfilled, (state, action: PayloadAction<StoredFile[]>) => {
        state.isFilesLoading = false
        state.selectedUserFile = action.payload
      })
      .addCase(fetchUserFiles.rejected, (state, action) => {
        state.isFilesLoading = false
        state.error = action.payload as string
      })

      // удаление файла админом
      .addCase(deleteUserFileAdmin.pending, (state) => {
        state.error = null
        state.isFilesLoading = true
      })
      .addCase(deleteUserFileAdmin.fulfilled, (state, action) => {
        state.isFilesLoading = false
        const { fileId, size } = action.payload

        // 1. Удаляем файл из списка выбранного пользователя
        state.selectedUserFile = state.selectedUserFile.filter((f) => f.id !== fileId)

        // 2. Ищем этого пользователя в общем списке и обновляем его статистику
        const targetUser = state.users.find((u) => u.id === state.selectedUser?.id)
        if (targetUser) {
          targetUser.files_count = Math.max(0, targetUser.files_count - 1)
          targetUser.total_size = Math.max(0, targetUser.total_size - size)
        }

        // 3. Обновляем статистику у самого объекта выбранного пользователя
        if (state.selectedUser) {
          state.selectedUser.files_count = Math.max(0, state.selectedUser.files_count - 1)
          state.selectedUser.total_size = Math.max(0, state.selectedUser.total_size - size)
        }
      })
      .addCase(deleteUserFileAdmin.rejected, (state, action) => {
        state.isFilesLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearAdminError, selectUser } = adminSlice.actions
export default adminSlice.reducer
