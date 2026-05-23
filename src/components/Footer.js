import Link from "next/link";
import Image from "next/image";
import { Twitter, Linkedin, Github, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-inner container">
        <div className="footer-top">
          <div className="footer-brand-block">
            <Link href="/" className="footer-brand-link">
              <Image
                src="/logo.png"
                alt="ARICT Logo"
                width={180}
                height={52}
                className="footer-brand-logo"
              />
            </Link>
            <p className="footer-text">
              Crafting digital experiences that move people forward.
            </p>
            <div className="footer-social">
              <a
                href="https://twitter.com"
                aria-label="Twitter"
                target="_blank"
                rel="noreferrer"
                className="social-twitter"
              >
                <Twitter size={18} aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com"
                aria-label="LinkedIn"
                target="_blank"
                rel="noreferrer"
                className="social-linkedin"
              >
                <Linkedin size={18} aria-hidden="true" />
              </a>
              <a
                href="https://github.com"
                aria-label="GitHub"
                target="_blank"
                rel="noreferrer"
                className="social-github"
              >
                <Github size={18} aria-hidden="true" />
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
                className="social-instagram"
              >
                <Instagram size={18} aria-hidden="true" />
              </a>
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
            © 2024 Association of Rajarata Information &amp; Communication
            Technology. All rights reserved.
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
