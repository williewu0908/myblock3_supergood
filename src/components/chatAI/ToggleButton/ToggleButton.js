import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faXmark } from '@fortawesome/free-solid-svg-icons';
import styles from '@/components/chatAI/ToggleButton/ToggleButton.module.css';

function ToggleButton({ showChat, toggleChat, viewChatToggle}) {
  return (
    <button onClick={toggleChat} className={`${styles.toggleChatButton} ${viewChatToggle ? styles.show : styles.hide}`}>
      <div className={styles.iconContainer}>
        <FontAwesomeIcon icon={faWandMagicSparkles} className={`${styles.toggleIcon} ${showChat ? styles.fadeOut : styles.fadeIn}`} />
        <FontAwesomeIcon icon={faXmark} className={`${styles.toggleIcon} ${showChat ? styles.fadeIn : styles.fadeOut}`} />
      </div>
    </button>
  );
}

export default ToggleButton;
