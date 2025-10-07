"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
  const imageRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        setScrolled(true);
        imageElement.classList.add("scrolled");
      } else {
        setScrolled(false);
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="w-full pt-36 md:pt-48 pb-10">
      <div className="space-y-6 text-center">
        <div className="space-y-6 mx-auto">
          <h1 className="text-5xl font-bold md:text-6xl lg:text-7xl xl:text-8xl gradient-title animate-gradient">
            Your AI Career Coach for
            <br />
            Professional Success
          </h1>
          <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
            Advance your career with personalized guidance, interview prep, and
            AI-powered tools for job success.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
          <Link href="">
            <Button size="lg" variant="outline" className="px-8">
              Watch Demo
            </Button>
          </Link>
        </div>
        <div className="hero-section flex flex-col items-center justify-center min-h-screen px-6 max-w-7xl mx-auto relative z-10">

  {/* Hero Image with smooth animation */}
  <div className="hero-image-wrapper">
    <img
      ref={imageRef}
      src="/banner.jpeg"
      alt="Hero Banner"
      className={`hero-image ${scrolled ? "scrolled" : ""}`}
    />
  </div>

  {/* Other hero text/content here */}
</div>




      </div>
    </section>
  );
};

export default HeroSection;
