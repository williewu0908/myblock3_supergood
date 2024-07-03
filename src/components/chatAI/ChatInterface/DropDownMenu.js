import styles from './DropDownMenu.module.css';

export default function DropDownMenu({ onGetModel, onGetCharacter, onGetShowModal}) {
    return (
        <nav className="navBox">
            <input type="checkbox" id={styles.menuButton} />
            <label htmlFor={styles.menuButton} className={styles.line}>
                <div className={styles.menuButton}></div>
            </label>

            <div className={styles.menuList}>
                <ul>
                    <li>
                        <a>更換模型</a>
                        <ul className={`${styles.secondMenu} ${styles.models}`}>
                            <li id="Llama3-8B" onClick={(e) => onGetModel(e.currentTarget.id)}><a href="javascript:void(0);">Llama3-8B</a></li>
                            <li id="GPT3.5" onClick={(e) => onGetModel(e.currentTarget.id)}><a href="javascript:void(0);">GPT-3.5</a></li>
                            <li id="GPT4" onClick={(e) => onGetModel(e.currentTarget.id)}><a href="javascript:void(0);">GPT-4</a></li>
                        </ul>
                    </li>
                    {/* <li>
                        <a>切換角色</a>
                        <ul className={`${styles.secondMenu} ${styles.character}`}>
                            <li id="CodingExpert" onClick={(e) => onGetCharacter(e.currentTarget.id)}><a href="javascript:void(0);">Python 專家</a></li>
                            <li id="Wife" onClick={(e) => onGetCharacter(e.currentTarget.id)}><a href="javascript:void(0);">老婆</a></li>
                            <li id="CatMaid" onClick={(e) => onGetCharacter(e.currentTarget.id)}><a href="javascript:void(0);">Cat Maid</a></li>
                        </ul>
                    </li> */}
                    <li id={styles.Delete} onClick={()=> onGetShowModal()}>
                        <a>刪除對話</a>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
