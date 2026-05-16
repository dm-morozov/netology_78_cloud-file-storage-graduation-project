interface ErrorViewProps {
  message: string
  onRetry?: () => void
}

/**
 * Компонент отображения ошибки
 *
 * @param {string} message - текст ошибки
 * @param {() => void} onRetry - функция, вызываемая при клике на кнопку "Повторить запрос"
 */
const ErrorView = ({ message, onRetry }: ErrorViewProps) => {
  return (
    <div>
      <div className='text-center text-danger'>{message}</div>
      {onRetry && typeof onRetry === 'function' && (
        <button onClick={onRetry}>Повторить запрос</button>
      )}
    </div>
  )
}

export default ErrorView
