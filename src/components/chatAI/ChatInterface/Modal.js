import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from '@/components/chatAI/ChatInterface/Modal.module.css';

function Modal({ showModal, onConfirm, onCancel }) {
    const modalContentRef = useRef(null);
    const [shouldRender, setShouldRender] = useState(showModal);

    useEffect(() => {
        const modalContent = modalContentRef.current;
        if (showModal) {
            setShouldRender(true);
            setTimeout(() => {
                modalContent.style.transform = 'translateY(-50%) scale(1)';
            }, 0);
        } else {
            modalContent.style.transform = 'translateY(-50%) scale(0)';
            setTimeout(() => {
                setShouldRender(false);
            }, 300);
        }
    }, [showModal]);

    return (
        <div className={`${styles.modal} ${shouldRender ? styles.show : styles.hide}`}>
            <div ref={modalContentRef} id={styles.modalContent} className={styles.modalContent}>
                <Image src="/myblock3/AIchat/media/cleanrobot.png" width={120} height={120} className={styles.cleanRobot} alt="Clean Robot" />
                <p>你確定要刪除所有對話嗎？</p>
                <div className={styles.modalButtons}>
                    <button id={styles.confirmDelete} className={styles.modalButton} onClick={onConfirm}>確定</button>
                    <button id={styles.cancelDelete} className={styles.modalButton} onClick={onCancel}>取消</button>
                </div>
            </div>
        </div>
    )
}

export default Modal;
