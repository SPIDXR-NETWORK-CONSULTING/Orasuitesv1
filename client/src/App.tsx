import { motion } from "framer-motion";
import logoImage from "@assets/WhatsApp_Image_2025-08-06_at_17.22.03_(1)_1770213670965.jpeg";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "#0e0c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: "center" }}
      >
        <img
          src={logoImage}
          alt="ORÁ Suites"
          style={{
            width: "clamp(120px, 30vw, 220px)",
            height: "auto",
            marginBottom: "2.5rem",
            opacity: 0.95,
          }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{
            width: "40px",
            height: "1px",
            backgroundColor: "#c5a882",
            margin: "0 auto 2rem",
          }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          style={{
            color: "#c5a882",
            fontSize: "clamp(0.65rem, 2vw, 0.75rem)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontFamily: "Georgia, serif",
          }}
        >
          Coming Soon
        </motion.p>
      </motion.div>
    </div>
  );
}
