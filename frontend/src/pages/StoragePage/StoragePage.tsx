import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { fetchFiles, deleteFile } from '../../store/filesSlice'
import Spinner from '../../components/Spinner/Spinner'
import ErrorView from '../../components/ErrorView/ErrorView'

import styles from './StoragePage.module.css'
import { Link } from 'react-router-dom'

export const StoragePage = () => {
  const dispatch = useAppDispatch()

  const { isLoading, items, error } = useAppSelector((state) => state.files)

  useEffect(() => {
    dispatch(fetchFiles())
  }, [dispatch])

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить файл "${name}"?`)) {
      dispatch(deleteFile(id))
    }
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
                    <span className={styles.fileName}>{file.original_name}</span>
                    <span className={styles.fileSize}>
                      {(file.size / 1024 / 1024).toFixed(2)} МБ
                    </span>
                  </div>

                  {file.comment && (
                    <span className={styles.comment}>Комментарий: {file.comment}</span>
                  )}

                  {/* Контейнер для кнопок управления файлом */}
                  <div className={styles.fileActions}>
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
