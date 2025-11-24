import React from "react";
import styles from "./styles.module.scss";
import Image from "next/image";
import pistolaBg from "../../../public/img/backgroundimg.jpg";
import pistola2 from "../../../public/img/pistola 2.png";
import mira from "../../../public/img/mira.jpg";

const categories = [
  {
    name: "Pistolas",
    image: pistolaBg,
    link: "#",
  },
  {
    name: "Revólveres",
    image: pistola2,
    link: "#",
  },
  {
    name: "Acessórios",
    image: mira,
    link: "#",
  },
];

export default function FeaturedCategories() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Categorias em Destaque</h2>
      <div className={styles.grid}>
        {categories.map((cat, i) => (
          <div className={styles.card} key={cat.name}>
            <div className={styles.imgWrapper}>
              <Image src={cat.image} alt={cat.name} fill className={styles.bgImg} />
            </div>
            <div className={styles.info}>
              <span className={styles.catName}>{cat.name}</span>
              <a href={cat.link} className={styles.moreLink}>Saiba mais <span>→</span></a>
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