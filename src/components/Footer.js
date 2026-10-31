import Link from "next/link";
import Image from "next/image";
import { ARICT_SOCIAL_LINKS } from "@/lib/constants";
import { MAIN_NAV_LINKS } from "@/lib/seo";
import { Linkedin, Facebook, Github, Instagram } from "lucide-react";

const SOCIAL_LINKS = [
  {
    href: ARICT_SOCIAL_LINKS.github,
    label: "GitHub",
    className: "social-github",
    Icon: Github,
  },
  {
    href: ARICT_SOCIAL_LINKS.linkedin,
    label: "LinkedIn",
    className: "social-linkedin",
    Icon: Linkedin,
  },
  {
    href: ARICT_SOCIAL_LINKS.facebook,
    label: "Facebook",
    className: "social-facebook",
    Icon: Facebook,
  },
  {
    href: ARICT_SOCIAL_LINKS.instagram,
    label: "Instagram",
    className: "social-instagram",
    Icon: Instagram,
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
              <span className="brand-logo-wrap">
                <Image
                  src="/logo.png"
                  alt="ARICT Logo"
                  width={180}
                  height={52}
                  className="footer-brand-logo brand-logo--light"
                />
                <Image
                  src="/logo-dark.png"
                  alt="ARICT Logo"
                  width={180}
                  height={52}
                  className="footer-brand-logo brand-logo--dark"
                />
              </span>
            </Link>
            <p className="footer-text">
              ARICT Past Paper Portal. A student-run examination paper archive
              for Rajarata University of Sri Lanka.
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
              <span className="footer-column-title">Explore the portal</span>
              <nav className="footer-column-links" aria-label="Footer">
                {MAIN_NAV_LINKS.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
              </nav>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-bottom-copy">
            {`© ${currentYear} Association of Rajarata Information & Communication Technology. All rights reserved.`}
          </span>
          <div className="footer-bottom-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
