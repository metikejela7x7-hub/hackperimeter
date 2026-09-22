"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { APPLY_URL, NAV_LINKS } from "@/data/event";
import { Button } from "@/components/Button/Button";
import styles from "./Navbar.module.css";

const DESKTOP_QUERY = "(min-width: 56rem)";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Solid bar once the page has scrolled, plus how far through the page we are.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Menu behaviour while open: scroll lock, Escape, focus trap, auto-close on desktop.
  useEffect(() => {
    if (!open) return;

    document.body.classList.add("scroll-locked");
    navRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close(true);
        return;
      }
      if (event.key !== "Tab" || !headerRef.current) return;

      const focusable = Array.from(
        headerRef.current.querySelectorAll<HTMLElement>("a[href], button"),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const media = window.matchMedia(DESKTOP_QUERY);
    const onMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };

    document.addEventListener("keydown", onKeyDown);
    media.addEventListener("change", onMediaChange);
    return () => {
      document.body.classList.remove("scroll-locked");
      document.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", onMediaChange);
    };
  }, [open, close]);

  return (
    <header
      ref={headerRef}
      className={styles.header}
      data-solid={scrolled || open}
      data-nav-open={open}
    >
      <span
        className={styles.progress}
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
      <div className={styles.inner}>
        <a className={styles.brand} href="#top" onClick={() => close()}>
          <svg
            className={styles.mark}
            viewBox="0 0 32 32"
            width="28"
            height="28"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <ellipse
              cx="16"
              cy="16"
              rx="13"
              ry="5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
              transform="rotate(-28 16 16)"
            />
            <circle cx="26.2" cy="10.4" r="2.4" fill="var(--amber)" />
          </svg>
          <span className={styles.wordmark}>
            Hack<span>Perimeter</span>
          </span>
        </a>

        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.bars} aria-hidden="true" />
        </button>

        <nav
          id="site-nav"
          ref={navRef}
          className={styles.nav}
          aria-label="Primary"
          data-open={open}
        >
          <ul className={styles.links}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a className={styles.link} href={link.href} onClick={() => close()}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className={styles.cta}>
            <Button href={APPLY_URL} onClick={() => close()}>
              Apply to survive
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
