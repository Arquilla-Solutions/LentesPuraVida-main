import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  FileText,
  Glasses,
  Lock,
  MessageCircle,
  Package,
  Truck,
} from "lucide-react";
import "../styles/catalogo.css";
import logo from "@/assets/logo.png";
import { WHATSAPP_LINK } from "@/lib/contact";
import { PRODUCT_PAGES, products, type Product } from "@/data/products";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SEO from "@/components/SEO";
import { CR_PROVINCES, SITE_URL } from "@/lib/seo";

type Category = "unisex" | "hombres" | "mujeres" | "ninos";

interface Review {
  quote: string;
  name: string;
  meta: string;
}

const REVIEWS: Review[] = [
  {
    quote:
      "Compré los lentes de mi hijo para el regreso a clases y llegaron en tiempo récord. La calidad es buenísima y nos ahorramos casi la mitad. Volveré a pedir sin pensarlo.",
    name: "Carolina M.",
    meta: "Para su hijo · Heredia",
  },
  {
    quote:
      "Le regalé unos lentes a mi esposo para su cumpleaños y quedó encantado. La atención por WhatsApp fue clarísima y todo llegó perfecto a la casa.",
    name: "Andrea S.",
    meta: "Regalo de cumpleaños · San José",
  },
  {
    quote:
      "A mis 68 años pedí mis lentes en línea por primera vez. Me ayudaron paso a paso, son cómodos y livianos. Hasta mi nieto me dice que se me ven bonitos.",
    name: "Doña Marta R.",
    meta: "Para ella · Cartago",
  },
  {
    quote:
      "Llevaba meses queriendo cambiar los míos pero las ópticas estaban carísimas. Aquí pagué un tercio del precio y la calidad es igual o mejor. Recomendado 100%.",
    name: "Diego R.",
    meta: "Para él · Alajuela",
  },
  {
    quote:
      "Pedí los lentes de mi mamá y llegaron a su casa en San Carlos sin problema. Le encantaron y ahora todos en la familia queremos pedir los nuestros.",
    name: "Luis A.",
    meta: "Para su mamá · San Carlos",
  },
  {
    quote:
      "Buscaba un regalo bonito para mi hija que entró a la U y estos lentes fueron perfectos. Le encantó el modelo, se ven elegantes y le subieron la confianza. Volveremos.",
    name: "Patricia J.",
    meta: "Regalo para su hija · Escazú",
  },
  {
    quote:
      "Los lentes anteriores de mi niña se habían quebrado y la óptica nos cobraba un disparate. Aquí en menos de dos semanas tenía sus lentes nuevos y le quedaron lindísimos.",
    name: "Familia Vargas",
    meta: "Para su hija · Liberia",
  },
];

const ReviewCard = ({ review, ariaHidden }: { review: Review; ariaHidden?: boolean }) => (
  <article className="review-card" role="listitem" aria-hidden={ariaHidden || undefined}>
    <div className="review-stars" aria-label="5 de 5 estrellas">★★★★★</div>
    <p className="review-quote">"{review.quote}"</p>
    <div className="review-attr">
      <span className="review-name">{review.name}</span>
      <span className="review-meta">{review.meta}</span>
    </div>
  </article>
);

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "unisex", label: "Unisex" },
  { id: "hombres", label: "Hombres" },
  { id: "mujeres", label: "Mujeres" },
  { id: "ninos", label: "Niños" },
];

// Categorization rules (per product gender + kids flag from products.ts):
//  · Kids frames → ONLY in Niños
//  · Unisex (gender "Hombre / Mujer") → Unisex, Hombres, AND Mujeres
//  · Women-only (gender "Mujer") → ONLY Mujeres
const matchesCategory = (p: Product, cat: Category): boolean => {
  if (p.kids) return cat === "ninos";
  if (cat === "ninos") return false;
  if (cat === "unisex") return p.gender === "Hombre / Mujer";
  if (cat === "hombres") return p.gender === "Hombre / Mujer";
  if (cat === "mujeres") return p.gender === "Hombre / Mujer" || p.gender === "Mujer";
  return false;
};

