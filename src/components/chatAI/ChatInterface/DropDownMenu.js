import styles from '@/components/chatAI/ChatInterface/DropDownMenu.module.css';
import Image from 'next/image';

export default function DropDownMenu({ character, model, countTrueValues, onGetModel, onGetCharacter, onGetShowModal, includeChatHistory, setIncludeChatHistory }) {
    return (
        <nav className="navBox">
            <Image src="/myblock3c/AIchat/media/robot.jpg" width={20} height={20} className={styles.characterTitleImg} alt="robot" />
            <h1 className={styles.title}>Chat with AI</h1>
            <div className={styles.subtitle}>
                <span id={styles.showCharacter}>{character}</span>（<span id={styles.showModel}>{model}</span>）
            </div>
            <input type="checkbox" id={styles.menuButton} />
            <label htmlFor={styles.menuButton} className={styles.line}>
                <div className={styles.menuButton}></div>
            </label>

            <div className={styles.menuList}>
                <ul>
                    {/* 更換模型 */}
                    <li>
                        <a>更換模型</a>
                        <ul className={`${styles.secondMenu} ${styles.models}`}>
                            <li id="Llama3-8B" onClick={(e) => onGetModel(e.currentTarget.id)}><a href="javascript:void(0);">Llama3-8B</a></li>
                            <li id="GPT3.5" onClick={(e) => onGetModel(e.currentTarget.id)}><a href="javascript:void(0);">GPT-3.5</a></li>
                            <li id="GPT4" onClick={(e) => onGetModel(e.currentTarget.id)}><a href="javascript:void(0);">GPT-4</a></li>
                        </ul>
                    </li>

                    {/* 包含聊天紀錄 */}
                    <li>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={includeChatHistory}
                                onChange={() => setIncludeChatHistory(!includeChatHistory)}
                            />
                            包含聊天紀錄
                        </label>
                    </li>

                    {/* 刪除對話 */}
                    <li id={styles.Delete} onClick={() => onGetShowModal()}>
                        <a href="javascript:void(0);">刪除對話</a>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
