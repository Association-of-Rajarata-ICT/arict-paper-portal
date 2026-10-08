"use client";

import Link from "next/link";
import Image from "next/image";
import { Linkedin, Facebook, Github, Youtube } from "lucide-react";

const SOCIAL_LINKS = [
  {
    href: "https://www.linkedin.com",
    label: "LinkedIn",
    className: "social-linkedin",
    Icon: Linkedin,
  },
  {
    href: "https://www.facebook.com",
    label: "Facebook",
    className: "social-facebook",
    Icon: Facebook,
  },
  {
    href: "https://github.com",
    label: "GitHub",
    className: "social-github",
    Icon: Github,
  },
  {
    href: "https://www.youtube.com",
    label: "YouTube",
    className: "social-youtube",
    Icon: Youtube,
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" id="main-footer">
      <div className="footer-inner container">
        <div className="footer-top">
          <div className="footer-brand-block">
            <Link href="/" className="footer-brand-link">
              <span className="brand-logo-plate brand-logo-plate--lg">
                <Image
                  src="/logo.png"
                  alt="ARICT Logo"
                  width={180}
                  height={52}
                  className="footer-brand-logo"
                />
              </span>
            </Link>
            <p className="footer-text">
              Crafting digital experiences that move people forward.
            </p>
            <div className="footer-social">
              {SOCIAL_LINKS.map(({ href, label, className, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className={className}
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="footer-columns">
            <div className="footer-column">
              <span className="footer-column-title">Departments</span>
              <div className="footer-column-links">
                <Link href="/search?q=Biological%20Sciences">
                  Biological Sciences
                </Link>
                <Link href="/search?q=Chemical%20Sciences">
                  Chemical Sciences
                </Link>
                <Link href="/search?q=Computing">Computing</Link>
                <Link href="/search?q=Health%20Promotion">
                  Health Promotion
                </Link>
                <Link href="/search?q=Physical%20Sciences">
                  Physical Sciences
                </Link>
              </div>
            </div>
            <div className="footer-column">
              <span className="footer-column-title">Company</span>
              <div className="footer-column-links">
                <Link href="/about">About</Link>
                <Link href="/about">Careers</Link>
                <Link href="/about">Blog</Link>
                <Link href="/about">Press</Link>
              </div>
            </div>
            <div className="footer-column">
              <span className="footer-column-title">Support</span>
              <div className="footer-column-links">
                <Link href="/about">Help Center</Link>
                <Link href="/about">Documentation</Link>
                <Link href="/about">Status</Link>
                <Link href="/about">Contact</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-bottom-copy">
            {`© ${currentYear} Association of Rajarata Information & Communication Technology. All rights reserved.`}
          </span>
          <div className="footer-bottom-links">
            <Link href="/about">Privacy</Link>
            <Link href="/about">Terms</Link>
            <Link href="/about">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
