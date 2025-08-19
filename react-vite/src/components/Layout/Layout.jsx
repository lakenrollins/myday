import { useSelector } from 'react-redux';
import Header from './Header';
import styles from './Layout.module.css';

export const Layout = ({ children, onSearch, loading = false }) => {
  const user = useSelector(state => state.session.user);

  if (loading) {
    return (
      <div className={styles.layout}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Header user={user} onSearch={onSearch} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default Layout;