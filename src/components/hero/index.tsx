import Image from "next/image";
import styles from "./styles.module.scss";
import bgImg from "../../../public/img/backgroundimg.jpg";

export default function Hero() {
  return (
    <div className={styles.hero}>
      <div className={styles.heroContent}>
        <span className={styles.subtitle}>PRECISÃO E SEGURANÇA</span>
        <h1 className={styles.title}>Armamentos de Alta Precisão</h1>
        <p className={styles.description}>
          Explore nossa coleção de armamentos premium, projetados para precisão, confiabilidade e segurança inigualáveis.
        </p>
       
      </div>
      <div className={styles.heroBg}>
        <Image src={bgImg} alt="Arma de precisão" fill priority className={styles.bgImage} />
      </div>
    </div>
  );
} 