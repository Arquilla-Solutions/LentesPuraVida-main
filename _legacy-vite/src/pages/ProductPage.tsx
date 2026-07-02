import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Check,
  ChevronDown,
  Glasses,
  Lock,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import "../styles/catalogo.css";
import "../styles/november.css";
import logo from "@/assets/logo.png";
import { WHATSAPP_NUMBER } from "@/lib/contact";
import { findBySlug, getSwatch, type Product } from "@/data/products";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { SITE_URL } from "@/lib/seo";

const heroImg = (code: string) =>
  `https://img.ebdcdn.com/product/front/gray/${code}.jpg?q=88&im=Resize,width=1200,height=600,aspect=fill;UnsharpMask,sigma=1.0,gain=1.0`;
const thumbImg = (code: string) =>
  `https://img.ebdcdn.com/product/front/gray/${code}.jpg?q=70&im=Resize,width=320,height=160,aspect=fill`;

const buildWaLink = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

const buildFaqs = (p: Product): { q: string; a: string }[] => [
  {
    q: `¿El precio de $${p.framePrice} incluye los lentes graduados?`,
    a: `No. $${p.framePrice} es el precio del armazón ${p.name}. Los lentes graduados se cotizan según tu receta, materiales y tratamientos — para que pagués exactamente lo que necesitás, sin paquetes cerrados con costos extra. Mandanos tu fórmula por WhatsApp y te pasamos la cotización completa el mismo día.`,
  },
  {
    q: "¿Es seguro pagar online desde Costa Rica?",
    a: "Sí. Aceptamos SINPE Móvil, transferencia bancaria en colones y tarjeta. Confirmamos receta, color y monto antes de procesar cualquier pago, y todo queda registrado en tu chat de WhatsApp como respaldo. No procesamos cobros automáticos ni guardamos tus datos de tarjeta.",
  },
  {
    q: "¿Cuánto tarda en llegar a Costa Rica?",
    a: "Entre 10 y 14 días hábiles desde que confirmamos receta y pago. Te enviamos número de guía para que rastreés tu pedido en todo momento. Despacho directo desde el laboratorio en EE.UU.",
  },
  {
    q: "¿Cómo les envío mi receta?",
    a: "Por WhatsApp. Podés mandar foto del papel del oculista o escribir los valores. Si tenés dudas con la fórmula, te ayudamos a interpretarla paso a paso antes de fabricar.",
  },
  {
    q: "¿Sirven para fórmulas progresivas o bifocales?",
    a: "Sí. Trabajamos lentes monofocales, bifocales y progresivos. El precio del lente varía según el tipo y los tratamientos que elijas (antirreflejo, filtro azul, fotosensibles); te lo cotizamos antes de cobrar.",
  },
  {
    q: "¿Qué pasa si el armazón no me queda?",
    a: "Tenés garantía de fábrica: si llega con algún defecto de fabricación, lo reemplazamos sin costo. Por eso te ayudamos a confirmar la talla correcta antes de hacer el pedido — mandanos las medidas de unos lentes que ya te queden bien y te confirmamos.",
  },
];

const useReveal = () => {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window) || els.length === 0) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

