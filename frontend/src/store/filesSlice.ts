import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { api } from '../services/api'
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
  async (ownerId, { rejectWithValue }) => {
    try {
      const response = await api.get<StoredFile[]>('/files/', {
        params: typeof ownerId === 'number' ? { owner_id: ownerId } : {},
      })

      return response.data
    } catch (error: unknown) {
      // Приводим тип к AxiosError и описываем форму JSON-данных от бэкенда
      const err = error as AxiosError<{ detail?: string }>

      return rejectWithValue(err.response?.data?.detail || 'Не удалось загрузить список файлов')
    }
  }
)

export const deleteFile = createAsyncThunk<number, number>(
  'files/delete',
  async (fileId: number, { rejectWithValue }) => {
    try {
      // запрос к Django. Axios-клиент `api` сам подставит базовый URL и CSRF-токен
      await api.delete(`/files/${fileId}/`)

      // Если запрос успешный, возвращаем ID удаленного файла.
      // Это значение (payload) перейдет на следующий этап в редюсер.
      return fileId
    } catch (error: unknown) {
      // Если сервер вернул ошибку, то перехватываем ее
      const err = error as AxiosError<{ detail?: string }>

      // И возвращаем текст ошибки через специальный хелпер rejectWithValue
      return rejectWithValue(err.response?.data?.detail || 'Не удалось удалить файл')
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

      // Обработка удаления файла
      .addCase(deleteFile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteFile.fulfilled, (state, action: PayloadAction<number>) => {
        state.isLoading = false
        // Оставляем в списке только те файлы, чей id не совпадает с удаленным
        state.items = state.items.filter((file) => file.id !== action.payload)
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || 'Ошибка при удалении файла'
      })
  },
})

export const { clearFilesError } = filesSlice.actions
export default filesSlice.reducer
