"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const robotBg = `url('/1.jpg')`;

export default function NotFound() {
  return (
    <div className="not-found-bg flex flex-col items-center justify-center min-h-screen px-4 relative overflow-hidden text-center">
      {/* Subtle gradient/overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/70 pointer-events-none z-0"></div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        <h1
          className="soul-404 text-[5rem] sm:text-[7rem] font-extrabold mb-2 select-none"
        >
          404
        </h1>
        <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-gray-100 drop-shadow-lg">
          Lost in Cyberspace...
        </h2>
        <p className="text-gray-300 mb-8 max-w-md drop-shadow">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.<br />
          Even our friendly robot couldn&apos;t find it!
        </p>
        <Link href="/">
          <Button className="hover:scale-110 hover:animate-wiggle shadow-lg transition-all duration-200">
            Return Home
          </Button>
        </Link>
      </div>

      <style jsx>{`
        .not-found-bg {
          background-image: ${robotBg};
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          filter: brightness(1.08) blur(0.2px);
          transition: filter 1s;
          min-height: 100vh;
        }
        /* Animate the 404 for a 'flow' flicker effect in B&W */
        .soul-404 {
          color: #fff;
          letter-spacing: 0.09em;
          /* Black & White only: */
          filter: grayscale(1) brightness(1.05) blur(0.2px) drop-shadow(0 2px 16px #0008);
          /* Flicker/flow animation: */
          animation: souls404 2.3s infinite alternate ease-in-out;
        }
        @keyframes souls404 {
          0% {
            filter: grayscale(1) blur(0.08px) brightness(1.07) drop-shadow(0 2px 16px #0008);
            text-shadow: 0 2px 30px #fff1;
          }
          12% {
            filter: grayscale(1) blur(0.13px) brightness(1.02) drop-shadow(0 2px 8px #0007);
            text-shadow: 0 3px 16px #aaa8;
          }
          25% {
            filter: grayscale(1) blur(0.20px) brightness(0.96) drop-shadow(0 4px 20px #fff2);
            text-shadow: 0 4px 24px #eee2;
          }
          50% {
            filter: grayscale(1) blur(0.07px) brightness(1.09) drop-shadow(0 3px 20px #fff3);
            text-shadow: 0 2px 24px #aaa8;
          }
          66% {
            filter: grayscale(1) blur(0.18px) brightness(1.03) drop-shadow(0 2px 8px #fff8);
            text-shadow: 0 1px 16px #aaa8;
          }
          75% {
            filter: grayscale(1) blur(0.23px) brightness(1.13) drop-shadow(0 4px 32px #fff6);
            text-shadow: 0 6px 48px #fff2;
          }
          100% {
            filter: grayscale(1) blur(0.07px) brightness(1.02) drop-shadow(0 2px 18px #000a);
            text-shadow: 0 4px 32px #fff3;
          }
        }
        /* Button Wiggle Animation */
        @keyframes wiggle {
          0%, 100% { transform: rotate(-2deg);}
          10%, 40%, 60%, 80% { transform: rotate(2deg);}
          20%, 50%, 70% { transform: rotate(-2deg);}
          30% { transform: rotate(2deg);}
        }
        .hover\\:animate-wiggle:hover { animation: wiggle 0.38s linear; }

        /* Optional: popin content if you want a soft enter animation */
        @keyframes popin {
          0% { transform: scale(0.98) translateY(28px); opacity: 0;}
          100% { transform: scale(1) translateY(0); opacity: 1;}
        }
        .z-10 {
          animation: popin 0.65s cubic-bezier(.20,.72,.35,1.16);
        }
      `}</style>
    </div>
  );
}