const getImgUrl = (code: string) =>
  `https://img.ebdcdn.com/product/front/gray/${code}.jpg?q=70&im=Resize,width=600,height=300,aspect=fill;UnsharpMask,sigma=1.0,gain=1.0`;

const ProductCard = ({ product }: { product: Product }) => {
  const href = PRODUCT_PAGES[product.name];
  const isThirty = product.framePrice === 30;
  const cardClass = `card ${isThirty ? "card-pill-green" : "card-pill-gold"}${href ? " card-linked" : ""}`;
  const inner = (
    <>
    <div className="card-img-wrap">
      <img
        src={getImgUrl(product.img)}
        alt={`Lentes recetados ${product.name} — ${product.alt}`}
        loading="lazy"
        decoding="async"
        width="600"
        height="300"
      />
    </div>
    <div className="card-body">
      <div className="card-row-top">
        <div className="card-name">{product.name}</div>
        <span className={`price-pill ${isThirty ? "pill-green" : "pill-gold"}`}>
          ${product.framePrice}
        </span>
      </div>
      <p className="card-desc">{product.desc}</p>
      <div className="card-divider"></div>
      <div className="card-row-meta">
        <span className="chip-material">{product.material}</span>
        <span className="chip-size">{product.primarySize}</span>
      </div>
      <div className="colors-wrap">
        {product.colors.map((c) => (
          <span key={c} className="color-tag">{c}</span>
        ))}
      </div>
    </div>
    </>
  );
  if (href) {
    return (
      <Link to={href} className={cardClass} aria-label={`Ver ${product.name}`}>
        {inner}
      </Link>
    );
  }
  return <div className={cardClass}>{inner}</div>;
};

const HOME_FAQS: { q: string; a: string }[] = [
  {
    q: "¿Hacen envíos a todo Costa Rica?",
    a: `Sí. Enviamos a las 7 provincias: ${CR_PROVINCES.join(", ")}. Despachamos desde el laboratorio en EE.UU. con guía rastreable y tu pedido llega en 10–14 días hábiles a tu casa, oficina o sucursal de Correos de Costa Rica.`,
  },
  {
    q: "¿El precio del armazón incluye los lentes graduados?",
    a: "No. Los precios de $30 y $45 son solo del armazón. Los lentes graduados se cotizan según tu receta, materiales y tratamientos (antirreflejo, filtro azul, fotosensibles). Mandanos tu fórmula por WhatsApp y te pasamos la cotización completa el mismo día — sin paquetes cerrados.",
  },
  {
    q: "¿Cómo pago desde Costa Rica?",
    a: "Aceptamos SINPE Móvil, transferencia bancaria en colones y tarjeta de crédito. Confirmamos receta, color, talla y monto antes de procesar cualquier pago. No guardamos datos de tarjeta y todo queda registrado en tu chat de WhatsApp.",
  },
  {
    q: "¿Trabajan con fórmulas progresivas, bifocales o filtro azul?",
    a: "Sí. Trabajamos lentes monofocales, bifocales y progresivos, con tratamientos opcionales: antirreflejo, filtro azul para pantallas, fotosensibles (transitions) y protección UV. Te cotizamos cada combinación antes de fabricar.",
  },
  {
    q: "¿Quién fabrica los lentes?",
    a: "Un laboratorio óptico certificado en Estados Unidos, con optómetras de licencia profesional. Cada par se fabrica con tu receta exacta y pasa controles de calidad antes del envío.",
  },
  {
    q: "¿Qué pasa si los lentes llegan con un defecto?",
    a: "Tenés garantía de fábrica. Si el armazón o los lentes llegan con un defecto de fabricación, los reemplazamos sin costo. Te ayudamos a confirmar talla y receta antes de fabricar para minimizar errores.",
  },
];

