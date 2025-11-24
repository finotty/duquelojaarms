import Hero from "../components/hero";
import Carousel from "../components/carrousel";
import { FeaturedProducts } from "../components/featured-products";
import FeaturedCategories from "../components/featured-categories";
import EducationalContent from "../components/educational-content";
import BrandsSection from "../components/BrandsSection";
import { TacticalEquipment } from "@/components/tactical-equipment";
import { TiroEsportivos } from "@/components/tiroEsportivo";
import { CustomSections } from "@/components/custom-sections";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <BrandsSection />
      <TacticalEquipment/>
      <TiroEsportivos/>
      <CustomSections />
      {/*<Carousel />
      <FeaturedCategories />
      <EducationalContent />
      
      */}
    </>
  );
}
