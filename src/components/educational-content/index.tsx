import React from "react";
import styles from "./styles.module.scss";
import Image from "next/image";
import educativo1 from "../../../public/img/educativo 1 e  2 (1).png";
import educativo2 from "../../../public/img/educativo 3.png";
import educativo3 from "../../../public/img/imagem 1.png";

const contents = [
  {
    type: "Artigo",
    time: "8 min de leitura",
    title: "Guia Completo: Documentação para Compra Legal de Armas",
    desc: "Entenda todos os documentos e processos necessários para adquirir legalmente uma arma de fogo no Brasil.",
    image: educativo1,
    link: "#",
  },
  {
    type: "Vídeo",
    time: "12 min de leitura",
    title: "Segurança no Manejo: Técnicas Essenciais",
    desc: "Aprenda as técnicas corretas para manusear armas de fogo com segurança e responsabilidade.",
    image: educativo2,
    link: "#",
  },
  {
    type: "Artigo",
    time: "6 min de leitura",
    title: "Legislação Atual: O que Mudou para CACs em 2023",
    desc: "Um panorama completo das mudanças recentes na legislação para Caçadores, Atiradores e Colecionadores.",
    image: educativo3,
    link: "#",
  },
];

export default function EducationalContent() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Conteúdo Educativo</h2>
      <p className={styles.subtitle}>
        Informações essenciais sobre legislação, segurança e manuseio adequado de armas de fogo.
      </p>
      <div className={styles.grid}>
        {contents.map((item, i) => (
          <div className={styles.card} key={i}>
            <div className={styles.imgWrapper}>
              <Image src={item.image} alt={item.title} fill className={styles.bgImg} />
            </div>
            <div className={styles.info}>
              <div className={styles.topInfo}>
                <span className={styles.type}><span className={styles.typeIcon}>{item.type === 'Vídeo' ? '▶' : '📄'}</span> {item.type}</span>
                <span className={styles.time}>{item.time}</span>
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>
              <a href={item.link} className={styles.moreLink}>Leia mais <span>→</span></a>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.btnWrapper}>
        <button className={styles.moreBtn}>Ver mais conteúdos</button>
      </div>
    </section>
  );
} 