const homeJsonLd = (): Record<string, unknown>[] => {
  const productItems = products.slice(0, 24).map((p, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${SITE_URL}${PRODUCT_PAGES[p.name] ?? `/lentes/${p.slug}`}`,
    name: `Lentes ${p.name}`,
  }));
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/#catalog`,
      name: "Catálogo de lentes recetados — Lentes Pura Vida Costa Rica",
      description:
        "Catálogo de armazones para lentes recetados con envío a toda Costa Rica. Hombres, mujeres, niños y unisex desde $30.",
      url: `${SITE_URL}/`,
      inLanguage: "es-CR",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#business` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: productItems,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOME_FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
};

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("unisex");
  const visibleProducts = products.filter((p) => matchesCategory(p, activeCategory));
  const activeLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "Unisex";

  return (
    <div className="catalogo-page">
      <SEO
        title="Lentes Pura Vida | Lentes Recetados y Anteojos Graduados en Costa Rica"
        description="Lentes recetados premium desde $30 con envío a toda Costa Rica (San José, Alajuela, Cartago, Heredia, Guanacaste, Puntarenas, Limón). Armazones hechos en EE.UU. por optómetras certificados. Hasta 60% más baratos que ópticas locales. Cotización transparente por WhatsApp."
        canonical="/"
        keywords="lentes recetados Costa Rica, anteojos graduados Costa Rica, armazones Costa Rica, monturas Costa Rica, óptica online Costa Rica, lentes baratos Costa Rica, lentes con receta, gafas graduadas, lentes para hombre, lentes para mujer, lentes para niños, lentes San José, lentes Alajuela, lentes Heredia, lentes Cartago"
        imageAlt="Lentes Pura Vida — lentes recetados premium con envío a toda Costa Rica"
        jsonLd={homeJsonLd()}
      />
      <SiteHeader />

      {/* HERO — simplified for mobile-first: tight copy, two CTAs, two trust pills */}
      <section className="hero" id="top">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <span className="hero-eyebrow-dot" aria-hidden="true" />
              Lentes recetados · Costa Rica 🇨🇷
            </span>
            <h1 className="hero-title">
              Lentes recetados <em>premium</em> al alcance de cada familia tica.
            </h1>
            <p className="hero-sub">
              Hechos en EE.UU. por optómetras certificados.
              Hasta un <strong>60% más baratos</strong> que las ópticas locales.
            </p>
            <div className="hero-ctas">
              <a
                className="btn-primary"
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={16} aria-hidden="true" />
                Cotizar por WhatsApp
              </a>
              <a className="btn-outline" href="#catalogo">Ver catálogo</a>
            </div>

            {/* Two compact trust pills — visible on every screen size */}
            <ul className="hero-pills">
              <li>
                <Award size={14} aria-hidden="true" />
                <span>Hechos en EE.UU.</span>
              </li>
              <li>
                <Truck size={14} aria-hidden="true" />
                <span>Envío gratis +$300</span>
              </li>
            </ul>
          </div>

          {/* Hero visual: hidden on mobile, visible on desktop only */}
          <div className="hero-visual">
            <div className="hero-logo-mark">
              <img
                src={logo}
                alt="Lentes Pura Vida"
                loading="eager"
                fetchPriority="high"
                width="320"
                height="320"
              />
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <div className="value-strip">
        <div className="value-prop">
          <span className="vp-icon"><Award size={22} /></span>
          <span className="vp-title">Lentes hechos en EE.UU.</span>
          <span className="vp-sub">Por optómetras con licencia</span>
        </div>
        <div className="value-prop">
          <span className="vp-icon vp-icon--green"><Lock size={22} /></span>
          <span className="vp-title">Pago seguro</span>
          <span className="vp-sub">SINPE · Transferencia · Tarjeta</span>
        </div>
        <div className="value-prop">
          <span className="vp-icon"><Truck size={22} /></span>
          <span className="vp-title">Envío a todo CR</span>
          <span className="vp-sub">Gratis en pedidos +$300</span>
        </div>
      </div>

      {/* TRUST BANNER */}
      <section className="trust-banner" aria-label="Información de confianza">
        <p>
          Lentes recetados fabricados en <strong>Estados Unidos</strong> por <strong>optómetras certificados</strong>.
          Anteojos graduados con envío a toda Costa Rica, hasta un <strong>60% más baratos</strong> que las ópticas locales.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="como-funciona" aria-label="Cómo funciona">
        <div className="how-inner">
          <span className="how-eyebrow">Sencillo y transparente</span>
          <h2 className="how-title">Cómo <em>funciona</em></h2>
          <ol className="how-steps">
            <li className="how-step">
              <span className="how-step-num">1</span>
              <span className="how-step-icon" aria-hidden="true"><Glasses size={22} /></span>
              <h3 className="how-step-title">Elegí tu modelo</h3>
              <p className="how-step-desc">Explorá nuestro catálogo y encontrá los lentes que más te gusten.</p>
            </li>
            <li className="how-step">
              <span className="how-step-num">2</span>
              <span className="how-step-icon" aria-hidden="true"><FileText size={22} /></span>
              <h3 className="how-step-title">Envianos tu receta</h3>
              <p className="how-step-desc">Compartí tu receta por WhatsApp. Te confirmamos cada detalle antes de fabricar.</p>
            </li>
            <li className="how-step">
              <span className="how-step-num">3</span>
              <span className="how-step-icon" aria-hidden="true"><Package size={22} /></span>
              <h3 className="how-step-title">Recibí en casa</h3>
              <p className="how-step-desc">Tus lentes llegan a tu puerta en toda Costa Rica, listos para usar.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* REVIEWS — placeholder reviews; replace with real customer reviews as they come in */}
      <section className="reviews" aria-label="Reseñas de clientes">
        <div className="reviews-header">
          <span className="reviews-eyebrow">Lo que dicen nuestros clientes</span>
          <h2 className="reviews-title">Familias que ya <em>confían</em> en nosotros</h2>
        </div>
        <div className="reviews-marquee">
          <div className="reviews-track" role="list">
            {REVIEWS.map((r, i) => (
              <ReviewCard key={`a-${i}`} review={r} />
            ))}
            {REVIEWS.map((r, i) => (
              <ReviewCard key={`b-${i}`} review={r} ariaHidden />
            ))}
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <span id="catalogo"></span>
      <main>
        {/* INFO ROW */}
        <div className="info-row">
          <div className="info-cell">
            <span className="info-icon" aria-hidden="true">$</span>
            <div className="info-text">
              <strong>Cotización transparente</strong>
              <span>Pagás el armazón a precio fijo. Lentes graduados se cotizan según tu receta — sin paquetes cerrados.</span>
            </div>
          </div>
          <div className="info-cell info-cell--accent">
            <span className="info-icon" aria-hidden="true">%</span>
            <div className="info-text">
              <strong>Hasta $10 de descuento</strong>
              <span>¿Fuiste al oculista? Envíanos tu recibo por WhatsApp y lo aplicamos.</span>
            </div>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="cat-bar">
          <div className="cat-tabs" role="tablist" aria-label="Categorías">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`cat-tab ${activeCategory === cat.id ? "is-active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION HEADER */}
        <header className="cat-section-header">
          <h2>
            Lentes <span className="cat-section-cat">{activeLabel}</span>
          </h2>
          <span className="cat-section-count">
            {visibleProducts.length} {visibleProducts.length === 1 ? "modelo" : "modelos"}
          </span>
        </header>

        {visibleProducts.length > 0 ? (
          <div className="grid">
            {visibleProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        ) : (
          <p className="empty-cat">Pronto agregaremos lentes en esta categoría.</p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
