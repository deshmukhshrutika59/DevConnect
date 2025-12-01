
import React from "react";
import Hero from "../components/Hero";
import Features from "../components/Features";
import CommunitySpotlight  from "../components/CommunitySpotlight";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <CommunitySpotlight  />  
      <Features />
      <Footer />
    </>
  );
}

