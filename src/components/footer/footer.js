export default function Footer() {
  return (
    <footer
      className="footer"
      style={{
        display: "flex", // 使用 flex 布局
        flexDirection: "column", // 元素垂直排列
        alignItems: "flex-start", // 將元素靠上排列
        justifyContent: "flex-start", // 垂直方向靠上
        width: "100%",
        textAlign: "left", // 文字靠左
        background: "#4b5c66",
        color: "white",
        lineHeight: 1.5,
        padding: "15px",
        fontFamily: "'Poppins', sans-serif",
        height: "auto",
      }}
    >
      <p>&emsp;</p>
      <p>
        <a style={{ color: "white" }} href="https://sites.google.com/mail.nknu.edu.tw/cph/home">
          🌏HIE Lab | Ⓖ 🚀 Ⓖ | 🛸 Ⓖ | 🚜 Ⓦ&emsp;
        </a>
      </p>
      <p>
        <a style={{ color: "white" }} href="https://sites.google.com/mail.nknu.edu.tw/iecnknu/%E9%A6%96%E9%A0%81">
          &emsp;🌏NKNU-IEC Ⓖ Ⓕ Ⓑ
        </a>
      </p>
      <p>© 2008-2025 Power by Po-Hsun Cheng (鄭伯壎) and Li-Wei Chen (陳立偉),</p>
      <p>Information Education Center, National Kaohsiung Normal University, Taiwan.</p>
      <p>Source: Yu-Kun Tsai (蔡煜堃), XXX-XXX XXX (陳彥宇), XXX-XXX XXX (吳威廷)</p>
    </footer>
  );
}
