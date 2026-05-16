import styles from './Spinner.module.css'

const Spinner = () => {
  return (
    <div className={styles.preloader}>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  )
}

export default Spinner
