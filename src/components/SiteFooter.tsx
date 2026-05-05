import { Link } from "react-router-dom";
import {
  Award,
  Clock,
  Globe,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { WHATSAPP_LINK } from "@/lib/contact";

const SiteFooter = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer" aria-label="Pie de página">
      <div className="site-footer-inner">
        {/* Brand block */}
        <div className="site-footer-brand">
          <Link to="/" className="site-footer-logo" aria-label="Lentes Pura Vida — inicio">
            <img src={logo} alt="" />
            <span>
              Lentes <em>Pura Vida</em>
            </span>
          </Link>
          <p className="site-footer-tag">
            Lentes recetados premium fabricados en Estados Unidos por optómetras certificados.
            Cotización transparente y envío a toda Costa Rica.
          </p>
          <div className="site-footer-cr">
            <span className="site-footer-cr-flag" aria-hidden="true">🇨🇷</span>
            <span>Hecho con cariño para Costa Rica</span>
          </div>
        </div>

        {/* Catálogo */}
        <div className="site-footer-col">
          <h4>Catálogo</h4>
          <ul>
            <li><Link to="/#catalogo">Hombres</Link></li>
            <li><Link to="/#catalogo">Mujeres</Link></li>
            <li><Link to="/#catalogo">Niños</Link></li>
            <li><Link to="/#catalogo">Unisex</Link></li>
            <li><Link to="/sobre-nosotros">Sobre nosotros</Link></li>
            <li><Link to="/#top">Cómo funciona</Link></li>
          </ul>
        </div>

        {/* Atención */}
        <div className="site-footer-col">
          <h4>Atención al cliente</h4>
          <ul>
            <li>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={14} aria-hidden="true" /> WhatsApp
              </a>
            </li>
            <li>
              <Clock size={14} aria-hidden="true" />
              Respondemos en minutos
            </li>
            <li>
              <Globe size={14} aria-hidden="true" />
              Tienda 100% online
            </li>
            <li>
              <MapPin size={14} aria-hidden="true" />
              Envío a todo CR
            </li>
          </ul>
        </div>

        {/* Pago + Trust */}
        <div className="site-footer-col">
          <h4>Pago seguro</h4>
          <div className="site-footer-pay">
            <span>SINPE Móvil</span>
            <span>Transferencia</span>
            <span>Tarjeta</span>
          </div>
          <h4 className="site-footer-h4--mt">Garantías</h4>
          <ul className="site-footer-trust">
            <li>
              <Award size={14} aria-hidden="true" />
              Optómetras certificados
            </li>
            <li>
              <Truck size={14} aria-hidden="true" />
              Envío rastreable
            </li>
            <li>
              <ShieldCheck size={14} aria-hidden="true" />
              Garantía de fábrica
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="site-footer-bottom">
        <span>© {year} Lentes Pura Vida</span>
        <span aria-hidden="true">·</span>
        <span>Catálogo oficial · Costa Rica</span>
        <span aria-hidden="true">·</span>
        <span>Precios y disponibilidad sujetos a cambio</span>
      </div>
    </footer>
  );
};

export default SiteFooter;
