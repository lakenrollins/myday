import styles from './Input.module.css';

export const Input = ({ 
  label, 
  error, 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  className = '',
  ...props 
}) => {
  const inputClasses = [
    styles.input,
    error ? styles.error : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.inputContainer}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        className={inputClasses}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default Input;