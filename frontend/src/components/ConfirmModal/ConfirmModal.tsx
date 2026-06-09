import React from 'react'
import styles from './ConfirmModal.module.css'

interface ConfirmModalProps {
  isOpen: boolean // Открыто ли окно
  title: string // Заголовок (например, "Удаление файла")
  message: string // Текст вопроса (например, "Вы уверены?")
  confirmText?: string // Текст кнопки подтверждения
  cancelText?: string // Текст кнопки отмены
  onConfirm: () => void // Функция при согласии
  onCancel: () => void // Функция при отмене
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Да, удалить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
}) => {
  // Если окно закрыто — ничего не рендерим
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onCancel}>
      {/* stopPropagation нужен, чтобы клик внутри модалки не закрывал её */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
