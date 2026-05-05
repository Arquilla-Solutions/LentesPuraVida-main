import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Award,
  MessageCircle,
  Package,
  ShieldCheck,
  Truck,
  X,
  Menu,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { WHATSAPP_LINK } from "@/lib/contact";

interface MarqueeItem {
  icon: JSX.Element;
  text: string;
}

const MARQUEE_ITEMS: MarqueeItem[] = [
  { icon: <Truck size={14} aria-hidden="true" />, text: "Envío GRATIS en pedidos de $300 o más" },
  { icon: <Package size={14} aria-hidden="true" />, text: "Entrega de 10 a 14 días a toda Costa Rica" },
  { icon: <Award size={14} aria-hidden="true" />, text: "Hechos en EE.UU. por optómetras certificados" },
  { icon: <MessageCircle size={14} aria-hidden="true" />, text: "Cotización transparente por WhatsApp" },
  { icon: <ShieldCheck size={14} aria-hidden="true" />, text: "Garantía de fábrica incluida" },
];

const NAV_LINKS = [
  { href: "/", label: "Inicio", type: "route" as const },
  { href: "/#catalogo", label: "Catálogo", type: "anchor" as const },
  { href: "/#como-funciona", label: "Cómo funciona", type: "anchor" as const },
  { href: "/sobre-nosotros", label: "Nosotros", type: "route" as const },
  { href: "/#contacto", label: "Contacto", type: "anchor" as const },
];

const Marquee = () => (
  <div className="annc-marquee" aria-label="Información de envío y atención">
    <div className="annc-marquee-fade annc-marquee-fade--left" aria-hidden="true" />
    <div className="annc-marquee-fade annc-marquee-fade--right" aria-hidden="true" />
    <div className="annc-marquee-track">
      {[0, 1].map((loopKey) => (
        <div className="annc-marquee-loop" aria-hidden={loopKey === 1} key={loopKey}>
          {MARQUEE_ITEMS.map((item, idx) => (
            <span className="annc-marquee-item" key={`${loopKey}-${idx}`}>
              <span className="annc-marquee-icon">{item.icon}</span>
              <span>{item.text}</span>
              <span className="annc-marquee-dot" aria-hidden="true" />
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const SiteHeader = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  // Close on ESC
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const renderLink = (link: typeof NAV_LINKS[number], onClick?: () => void) => {
    const className = "topnav-link";
    if (link.type === "route") {
      return (
        <Link key={link.href} to={link.href} className={className} onClick={onClick}>
          {link.label}
        </Link>
      );
    }
    return (
      <a key={link.href} href={link.href} className={className} onClick={onClick}>
        {link.label}
      </a>
    );
  };

  return (
    <>
      <Marquee />

      <nav className="topnav" aria-label="Navegación principal">
        <Link to="/" className="topnav-brand" aria-label="Lentes Pura Vida — Inicio">
          <img src={logo} alt="" className="topnav-logo" width="34" height="34" />
          <span className="topnav-wordmark">Lentes <em>Pura Vida</em></span>
        </Link>

        {/* Desktop links */}
        <div className="topnav-actions topnav-actions--desktop">
          {NAV_LINKS.map((l) => renderLink(l))}
          <a
            className="topnav-link topnav-link-cta"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={14} aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="topnav-burger"
          aria-label="Abrir menú"
          aria-expanded={drawerOpen}
          aria-controls="site-drawer"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        id="site-drawer"
        className={`drawer ${drawerOpen ? "drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        aria-hidden={!drawerOpen}
      >
        <div
          className="drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
        <div className="drawer-panel">
          <div className="drawer-header">
            <Link
              to="/"
              className="topnav-brand"
              onClick={() => setDrawerOpen(false)}
            >
              <img src={logo} alt="" className="topnav-logo" width="34" height="34" />
              <span className="topnav-wordmark">Lentes <em>Pura Vida</em></span>
            </Link>
            <button
              type="button"
              className="drawer-close"
              aria-label="Cerrar menú"
              onClick={() => setDrawerOpen(false)}
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <ul className="drawer-links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                {renderLink(link, () => setDrawerOpen(false))}
              </li>
            ))}
          </ul>
          <a
            className="drawer-cta"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setDrawerOpen(false)}
          >
            <MessageCircle size={18} aria-hidden="true" />
            <span>Escribinos por WhatsApp</span>
          </a>
          <p className="drawer-foot">
            Atención directa · Cotización en minutos
          </p>
        </div>
      </div>
    </>
  );
};

export default SiteHeader;
