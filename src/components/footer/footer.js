export default function Footer() {
  return (
    <footer
      className="footer"
      style={{
        display: "block",
        width: "100%",
        textAlign: "center",
        background: "#7E92A9",
        color: "white",
        lineHeight: 1.5,
        padding: "1px 0",
        fontFamily: "'Poppins', sans-serif",
        height: "17.1%%"
      }}
    >
      {/* <p>&emsp;</p> */}
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
      <p>Source: Yu-Kun Tsai (蔡煜堃), Yan-Yu Chen (陳彥宇), Wei-Ting Wu (吳威廷)</p>
    </footer>
  );
}
