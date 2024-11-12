import { useState } from 'react';
import ChatInterface from '@/components/chatAI/ChatInterface/ChatInterface';
import ToggleButton from '@/components/chatAI/ToggleButton/ToggleButton';
import styles from '@/components/chatAI/ChatWithAI.module.css';

function ChatWithAI({ viewState }) {
  const [showChat, setShowChat] = useState(false);

  const toggleChat = () => {
    setShowChat(prevShowChat => !prevShowChat);
  };

  return (
    <div className={`${styles.buttonChatContainer} ${!showChat && styles.transparentArea }`}>
      <div className={styles.buttonContainer}>
        <ToggleButton showChat={showChat} toggleChat={toggleChat} viewChatToggle={viewState.ChatToggle}/>
      </div>
      <div className={`${styles.chatInterfaceContainer} ${showChat ? styles.show : styles.hide}`}>
        <ChatInterface/>
      </div>
    </div>
  );
}

export default ChatWithAI;
