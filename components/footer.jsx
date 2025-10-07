"use client";

import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

export default function Footer() {
  const teamLinks = [
    { name: "Om", github: "https://github.com/KrexzGG", linkedin: "https://www.linkedin.com/in/om-brahmavale-392853271" },
    { name: "Shreesh", github: "https://github.com/shxeesh69", linkedin: "https://www.linkedin.com/in/shreesh9 " },
    { name: "Ritesh", github: "https://github.com/Jmie-175", linkedin: "https://www.linkedin.com/in/ritesh-jamdar-168246271" },
    { name: "Sahil", github: "https://github.com/sahil-b13", linkedin: "https://www.linkedin.com/in/sahil-birje-82b0b8272" },
  ];
  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-background to-black/40">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/resume" className="hover:text-foreground/90 transition">AI Resume</Link></li>
              <li><Link href="/ai-cover-letter" className="hover:text-foreground/90 transition">AI Cover Letter</Link></li>
              <li><Link href="/interview" className="hover:text-foreground/90 transition">Mock Interview</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground/90 transition">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#features" className="hover:text-foreground/90 transition">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-foreground/90 transition">How it works</Link></li>
              <li><Link href="/#faqs" className="hover:text-foreground/90 transition">FAQs</Link></li>
              <li><Link href="/" className="hover:text-foreground/90 transition">Home</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Team</h3>
            <ul className="space-y-2 text-sm">
              {teamLinks.map((member) => (
                <li key={member.name} className="flex items-center justify-between">
                  <span className="text-foreground/90">{member.name}</span>
                  <span className="flex items-center gap-2">
                    <Link href={member.github} className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition" target="_blank" rel="noreferrer" aria-label={`${member.name} GitHub`}>
                      <Github className="h-4 w-4" />
                    </Link>
                    <Link href={member.linkedin} className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition" target="_blank" rel="noreferrer" aria-label={`${member.name} LinkedIn`}>
                      <Linkedin className="h-4 w-4" />
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>Made by Om, Shreesh, Ritesh, Sahil © 2025</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground/90 transition">Terms</Link>
            <span className="opacity-30">•</span>
            <Link href="/privacy" className="hover:text-foreground/90 transition">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


