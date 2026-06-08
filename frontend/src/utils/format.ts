/**
 * Форматирует размер в байтах в читаемый вид (Б, КБ, МБ, ГБ, ТБ)
 */
export const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return '0 Б'

  const k = 1024
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']

  // Вычисляем, в какую величину переводить (0 = Б, 1 = КБ, 2 = МБ и т.д.)
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  // Делим байты на степень 1024 и округляем до 2 знаков после запятой
  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(2))

  return `${formattedValue} ${sizes[i]}`
}
