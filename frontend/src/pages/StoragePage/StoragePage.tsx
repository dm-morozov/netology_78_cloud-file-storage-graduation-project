import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { fetchFiles, deleteFile, downloadFile, updateFile } from '../../store/filesSlice'
import Spinner from '../../components/Spinner/Spinner'
import ErrorView from '../../components/ErrorView/ErrorView'

import styles from './StoragePage.module.css'
import { Link } from 'react-router-dom'

export const StoragePage = () => {
  const dispatch = useAppDispatch()

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

  useEffect(() => {
    dispatch(fetchFiles())
  }, [dispatch])

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить файл "${name}"?`)) {
      dispatch(deleteFile(id))
    }
  }

  const handleDownload = (id: number, name: string) => {
    dispatch(downloadFile({ fileId: id, fileName: name }))
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Хранилище</h1>

      {isLoading && <Spinner />}

      {error && <ErrorView message={error} onRetry={() => dispatch(fetchFiles())} />}

      {!isLoading && !error && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Список файлов в облаке:</h3>
          {items.length === 0 ? (
            <p className={styles.emptyList}>
              Хранилище файлов постое. Добавьте первый файл. В дальнейшем ссылка на добавление{' '}
              <Link to='/upload' className={styles.emptyLink}>
                ссылка
              </Link>
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
                      {(file.size / 1024 / 1024).toFixed(2)} МБ
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
                    <button
                      className={styles.downloadButton}
                      onClick={() => handleDownload(file.id, file.original_name)}
                    >
                      Скачать
                    </button>
                    <button
                      onClick={() => handleDelete(file.id, file.original_name)}
                      className={styles.deleteButton}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
