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

// Создаем асинхронный Thunk для удаления файла
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

// Асинхронный Thunk для скачивания файла
// <void, { fileId: number; fileName: string }> означает:
// ничего не возвращаем в стейт Redux (void), на вход принимаем объект с ID и именем файла
export const downloadFile = createAsyncThunk<void, { fileId: number; fileName: string }>(
  'files/download',
  async ({ fileId, fileName }, { rejectWithValue }) => {
    try {
      // Запрашиваем файл у Django как Blob (бинарные данные)
      // axios будет использовать наш AppAxios, где уже настроены куки
      const response = await api.get(`/files/${fileId}/download/`, { responseType: 'blob' })

      // Создаем временную ссылку в памяти браузера, указывающую на этот Blob
      const url = window.URL.createObjectURL(new Blob([response.data]))

      // Создаем временный, невидимый элемент <a> для симуляции скачивания
      const link = document.createElement('a')
      link.href = url

      // Скрываем элемент, чтобы он не мешал пользователю
      link.style.display = 'none'

      // Задаем оригинальное имя файла, под которым он сохранится на компьютер
      link.setAttribute('download', fileName)

      // Встраиваем ссылку в DOM-дерево
      document.body.appendChild(link)

      // Инициируем программный клик по ссылке — это запустит скачивание
      link.click()

      // Очищаем созданную ссылку и URL
      link.remove()
      // освобождаем память браузера от Blob-объекта
      window.URL.revokeObjectURL(url)

      // В редюсер для success-ветки мы ничего не возвращаем (void)
      // Это сигнал, что браузер сам позаботился о скачивании файла.
      return
    } catch (error: unknown) {
      // Если произошла ошибка (например, 404 или 403), перехватываем ее
      const err = error as AxiosError<{ detail?: string }>

      // Возвращаем текст ошибки, который будет передан в редюсер
      return rejectWithValue(err.response?.data?.detail || 'Не удалось скачать файл')
    }
  }
)
// На входе Thunk будет принимать объект с ID файла и полями, которые мы хотим изменить
export const updateFile = createAsyncThunk<
  StoredFile,
  { fileId: number; data: { original_name?: string; comment?: string | null } }
>('files/update', async ({ fileId, data }, { rejectWithValue }) => {
  try {
    // Отправляем PATCH запрос на /files/<fileId>/ с объектом измененных полей
    const response = await api.patch<StoredFile>(`/files/${fileId}/`, data)

    // Возвращаем измененный объект файла, который пришел с бэкенда
    return response.data
  } catch (error: unknown) {
    const err = error as AxiosError<{ detail?: string }>

    return rejectWithValue(err.response?.data?.detail || 'Не удалось обновить файл')
  }
})

// Асинхронный Thunk для загрузки нового файла
// <StoredFile, { file: File; comment: string }>
// Означает: при успехе возвращаем добавленный файл (StoredFile), на вход принимаем объект с файлом и комментарием
export const uploadFile = createAsyncThunk<StoredFile, { file: File; comment: string }>(
  'files/upload',
  async ({ file, comment }, { rejectWithValue }) => {
    try {
      // Создаем объект FormData для отправки файла на сервер
      const formData = new FormData()
      formData.append('file', file) // ключ "file" строго соответствует сериализатору Django

      if (comment.trim()) {
        formData.append('comment', comment.trim())
      }

      // Делаем POST запрос. Axios сам подставит нужные заголовки multipart/form-data
      const response = await api.post<{ file: StoredFile; message: string }>('/files/', formData)

      // Возвращаем добавленный файл из ответа сервера
      return response.data.file
    } catch (error: unknown) {
      const err = error as AxiosError<{ detail?: string }>
      return rejectWithValue(err.response?.data?.detail || 'Не удалось загрузить файл')
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

      // Обновление файла (переименование или изменение комментария)
      .addCase(updateFile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateFile.fulfilled, (state, action: PayloadAction<StoredFile>) => {
        state.isLoading = false
        // Пробегаем по списку: заменяем старую версию файла на новую по совпадению ID
        state.items = state.items.map((file) =>
          file.id === action.payload.id ? action.payload : file
        )
      })
      .addCase(updateFile.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || 'Ошибка при обновлении файла'
      })
      .addCase(uploadFile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(uploadFile.fulfilled, (state, action: PayloadAction<StoredFile>) => {
        state.isLoading = false
        // Добавляем новый файл в начало списка
        state.items.unshift(action.payload)
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || 'Ошибка при загрузке файла'
      })

    //
  },
})

export const { clearFilesError } = filesSlice.actions
export default filesSlice.reducer
