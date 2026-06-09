import { api } from '../../services/api'
import type { AxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/store'
import {
  fetchFiles,
  deleteFile,
  downloadFile,
  updateFile,
  uploadFile,
  generatePublicLink,
  viewFileInline,
} from '../../store/filesSlice'
import Spinner from '../../components/Spinner/Spinner'
import ErrorView from '../../components/ErrorView/ErrorView'

import styles from './StoragePage.module.css'
import { formatBytes } from '../../utils/format'
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal'

export const StoragePage = () => {
  const dispatch = useAppDispatch()

  // Состояние для хранения данных файла, который будем удалять
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  const { isLoading, items, error } = useAppSelector((state) => state.files)

  // Состояния для редактирования имени и комментария

  // Какой файл сейчас редактируется
  const [editingFileId, setEditingFileId] = useState<number | null>(null)
  // Какое конкретно поле редактируется
  const [editingField, setEditingField] = useState<'name' | 'comment' | null>(null)
  // Временное хранилище для имени файла при редактировании
  const [editName, setEditName] = useState('')
  // Временное хранилище для комментария файла при редактировании
  const [editComment, setEditComment] = useState('')

  // Состояния для загрузки нового файла
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadComment, setUploadComment] = useState<string>('')
  const [isDragActive, setIsDragActive] = useState<boolean>(false)

  // Хранит ID файла, ссылка которого была только что скопирована
  const [copiedFileId, setCopiedFileId] = useState<number | null>(null)

  // Реф для связи клика по Dropzone со скрытым инпутом выбора файлов
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Включение режима редактирования имени
  const startEditName = (id: number, currentName: string | null) => {
    setEditingFileId(id)
    setEditingField('name')
    setEditName(currentName || '')
  }

  // Включение режима редактирования комментария
  const startEditComment = (id: number, currentComment: string | null) => {
    setEditingFileId(id)
    setEditingField('comment')
    setEditComment(currentComment || '')
  }

  // Сброс режима редактирования
  const cancelEdit = () => {
    setEditingFileId(null)
    setEditingField(null)
    setEditName('')
    setEditComment('')
  }

  const handleSave = async (fileID: number) => {
    if (editingField === 'name') {
      if (!editName.trim()) {
        cancelEdit()
        return
      }

      // Если данные не изменились, то просто выходим из режима редактирования
      const targetFile = items.find((item) => item.id === fileID)
      if (targetFile?.original_name === editName.trim()) {
        cancelEdit()
        return
      }

      try {
        await dispatch(
          updateFile({ fileId: fileID, data: { original_name: editName.trim() } })
        ).unwrap()
      } catch (error) {
        console.error('Ошибка при обновлении имени файла:', error)
      }
    }

    if (editingField === 'comment') {
      // Если данные не изменились, то просто выходим из режима редактирования
      const targetFile = items.find((item) => item.id === fileID)
      if (targetFile?.comment === editComment.trim()) {
        cancelEdit()
        return
      }

      try {
        await dispatch(
          updateFile({ fileId: fileID, data: { comment: editComment.trim() } })
        ).unwrap()
      } catch (error) {
        console.error('Ошибка при обновлении комментария файла:', error)
      }
    }
    cancelEdit()
  }

  // Обработчик перетаскивания файла над зоной
  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setIsDragActive(true)
    } else if (event.type === 'dragleave' || event.type === 'drop') {
      setIsDragActive(false)
    }
  }

  // Обработчик "броска" файла в зону
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)

    // Отбираем только первый файл
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setSelectedFile(event.dataTransfer.files[0])
    }
  }

  // Обработчик выбора файла через стандартный проводник
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
    }
  }

  // Клик по Dropzone открывает проводник
  const onDropzoneClick = () => {
    fileInputRef.current?.click()
  }

  // Отправка файла на сервер
  const handleUploadSubmit = async (event: React.SubmitEvent) => {
    event.preventDefault()
    if (!selectedFile) return

    try {
      // unwrap-ом перехватываем возможную ошибку thunk-а
      // и сбрасываем форму после успешной загрузки
      await dispatch(uploadFile({ file: selectedFile, comment: uploadComment })).unwrap()

      // Очищаем состояния после успешной загрузки
      setSelectedFile(null)
      setUploadComment('')
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error)
    }
  }

  useEffect(() => {
    dispatch(fetchFiles())
  }, [dispatch])

  // Вызывается при клике на иконку корзины
  const handleDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ id, name }) // Запоминаем цель и открываем модалку
  }

  // Вызывается при нажатии "Да, удалить" в модалке
  const handleConfirmDelete = () => {
    if (deleteTarget) {
      dispatch(deleteFile(deleteTarget.id))
      setDeleteTarget(null) // Закрываем модалку
    }
  }

  const handleDownload = (id: number, name: string) => {
    dispatch(downloadFile({ fileId: id, fileName: name }))
  }

  // Обработчик генерации и копирования публичной ссылки
  const handleShare = async (fileId: number, publicToken: string | null) => {
    // TODO: сделать
    let token = publicToken

    try {
      // Если токена еще нет — генерируем его на сервере
      if (!token) {
        const result = await dispatch(generatePublicLink(fileId)).unwrap()
        token = result.public_token
      }

      // Вычисляем адрес бэкенда на основе настроек Axios
      const apiBase = api.defaults.baseURL || 'http://localhost:8000/api'
      const backendBase = apiBase.replace(/\/api$/, '') // Убираем "/api" с конца
      const publicUrl = `${backendBase}/api/public/files/${token}/`

      // Копируем ссылку в буфер обмена браузера
      await navigator.clipboard.writeText(publicUrl)
      // Показываем уведомление на 2 секунды
      setCopiedFileId(fileId)
      setTimeout(() => {
        setCopiedFileId(null)
      }, 2000)
    } catch (error) {
      // Приводим ошибку к AxiosError для безопасного доступа к полю detail
      const err = error as AxiosError<{ detail?: string }>
      console.error('Не удалось скопировать ссылку:', err.response?.data?.detail)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Хранилище</h1>

      {/* Форма загрузки нового файла */}
      <form onSubmit={handleUploadSubmit} className={styles.uploadForm}>
        <div
          className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''} ${selectedFile ? styles.hasFile : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onDropzoneClick}
        >
          {/* Скрытый стандартный инпут */}
          <input
            ref={fileInputRef}
            type='file'
            onChange={handleFileChange}
            className={styles.hiddenFileInput}
          />

          <div className={styles.dropzoneContent}>
            <span className={styles.uploadIcon}>☁️</span>
            {selectedFile ? (
              <p className={styles.dropzoneText}>
                Выбран файл: <strong>{selectedFile.name}</strong> ({formatBytes(selectedFile.size)})
              </p>
            ) : (
              <p className={styles.dropzoneText}>
                Перетащите файл сюда или <strong>нажмите для выбора</strong>
              </p>
            )}
          </div>
        </div>
        {/* Если файл выбран, показываем поле для комментария и кнопку загрузки */}
        {selectedFile && (
          <div className={styles.uploadDetails}>
            <input
              type='text'
              placeholder='Добавить необязательный комментарий к файлу...'
              value={uploadComment}
              onChange={(e) => setUploadComment(e.target.value)}
              className={styles.uploadCommentInput}
            />
            <div className={styles.uploadActions}>
              <button type='submit' className={styles.submitUploadBtn}>
                Загрузить в облако
              </button>
              <button
                type='button'
                onClick={() => setSelectedFile(null)}
                className={styles.cancelUploadBtn}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </form>

      {isLoading && <Spinner />}

      {error && <ErrorView message={error} onRetry={() => dispatch(fetchFiles())} />}

      {!isLoading && !error && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Список файлов в облаке:</h3>
          {items.length === 0 ? (
            <p className={styles.emptyList}>
              Хранилище файлов постое. <br />
              Добавьте первый файл.
            </p>
          ) : (
            <ul className={styles.list}>
              {items.map((file) => (
                <li key={file.id} className={styles.listItem}>
                  <div className={styles.fileMainInfo}>
                    {/* Если редактируем имя данного файла */}
                    {editingFileId === file.id && editingField === 'name' ? (
                      <div className={styles.inlineEditWrapper}>
                        <input
                          type='text'
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className={styles.editInput}
                          autoFocus
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') handleSave(file.id)
                            if (event.key === 'Escape' || !editName.trim()) cancelEdit()
                          }}
                          onBlur={() => {
                            // Если пользователь стёр имя и ушёл из инпута — просто отменяем
                            if (!editName.trim()) {
                              cancelEdit()
                            } else {
                              // Иначе — автоматически сохраняем изменения для удобства
                              handleSave(file.id)
                            }
                          }}
                        />

                        <button
                          // Используем onMouseDown вместо onClick
                          onMouseDown={(event) => {
                            event.preventDefault() // предотвращаем потерю фокуса инпутом
                            handleSave(file.id)
                          }}
                          className={styles.saveBtn}
                          disabled={!editName.trim()}
                          title='Сохранить'
                        >
                          ✓
                        </button>

                        <button
                          // Используем onMouseDown вместо onClick
                          onMouseDown={(event) => {
                            event.preventDefault() // предотвращаем потерю фокуса
                            cancelEdit()
                          }}
                          className={styles.cancelBtn}
                          title='Отмена'
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <span className={styles.fileName}>
                        {file.original_name}
                        <button
                          onClick={() => startEditName(file.id, file.original_name)}
                          className={styles.iconBtn}
                          title='Переименовать'
                        >
                          ✏️
                        </button>
                      </span>
                    )}
                    <span className={styles.fileSize}>
                      {formatBytes(file.size)}
                      {/* Если файл публичный — выводим красивую плашку */}
                      {file.public_token && (
                        <span className={styles.publicBadge} title='Файл доступен по ссылке'>
                          🌐 Публичный
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Секция для вывода/редактирования комментария */}
                  <div className={styles.commentSection}>
                    {editingFileId === file.id && editingField === 'comment' ? (
                      <div className={styles.inlineEditWrapper}>
                        <input
                          type='text'
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          placeholder='Введите комментарий...'
                          className={styles.editInput}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(file.id)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          onBlur={() => {
                            // Для комментария: при потере фокуса просто сохраняем (даже если он пустой)
                            handleSave(file.id)
                          }}
                        />
                        <button
                          onMouseDown={(event) => {
                            event.preventDefault()
                            handleSave(file.id)
                          }}
                          className={styles.saveBtn}
                          title='Сохранить'
                        >
                          ✓
                        </button>
                        <button
                          onMouseDown={(event) => {
                            event.preventDefault()
                            cancelEdit()
                          }}
                          className={styles.cancelBtn}
                          title='Отмена'
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <>
                        {file.comment ? (
                          <div className={styles.commentValueWrapper}>
                            <span className={styles.commentText}>💬 {file.comment}</span>
                            <button
                              onClick={() => startEditComment(file.id, file.comment)}
                              className={styles.iconBtn}
                              title='Редактировать комментарий'
                            >
                              ✏️
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditComment(file.id, '')}
                            className={styles.addCommentBtn}
                          >
                            + Добавить комментарий
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Контейнер для кнопок управления файлом */}
                  <div className={styles.fileActions}>
                    {/*Кнопка поделиться*/}
                    {copiedFileId === file.id ? (
                      <span className={styles.shareStatus}>🔗 Ссылка скопирована! </span>
                    ) : (
                      <button
                        // Если файл уже публичный, добавляем класс copyLinkButton, иначе shareButton
                        className={file.public_token ? styles.copyLinkButton : styles.shareButton}
                        onClick={() => handleShare(file.id, file.public_token)}
                        title={
                          file.public_token
                            ? 'Копировать публичную ссылку'
                            : 'Сделать файл доступным по ссылке'
                        }
                      >
                        {file.public_token ? '📋' : '🔗'}
                      </button>
                    )}

                    <button
                      className={styles.viewButton}
                      onClick={() => dispatch(viewFileInline({ fileId: file.id }))}
                      title='Открыть в браузере (просмотр)'
                    >
                      👁️
                    </button>
                    <button
                      className={styles.downloadButton}
                      onClick={() => handleDownload(file.id, file.original_name)}
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={() => handleDeleteClick(file.id, file.original_name)}
                      className={styles.deleteButton}
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title='Удаление файла'
        message={`Вы действительно хотите удалить файл "${deleteTarget?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