const buildProductJsonLd = (
  p: Product,
  faqs: { q: string; a: string }[],
): Record<string, unknown>[] => {
  const url = `${SITE_URL}/lentes/${p.slug}`;
  const imgUrl = `https://img.ebdcdn.com/product/front/gray/${p.img}.jpg?q=88&im=Resize,width=1200,height=600,aspect=fill`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      name: `Armazón ${p.name} — Lentes Recetados`,
      description: `${p.desc} Material: ${p.material}. Forma: ${p.shape}. ${p.rim}. Colores disponibles: ${p.colors.join(", ")}.`,
      sku: p.slug,
      mpn: p.img,
      url,
      image: [imgUrl],
      brand: { "@type": "Brand", name: "Lentes Pura Vida" },
      category: "Eyewear / Prescription Glasses Frames",
      material: p.material,
      audience: p.kids
        ? { "@type": "PeopleAudience", suggestedMinAge: 5, suggestedMaxAge: 14 }
        : { "@type": "PeopleAudience", audienceType: p.gender },
      color: p.colors.join(", "),
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "USD",
        price: p.framePrice.toFixed(2),
        priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@id": `${SITE_URL}/#business` },
        areaServed: { "@type": "Country", "name": "Costa Rica" },
        eligibleRegion: { "@type": "Country", "name": "Costa Rica" },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "CR" },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 10, maxValue: 14, unitCode: "DAY" },
          },
        },
      },
      ...(p.rating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: p.rating.score.toFixed(2),
              reviewCount: p.rating.count,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Catálogo", item: `${SITE_URL}/#catalogo` },
        { "@type": "ListItem", position: 3, name: p.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
};

const NotFoundProduct = () => (
  <div className="nov-page">
    <SEO
      title="Modelo no encontrado | Lentes Pura Vida"
      description="Ese armazón no existe en nuestro catálogo. Volvé al catálogo para ver todos los lentes recetados disponibles con envío a Costa Rica."
      canonical="/"
      noIndex
    />
    <nav className="nov-nav" aria-label="Navegación">
      <Link to="/" className="nov-nav-back">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Volver al catálogo</span>
      </Link>
      <Link to="/" className="nov-nav-brand">
        <img src={logo} alt="" />
        <span className="nov-nav-wordmark">Lentes <em>Pura Vida</em></span>
      </Link>
      <a className="nov-nav-cta" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={15} aria-hidden="true" />
        <span>WhatsApp</span>
      </a>
    </nav>
    <section className="nov-section">
      <div className="nov-section-inner" style={{ textAlign: "center" }}>
        <span className="nov-section-eyebrow">Modelo no encontrado</span>
        <h2 className="nov-section-title">Ese armazón no existe en nuestro catálogo.</h2>
        <p className="nov-section-lead">Volvé al catálogo para ver todos los modelos disponibles.</p>
        <Link to="/" className="nov-cta-secondary" style={{ display: "inline-flex", maxWidth: 280 }}>
          Volver al catálogo
        </Link>
      </div>
    </section>
    <SiteFooter />
  </div>
);

const ProductPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const product = useMemo(() => findBySlug(slug), [slug]);

  const [activeColor, setActiveColor] = useState<string>(product?.colors[0] ?? "");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  useReveal();

  useEffect(() => {
    if (product) setActiveColor(product.colors[0] ?? "");
    window.scrollTo(0, 0);
  }, [product]);

  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setShowStickyCta(heroBottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!product) return <NotFoundProduct />;

  const savings = product.comparePrice - product.framePrice;
  const primarySize = product.sizes.find((s) => s.label === product.primarySize) ?? product.sizes[0];
  const sizesLabel = product.sizes.map((s) => s.label).join(" · ");
  const ratingDisplay = product.rating
    ? { score: product.rating.score.toFixed(product.rating.score % 1 === 0 ? 0 : 2), count: product.rating.count.toLocaleString("es-CR") }
    : null;
  const faqs = buildFaqs(product);

  const seoTitle = `Lentes ${product.name} — Armazón ${product.material} desde $${product.framePrice} | Lentes Pura Vida Costa Rica`;
  const seoDescription = `${product.desc} Armazón ${product.name} desde $${product.framePrice} con envío a toda Costa Rica. Lentes graduados cotizados según tu receta por WhatsApp. Hecho en EE.UU. por optómetras certificados.`;
  const seoImage = `https://img.ebdcdn.com/product/front/gray/${product.img}.jpg?q=88&im=Resize,width=1200,height=630,aspect=fill`;
  const productJsonLd = buildProductJsonLd(product, faqs);

  const waOrder = buildWaLink(
    `Hola 👋 Quiero cotizar el modelo *${product.name}* en color "${activeColor}". Adjunto mi receta para que me pasen el precio total.`,
  );
  const waRx = buildWaLink(
    `Hola 👋 Quiero enviarles mi receta para cotizar el modelo *${product.name}*.`,
  );

  return (
    <div className="nov-page">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={`/lentes/${product.slug}`}
        image={seoImage}
        imageAlt={`Lentes recetados ${product.name} — ${product.alt}`}
        ogType="product"
        keywords={`lentes ${product.name}, armazón ${product.name}, lentes ${product.material.toLowerCase()} ${product.shape.toLowerCase()}, lentes recetados Costa Rica, anteojos graduados Costa Rica`}
        jsonLd={productJsonLd}
      />
      {/* SLIM NAV */}
      <nav className="nov-nav" aria-label="Navegación">
        <Link to="/" className="nov-nav-back" aria-label="Volver al catálogo">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Volver al catálogo</span>
        </Link>
        <Link to="/" className="nov-nav-brand" aria-label="Lentes Pura Vida — inicio">
          <img src={logo} alt="" />
          <span className="nov-nav-wordmark">Lentes <em>Pura Vida</em></span>
        </Link>
        <a className="nov-nav-cta" href={waOrder} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={15} aria-hidden="true" />
          <span>WhatsApp</span>
        </a>
      </nav>

      {/* HERO */}
      <section className="nov-hero" ref={heroRef}>
        <div className="nov-hero-grid">
          {/* GALLERY */}
          <div className="nov-gallery" data-reveal>
            <div className="nov-gallery-main">
              <span className="nov-badge-premium">
                <span className="nov-badge-dot" /> Hecho en EE.UU.
              </span>
              <img src={heroImg(product.img)} alt={product.alt} loading="eager" />
              <div className="nov-gallery-glow" aria-hidden="true" />
            </div>
            <div className="nov-thumbs" role="list">
              {[0, 1, 2].map((i) => (
                <button key={i} className={`nov-thumb ${i === 0 ? "is-active" : ""}`} role="listitem" aria-label={`Vista ${i + 1}`}>
                  <img src={thumbImg(product.img)} alt="" />
                </button>
              ))}
            </div>
          </div>

          {/* INFO */}
          <div className="nov-info" data-reveal>
            <div className="nov-eyebrow">
              <span className="nov-eyebrow-tag">Catálogo · {product.gender}</span>
              {ratingDisplay && (
                <span className="nov-eyebrow-stars" aria-label={`${ratingDisplay.score} de 5 estrellas`}>
                  {[0,1,2,3,4].map(i => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}
                  <em>{ratingDisplay.score} ({ratingDisplay.count} reseñas)</em>
                </span>
              )}
            </div>

            <h1 className="nov-title">{product.name}</h1>
            <p className="nov-subtitle">{product.desc}</p>

            <div className="nov-price-card">
              <div className="nov-price-row">
                <div className="nov-price-block">
                  <span className="nov-price">${product.framePrice}</span>
                  <span className="nov-price-currency">USD</span>
                </div>
                <span className="nov-price-tag">Solo armazón</span>
              </div>
              <p className="nov-price-note">
                Los <strong>lentes graduados se cotizan por WhatsApp</strong> según tu receta y tratamientos —
                pagás solo por lo que necesitás, sin paquetes cerrados.
              </p>
              <div className="nov-price-bad">
                <span className="nov-price-bad-label">Mismo armazón en óptica local:</span>
                <span className="nov-price-bad-value">${product.comparePrice}+</span>
                <span className="nov-price-bad-save">Ahorrás ${savings}</span>
              </div>
            </div>

            <ul className="nov-quick-bullets">
              <li><Check size={16} aria-hidden="true" /> {product.material} · forma {product.shape.toLowerCase()} · {product.rim.toLowerCase()}</li>
              <li><Check size={16} aria-hidden="true" /> {product.colors.length} color{product.colors.length === 1 ? "" : "es"} disponible{product.colors.length === 1 ? "" : "s"}</li>
              <li><Check size={16} aria-hidden="true" /> Talla{product.sizes.length > 1 ? "s" : ""} {sizesLabel} {primarySize ? `· ${primarySize.lens}-${primarySize.bridge}-${primarySize.temple} mm` : ""}</li>
              <li><Check size={16} aria-hidden="true" /> Garantía de fábrica contra defectos</li>
            </ul>

            <div className="nov-trust-card">
              <div className="nov-trust-card-icon" aria-hidden="true">
                <Award size={28} />
              </div>
              <div className="nov-trust-card-text">
                <strong>Fabricado en EE.UU. por optómetras certificados</strong>
                <span>Tu receta es procesada por profesionales con licencia, en un laboratorio óptico certificado en Estados Unidos.</span>
              </div>
            </div>

            <div className="nov-color-section">
              <div className="nov-color-header">
                <span className="nov-color-label">Color:</span>
                <span className="nov-color-active">{activeColor}</span>
              </div>
              <div className="nov-color-swatches" role="radiogroup" aria-label="Color del armazón">
                {product.colors.map((c) => {
                  const sw = getSwatch(c);
                  const isActive = c === activeColor;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      aria-label={c}
                      title={c}
                      className={`nov-swatch ${isActive ? "is-active" : ""}`}
                      onClick={() => setActiveColor(c)}
                      style={{
                        ["--sw-bg" as string]: sw.bg,
                        ["--sw-ring" as string]: sw.ring ?? "transparent",
                      }}
                    >
                      <span className="nov-swatch-fill" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="nov-cta-row">
              <a className="nov-cta-primary" href={waOrder} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} aria-hidden="true" />
                <span>Cotizar por WhatsApp</span>
              </a>
              <a className="nov-cta-secondary" href={waRx} target="_blank" rel="noopener noreferrer">
                Enviar mi receta
              </a>
            </div>

            <div className="nov-secure-pay">
              <div className="nov-secure-pay-head">
                <Lock size={14} aria-hidden="true" />
                <strong>Pago seguro</strong>
                <span className="nov-secure-pay-sep" aria-hidden="true">·</span>
                <span>Confirmamos antes de cobrar</span>
              </div>
              <div className="nov-secure-pay-methods">
                <span className="nov-pay-chip">SINPE Móvil</span>
                <span className="nov-pay-chip">Transferencia</span>
                <span className="nov-pay-chip">Tarjeta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INCLUDES */}
      <section className="nov-section nov-includes" data-reveal>
        <div className="nov-section-inner">
          <span className="nov-section-eyebrow">Sin sorpresas</span>
          <h2 className="nov-section-title">Lo que recibís con tu <em>armazón {product.name}</em></h2>
          <p className="nov-section-lead">
            Trabajamos sin paquetes cerrados. Pedís el armazón a precio fijo y los lentes se cotizan
            según tu receta — todo confirmado por WhatsApp antes de cobrar.
          </p>
          <div className="nov-includes-grid">
            <div className="nov-include-card">
              <span className="nov-include-icon" aria-hidden="true"><Glasses size={22} /></span>
              <h3>Armazón {product.name}</h3>
              <p>{product.material} en el color que elijas. {product.features.includes("Bisagras de resorte") ? "Bisagras de resorte y peso ligero." : "Construcción ligera y duradera."}</p>
            </div>
            <div className="nov-include-card">
              <span className="nov-include-icon" aria-hidden="true"><BadgeCheck size={22} /></span>
              <h3>Cotización transparente</h3>
              <p>Lentes graduados con tu receta exacta. Te pasamos el precio antes de fabricar.</p>
            </div>
            <div className="nov-include-card">
              <span className="nov-include-icon" aria-hidden="true"><Sparkles size={22} /></span>
              <h3>Tratamientos disponibles</h3>
              <p>Antirreflejo, filtro azul, fotosensibles y UV — vos elegís qué incluir.</p>
            </div>
            <div className="nov-include-card">
              <span className="nov-include-icon" aria-hidden="true"><Package size={22} /></span>
              <h3>Estuche + paño</h3>
              <p>Estuche rígido y paño de microfibra incluidos en el envío.</p>
            </div>
            <div className="nov-include-card">
              <span className="nov-include-icon" aria-hidden="true"><Truck size={22} /></span>
              <h3>Envío a Costa Rica</h3>
              <p>Despacho desde EE.UU. con guía rastreable. 10–14 días hábiles a tu casa.</p>
            </div>
            <div className="nov-include-card nov-include-card--accent">
              <span className="nov-include-icon" aria-hidden="true"><ShieldCheck size={22} /></span>
              <h3>Garantía de fábrica</h3>
              <p>Si llega con defecto de fabricación, lo reemplazamos sin costo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="nov-section nov-compare-section" data-reveal>
        <div className="nov-section-inner">
          <span className="nov-section-eyebrow">¿Por qué tan accesibles?</span>
          <h2 className="nov-section-title">Mismo lente. <em>La mitad del precio.</em></h2>
          <p className="nov-section-lead">
            Trabajamos directo con el laboratorio en EE.UU. — sin alquileres de óptica, sin marca de lujo,
            sin intermediarios. Vos pagás el lente, no el local en San José.
          </p>
          <div className="nov-compare-grid">
            <div className="nov-compare-card nov-compare-card--us">
              <div className="nov-compare-header">
                <span className="nov-compare-tag">Lentes Pura Vida</span>
                <span className="nov-compare-price">${product.framePrice}</span>
              </div>
              <span className="nov-compare-subtag">Armazón · lentes cotizados aparte</span>
              <ul>
                <li><Check size={16} aria-hidden="true" /> Armazón premium a precio fijo</li>
                <li><Check size={16} aria-hidden="true" /> Lentes cotizados según tu fórmula</li>
                <li><Check size={16} aria-hidden="true" /> Sin tratamientos cobrados a la fuerza</li>
                <li><Check size={16} aria-hidden="true" /> Pago en colones por SINPE / transferencia</li>
                <li><Check size={16} aria-hidden="true" /> Atención personal por WhatsApp</li>
                <li><Check size={16} aria-hidden="true" /> Envío rastreable a tu casa</li>
              </ul>
            </div>
            <div className="nov-vs" aria-hidden="true">VS</div>
            <div className="nov-compare-card nov-compare-card--them">
              <div className="nov-compare-header">
                <span className="nov-compare-tag">Óptica local promedio</span>
                <span className="nov-compare-price nov-compare-price--bad">${product.comparePrice}+</span>
              </div>
              <span className="nov-compare-subtag">Paquete cerrado · todo incluido a precio fijo</span>
              <ul>
                <li><Minus size={16} aria-hidden="true" /> Armazón cobrado al precio del local</li>
                <li><Minus size={16} aria-hidden="true" /> Tratamientos cobrados aparte al final</li>
                <li><Minus size={16} aria-hidden="true" /> Espera de 2–3 semanas en consultorio</li>
                <li><Minus size={16} aria-hidden="true" /> Costos de alquiler incluidos en el precio</li>
                <li><Minus size={16} aria-hidden="true" /> Atención solo en horario comercial</li>
                <li><Minus size={16} aria-hidden="true" /> Sin tracking del pedido</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SPECS */}
      <section className="nov-section nov-specs-section" data-reveal>
        <div className="nov-section-inner nov-specs-inner">
          <div className="nov-specs-text">
            <span className="nov-section-eyebrow">Ficha técnica</span>
            <h2 className="nov-section-title">Diseñado para <em>uso diario</em></h2>
            <p>
              {product.features.length > 0
                ? `Características destacadas: ${product.features.join(", ").toLowerCase()}.`
                : `Construcción ${product.material.toLowerCase()} de calidad para uso prolongado.`}
              {product.kids && " Apto para niños y juniors."}
            </p>
          </div>
          <dl className="nov-specs-table">
            <div><dt>Material</dt><dd>{product.material}</dd></div>
            <div><dt>Forma</dt><dd>{product.shape}</dd></div>
            <div><dt>Aro</dt><dd>{product.rim}</dd></div>
            <div><dt>Talla{product.sizes.length > 1 ? "s" : ""}</dt><dd>{sizesLabel}</dd></div>
            {primarySize && <div><dt>Lente</dt><dd>{primarySize.lens} mm</dd></div>}
            {primarySize && <div><dt>Puente</dt><dd>{primarySize.bridge} mm</dd></div>}
            {primarySize && <div><dt>Patilla</dt><dd>{primarySize.temple} mm</dd></div>}
            {product.weight !== null && <div><dt>Peso</dt><dd>~{product.weight} g</dd></div>}
            <div><dt>Compatible con</dt><dd>Mono · Bi · Progresivo · Filtro azul</dd></div>
          </dl>
        </div>
      </section>

      {/* SIZE GUIDE */}
      <section className="nov-section nov-size-section" data-reveal>
        <div className="nov-section-inner">
          <span className="nov-section-eyebrow">¿Te quedará bien?</span>
          <h2 className="nov-section-title">Cómo elegir <em>tu talla</em> en 30 segundos</h2>
          <ol className="nov-size-steps">
            <li>
              <span className="nov-size-num">1</span>
              <h3>Buscá unos lentes que ya te quedan bien</h3>
              <p>Mirá por dentro de la patilla — vienen 3 números separados por guiones.</p>
            </li>
            <li>
              <span className="nov-size-num">2</span>
              <h3>Comparalos con {product.name}</h3>
              <p>{primarySize ? `Lente ${primarySize.lens} · Puente ${primarySize.bridge} · Patilla ${primarySize.temple}.` : "Mirá las medidas en la ficha técnica."} Si tus lentes están dentro de ±2 mm, te quedan.</p>
            </li>
            <li>
              <span className="nov-size-num">3</span>
              <h3>¿Dudas? Mandanos foto</h3>
              <p>Por WhatsApp te confirmamos si la talla {product.primarySize} es la correcta para tu rostro.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="nov-section nov-reviews-section" data-reveal>
        <div className="nov-section-inner">
          <span className="nov-section-eyebrow">Clientes reales</span>
          <h2 className="nov-section-title">Lo que dicen sobre <em>{product.name}</em></h2>
          <div className="nov-reviews-grid">
            <article className="nov-review">
              <div className="nov-review-stars" aria-label="5 de 5 estrellas">
                {[0,1,2,3,4].map(i => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}
              </div>
              <p>"Llevaba años usando carey. Estos {product.name} me llegaron en menos de dos semanas y la calidad del acetato es mejor que los que tenía de óptica."</p>
              <footer>
                <ShieldCheck size={12} aria-hidden="true" />
                <strong>Andrés C.</strong> · Cliente verificado · San José
              </footer>
            </article>
            <article className="nov-review">
              <div className="nov-review-stars" aria-label="5 de 5 estrellas">
                {[0,1,2,3,4].map(i => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}
              </div>
              <p>"Los pedí y se ven elegantes pero discretos. Perfectos para la oficina. La atención por WhatsApp impecable, me cotizaron los lentes el mismo día."</p>
              <footer>
                <ShieldCheck size={12} aria-hidden="true" />
                <strong>María F.</strong> · Cliente verificado · Heredia
              </footer>
            </article>
            <article className="nov-review">
              <div className="nov-review-stars" aria-label="5 de 5 estrellas">
                {[0,1,2,3,4].map(i => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}
              </div>
              <p>"Me daba miedo comprar lentes en línea pero me guiaron paso a paso. Pagué por SINPE, llegaron con la fórmula exacta y sin un solo detalle mal."</p>
              <footer>
                <ShieldCheck size={12} aria-hidden="true" />
                <strong>Jorge V.</strong> · Cliente verificado · Cartago
              </footer>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="nov-section nov-faq-section" data-reveal>
        <div className="nov-section-inner nov-faq-inner">
          <div>
            <span className="nov-section-eyebrow">Preguntas frecuentes</span>
            <h2 className="nov-section-title">Antes de pedir, <em>resolvamos dudas</em></h2>
            <p className="nov-faq-help">
              ¿No ves tu pregunta? Escribinos por <a href={waRx} target="_blank" rel="noopener noreferrer">WhatsApp</a> y te respondemos en minutos.
            </p>
          </div>
          <div className="nov-faq-list">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className={`nov-faq-item ${open ? "is-open" : ""}`}>
                  <button
                    type="button"
                    className="nov-faq-q"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span>{f.q}</span>
                    <ChevronDown className="nov-faq-icon" size={20} aria-hidden="true" />
                  </button>
                  <div className="nov-faq-a" hidden={!open}>
                    <p>{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="nov-trust-strip" data-reveal>
        <div className="nov-trust-strip-inner">
          <div className="nov-trust-cell">
            <Award size={26} aria-hidden="true" />
            <div><strong>Optómetras certificados</strong><span>Lic. profesional en EE.UU.</span></div>
          </div>
          <div className="nov-trust-cell">
            <Lock size={26} aria-hidden="true" />
            <div><strong>Pago seguro</strong><span>SINPE · Transferencia · Tarjeta</span></div>
          </div>
          <div className="nov-trust-cell">
            <MapPin size={26} aria-hidden="true" />
            <div><strong>Envío a todo CR</strong><span>Guía rastreable</span></div>
          </div>
          <div className="nov-trust-cell">
            <ShieldCheck size={26} aria-hidden="true" />
            <div><strong>Garantía de fábrica</strong><span>Reemplazo sin costo</span></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="nov-final" data-reveal>
        <div className="nov-final-inner">
          <h2>Cotizá tu <em>{product.name}</em> en minutos</h2>
          <p>Mandanos tu receta por WhatsApp y te pasamos el precio total con tus lentes incluidos — sin compromiso, sin costos sorpresa.</p>
          <div className="nov-cta-row nov-cta-row--center">
            <a className="nov-cta-primary" href={waOrder} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} aria-hidden="true" />
              <span>Cotizar por WhatsApp · armazón ${product.framePrice}</span>
            </a>
            <Link className="nov-cta-secondary nov-cta-secondary--light" to="/">
              Ver más modelos
            </Link>
          </div>
          <div className="nov-final-trust">
            <Lock size={14} aria-hidden="true" />
            <span>Pago seguro · sin cobros automáticos · respaldo en tu chat de WhatsApp</span>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* STICKY MOBILE CTA */}
      <div className={`nov-sticky-cta ${showStickyCta ? "is-visible" : ""}`} aria-hidden={!showStickyCta}>
        <div className="nov-sticky-info">
          <span className="nov-sticky-name">{product.name} · armazón</span>
          <span className="nov-sticky-price">${product.framePrice}</span>
        </div>
        <a className="nov-cta-primary nov-cta-primary--small" href={waOrder} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={14} aria-hidden="true" />
          <span>Cotizar</span>
        </a>
      </div>
    </div>
  );
};

export default ProductPage;
