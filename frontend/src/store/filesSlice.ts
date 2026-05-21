import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { api } from '../services/api'
import { setLoading } from './authSlice'
import type { AxiosError } from 'axios'

// Описываем, как выглядит один файл, приходящий с сервера
export interface StoredFile {
  id: number
  original_name: string
  comment: string | null
  size: number
  uploaded_at: string
  last_downloaded_at: string | null // может быть null, если ни разу не скачивали
  public_token: string | null // может быть null, если файл приватный
}

// Описываем, что мы будем хранить в глобальном стейте Redux для файлов:

interface FilesState {
  items: StoredFile[]
  isLoading: boolean
  error: string | null
}

// Опишем начальное состояние
const initialState: FilesState = {
  items: [],
  isLoading: false,
  error: null,
}

// Асинхронный Thunk для получения списка файлов с сервера
export const fetchFiles = createAsyncThunk(
  'files/fetchAll',
  async (ownerId: number | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get<StoredFile[]>('/files/', {
        params: ownerId ? { owner_id: ownerId } : {},
      })

      return response.data
    } catch (error: unknown) {
      // Приводим тип к AxiosError и описываем форму JSON-данных от бэкенда
      const err = error as AxiosError<{ detail?: string }>

      return rejectWithValue(err.response?.data?.detail || 'Не удалось загрузить список файлов')
    }
  }
)

// Создаем слайс для управления состоянием файлов

const filesSlice = createSlice({
  name: 'files',
  initialState,
  // Обычные (синхронные) редюсеры
  reducers: {
    // Очистка ошибки загрузки
    clearFilesError: (state) => {
      state.error = null
    },
  },
  // Асинхронные редюсеры обрабатывают запросы
  extraReducers: (builder) => {
    builder
      // Когда запрос только начался
      .addCase(fetchFiles.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      // Когда запрос успешно завершился
      .addCase(fetchFiles.fulfilled, (state, action: PayloadAction<StoredFile[]>) => {
        state.isLoading = false
        state.items = action.payload
      })
      // Когда произошла ошибка
      .addCase(fetchFiles.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || 'Ошибка загрузки списка файлов'
      })
  },
})

export const { clearFilesError } = filesSlice.actions
export default filesSlice.reducer
