import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faXmark } from '@fortawesome/free-solid-svg-icons';
import styles from './ToggleButton.module.css';

function ToggleButton({ showChat, toggleChat }) {
  return (
    <button onClick={toggleChat} className={styles.toggleChatButton}>
      <div className={styles.iconContainer}>
        <FontAwesomeIcon icon={faWandMagicSparkles} className={`${styles.toggleIcon} ${showChat ? styles.fadeOut : styles.fadeIn}`} />
        <FontAwesomeIcon icon={faXmark} className={`${styles.toggleIcon} ${showChat ? styles.fadeIn : styles.fadeOut}`} />
      </div>
    </button>
  );
}

export default ToggleButton;
