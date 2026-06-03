import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import filesReducer from './filesSlice'
import { useDispatch, useSelector } from 'react-redux'

export const store = configureStore({
  reducer: {
    auth: authReducer, // сюда будет писать authSlice
    files: filesReducer,
  },
})

// Добавляем подсказки для Redux Toolkit

// Вытаскиваем типы нашего хранилища напрямую из самого store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// В TypeScript-проектах принято создавать свои версии стандартных хуков Redux.
// Мы привязываем к ним типы нашего приложения, чтобы редактор сам подсказывал нам переменные.
// Везде в проекте мы будем использовать именно их вместо стандартных useDispatch/useSelector.

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
