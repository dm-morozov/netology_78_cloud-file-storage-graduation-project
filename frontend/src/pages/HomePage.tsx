import { Link } from 'react-router-dom'
import { useAppSelector } from '../store/store'
import styles from './HomePage.module.css'

export const HomePage = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  return (
    <div className={styles.homePage}>
      {/* Герой-секция */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Ваше персональное облачное хранилище</h1>
        <p className={styles.heroSubtitle}>
          Безопасное, быстрое и удобное место для хранения ваших файлов. Загружайте документы,
          делитесь ссылками и управляйте доступом в один клик.
        </p>
        <div className={styles.actions}>
          {isAuthenticated ? (
            <Link to='/storage' className={styles.primaryBtn}>
              Перейти в хранилище {user?.first_name ? `, ${user.first_name}` : ''} →
            </Link>
          ) : (
            <>
              <Link to='/register' className={styles.primaryBtn}>
                Начать использование
              </Link>
              <Link to='/login' className={styles.secondaryBtn}>
                Войти в аккаунт
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Секция статистики */}
      <section className={styles.statsSection}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>500 МБ</div>
          <div className={styles.statLabel}>Максимальный размер файла</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>100%</div>
          <div className={styles.statLabel}>Контроль над данными</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>Мгновенно</div>
          <div className={styles.statLabel}>Генерация публичных ссылок</div>
        </div>
      </section>

      {/* Секция преимуществ */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Возможности платформы</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>📁</div>
            <h3>Управление файлами</h3>
            <p>
              Удобный интерфейс для загрузки, скачивания, переименования и удаления файлов любых
              форматов.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>🔗</div>
            <h3>Публичный доступ</h3>
            <p>
              Генерируйте уникальные публичные ссылки, чтобы делиться своими файлами с друзьями и
              коллегами.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>👁️</div>
            <h3>Быстрый просмотр</h3>
            <p>
              Просматривайте изображения, PDF и текстовые документы прямо в браузере без
              необходимости скачивания.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>🛡️</div>
            <h3>Админ-панель</h3>
            <p>
              Специальный интерфейс для администраторов системы для управления пользователями и их
              файловым пространством.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
