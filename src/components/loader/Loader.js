import styles from '@/components/loader/Loader';

const Loader = () => {
    return (
        <div className={styles.loaderContainer}>
            <div className={styles.loader}>
                <div className={styles.circle}></div>
                <div className={styles.circle}></div>
                <div className={styles.circle}></div>
            </div>
            <p className={styles.loadingText}>Initializing...</p>
        </div>
    );
};

export default Loader;
