import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BadgeCheck,
  Globe,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import "../styles/catalogo.css";
import { WHATSAPP_LINK } from "@/lib/contact";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SEO from "@/components/SEO";
import { SITE_URL } from "@/lib/seo";

const aboutJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Sobre nosotros — Lentes Pura Vida Costa Rica",
  description:
    "Conocé la misión de Lentes Pura Vida: lentes recetados premium hechos en EE.UU. por optómetras certificados, accesibles para cada familia tica.",
  url: `${SITE_URL}/sobre-nosotros`,
  inLanguage: "es-CR",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#business` },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Sobre nosotros", item: `${SITE_URL}/sobre-nosotros` },
    ],
  },
};

const AboutUs = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="catalogo-page about-page">
      <SEO
        title="Sobre Nosotros | Lentes Pura Vida — Lentes Recetados Costa Rica"
        description="Hacemos accesibles los lentes recetados premium en Costa Rica: armazones desde $30 fabricados en EE.UU. por optómetras certificados. Conocé nuestra misión y por qué confiar en nosotros."
        canonical="/sobre-nosotros"
        keywords="sobre Lentes Pura Vida, óptica online Costa Rica confiable, lentes recetados Costa Rica, misión Lentes Pura Vida"
        imageAlt="Sobre Lentes Pura Vida — lentes recetados accesibles para cada familia tica"
        jsonLd={aboutJsonLd}
      />
      <SiteHeader />

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <span className="about-eyebrow">
            <span className="about-eyebrow-dot" aria-hidden="true" />
            Nuestra misión
          </span>
          <h1 className="about-title">
            Lentes premium al alcance de <em>cada familia tica</em>.
          </h1>
          <p className="about-subtitle">
            Ver bien no debería ser un lujo. Tomamos la precisión y calidad de la fabricación
            óptica estadounidense y la traemos a Costa Rica a un precio justo — para que cada
            familia pueda acceder a algo tan esencial como ver el mundo con claridad.
          </p>
          <div className="about-hero-stats">
            <div>
              <strong>$30</strong>
              <span>desde por armazón</span>
            </div>
            <div className="about-stat-divider" aria-hidden="true" />
            <div>
              <strong>EE.UU.</strong>
              <span>laboratorio certificado</span>
            </div>
            <div className="about-stat-divider" aria-hidden="true" />
            <div>
              <strong>10–14</strong>
              <span>días a tu casa</span>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="about-section about-section--cream">
        <div className="about-section-inner">
          <span className="about-section-eyebrow">El problema</span>
          <h2 className="about-section-title">
            En Costa Rica, ver bien sale <em>demasiado caro</em>.
          </h2>
          <p className="about-section-body">
            Un par de lentes recetados en una óptica local cuesta entre <strong>$110 y $250+</strong> —
            más que el aguinaldo de muchas familias. La diferencia no está en la calidad de los lentes;
            está en el alquiler del consultorio, en las marcas de moda, en los costos que vos terminás
            pagando.
          </p>
          <p className="about-section-body">
            Decidimos que esto tenía que cambiar.
          </p>
        </div>
      </section>

      {/* OUR SOLUTION */}
      <section className="about-section about-section--white">
        <div className="about-section-inner">
          <span className="about-section-eyebrow">Nuestra solución</span>
          <h2 className="about-section-title">
            Calidad estadounidense. <em>Precio costarricense.</em>
          </h2>
          <p className="about-section-body">
            Trabajamos directo con un laboratorio óptico certificado en Estados Unidos, donde
            optómetras con licencia profesional fabrican cada par de lentes con tu receta exacta.
            Sin intermediarios, sin marcas de lujo, sin paquetes cerrados con costos sorpresa.
          </p>
          <p className="about-section-body">
            <strong>Te pasamos la calidad — vos pagás solo lo que necesitás.</strong>
          </p>

          <div className="about-pillars">
            <article className="about-pillar">
              <span className="about-pillar-icon"><Globe size={24} /></span>
              <h3>Tienda 100% online</h3>
              <p>
                Operamos sin local físico. Eso elimina alquileres, vendedores comisionados y
                costos de oficina que se transfieren al cliente.
              </p>
            </article>
            <article className="about-pillar">
              <span className="about-pillar-icon"><BadgeCheck size={24} /></span>
              <h3>Cotización transparente</h3>
              <p>
                El armazón tiene precio fijo. Los lentes se cotizan según tu receta y los
                tratamientos que elijás — sin imponer extras que no necesitás.
              </p>
            </article>
            <article className="about-pillar">
              <span className="about-pillar-icon"><MessageCircle size={24} /></span>
              <h3>Atención directa</h3>
              <p>
                Un solo chat de WhatsApp donde resolvemos receta, color, talla, pago y envío.
                Sin formularios, sin esperas, sin intermediarios.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* WHAT MOVES US */}
      <section className="about-section about-section--accent">
        <div className="about-section-inner about-section-inner--narrow">
          <span className="about-pillar-icon about-pillar-icon--big" aria-hidden="true">
            <Heart size={32} />
          </span>
          <span className="about-section-eyebrow">Lo que nos mueve</span>
          <h2 className="about-section-title">
            Más que un negocio.
          </h2>
          <p className="about-section-body about-section-body--lg">
            Detrás de cada par de lentes hay una mamá que necesita ver el cuaderno de su hijo,
            un abuelo que vuelve a leer el periódico, una estudiante universitaria que al fin
            puede tomar apuntes sin entrecerrar los ojos.
          </p>
          <p className="about-section-body about-section-body--lg">
            Esa es la razón. Hacer accesible lo esencial, sin sacrificar la calidad.
          </p>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="about-trust-strip">
        <div className="about-trust-strip-inner">
          <div className="about-trust-cell">
            <Award size={26} aria-hidden="true" />
            <div><strong>Optómetras certificados</strong><span>Lic. profesional en EE.UU.</span></div>
          </div>
          <div className="about-trust-cell">
            <Lock size={26} aria-hidden="true" />
            <div><strong>Pago seguro</strong><span>SINPE · Transferencia · Tarjeta</span></div>
          </div>
          <div className="about-trust-cell">
            <MapPin size={26} aria-hidden="true" />
            <div><strong>Envío a todo CR</strong><span>Guía rastreable</span></div>
          </div>
          <div className="about-trust-cell">
            <ShieldCheck size={26} aria-hidden="true" />
            <div><strong>Garantía de fábrica</strong><span>Reemplazo sin costo</span></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="about-final">
        <div className="about-final-inner">
          <h2>¿Listo para encontrar <em>tus lentes</em>?</h2>
          <p>34 modelos · Precios desde $30 · Cotización transparente por WhatsApp</p>
          <div className="about-cta-row">
            <Link to="/#catalogo" className="about-cta-primary">
              Ver catálogo
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="about-cta-secondary"
            >
              <MessageCircle size={16} aria-hidden="true" />
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default AboutUs;
