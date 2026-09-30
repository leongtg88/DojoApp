'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ChevronDown, Copy, ExternalLink, Loader2, Send, Smile, Star } from 'lucide-react';
import { getGoogleWriteReviewUrl } from '@/lib/seo';

interface PublicReview {
  id: string;
  authorName: string;
  relationship: string | null;
  rating: number;
  message: string;
}

interface ApiReview {
  id: string;
  authorName: string;
  relationship: string | null;
  rating: number;
  message: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function StarRating({ value, className = 'w-4 h-4' }: { value: number; className?: string }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${n <= value ? 'text-brand-accent fill-brand-accent' : 'text-gray-400/50'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loadError, setLoadError] = useState(false);

  const [authorName, setAuthorName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { reviews?: ApiReview[]; unavailable?: boolean } | null) => {
        if (!active) return;
        if (data?.unavailable) setLoadError(true);
        if (data?.reviews?.length) {
          setReviews(
            data.reviews.map((r) => ({
              id: r.id,
              authorName: r.authorName,
              relationship: r.relationship,
              rating: r.rating,
              message: r.message,
            })),
          );
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const half = useMemo(() => {
    if (!reviews.length) return [];
    const minCards = 6;
    const repeat = Math.max(1, Math.ceil(minCards / reviews.length));
    return Array.from({ length: repeat }).flatMap(() => reviews);
  }, [reviews]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (authorName.trim().length < 2) {
      setSubmitError('Escribe tu nombre (mínimo 2 caracteres).');
      return;
    }
    if (message.trim().length < 10) {
      setSubmitError('Cuéntanos un poco más (mínimo 10 caracteres).');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: authorName.trim(),
          relationship: relationship.trim(),
          rating,
          message: message.trim(),
          email: email.trim(),
          website,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(data?.error ?? 'No pudimos enviar tu reseña. Inténtalo de nuevo.');
        return;
      }
      setSubmittedMessage(message.trim());
      setIsCopied(false);
      setIsSubmitted(true);
      setIsFormOpen(false);
      setAuthorName('');
      setRelationship('');
      setRating(5);
      setMessage('');
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyReview() {
    try {
      await navigator.clipboard.writeText(submittedMessage);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <section id="reviews" className="md:py-20 px-8 pb-4 md:px-[50px] border-t border-white/5 scroll-mt-24">
      <div className="max-w-7xl mx-auto md:space-y-12">
        <div className="text-left space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-secondary/10 text-brand-secondary px-3 py-1 rounded-full text-xs font-bold font-display uppercase tracking-wider">
            <Smile className="w-3.5 h-3.5" /> Voces de Familia
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-gray-700">Testimonios Reales</h2>
          <p className="text-sm text-left sm:text-base text-gray-700/60 max-w-2xl">
            Padres, madres y alumnos comparten su experiencia en Tosei Gusoku. ¿Entrenas con nosotros? Déjanos tu mensaje.
          </p>
        </div>

        {reviews.length > 0 && (
        <div className="relative w-full overflow-hidden pt-4">
          <div className="flex w-max gap-6 animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-6 shrink-0" aria-hidden={copy === 1}>
                {half.map((test, i) => (
                  <article
                    key={`${copy}-${test.id}-${i}`}
                    className="w-[18rem] sm:w-[22rem] lg:w-[24rem] shrink-0 p-6 md:p-8 rounded-2xl border border-white/5 space-y-6 flex flex-col justify-between text-left relative overflow-hidden"
                  >
                    <span className="absolute top-6 right-6 font-serif text-gray-700/5 text-8xl pointer-events-none select-none">
                      &ldquo;
                    </span>
                    <div className="space-y-4">
                      <StarRating value={test.rating} />
                      <p className="text-sm sm:text-base text-gray-700/80 italic leading-relaxed font-sans">
                        &ldquo;{test.message}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-brand-accent/60 shrink-0 flex items-center justify-center">
                        <span className="font-display font-bold text-sm text-brand-accent">
                          {getInitials(test.authorName)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-700 font-display uppercase tracking-wide">
                          {test.authorName}
                        </h4>
                        {test.relationship && (
                          <p className="text-xs text-brand-accent font-semibold">{test.relationship}</p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>

          {/* Difuminado lateral */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-white via-white/70 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />
        </div>
        )}

        {reviews.length === 0 && !loadError && (
          <p className="pt-2 text-center text-sm text-gray-700/60">
            Sé el primero en dejar tu reseña.
          </p>
        )}

        {loadError && reviews.length === 0 && (
          <p className="pt-2 text-center text-xs text-gray-700/50">
            No pudimos cargar las reseñas en este momento. Recarga la página para intentarlo de nuevo.
          </p>
        )}

        {/* Formulario de reseña */}
        <div className="pt-6 w-full">
          <div className="w-full overflow-hidden rounded-2xl border border-brand-accent/20 bg-white/60 shadow-lg backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setIsFormOpen((v) => !v)}
              aria-expanded={isFormOpen}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 md:px-8 text-left cursor-pointer"
            >
              <span className="space-y-1">
                <span className="block text-xl font-extrabold font-display text-gray-700">Deja tu reseña</span>
                <span className="block text-xs text-gray-700/60">
                  Comparte un mensaje positivo sobre tu experiencia en la escuela.
                </span>
              </span>
              <ChevronDown
                className={`w-5 h-5 shrink-0 text-brand-accent transition-transform ${isFormOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isFormOpen && (
              <div className="px-6 pb-6 md:px-8 md:pb-8">
                <form onSubmit={handleSubmit} className="w-full text-left space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                        <label className="space-y-1.5 text-xs font-semibold text-gray-700/80">
                          Nombre
                          <input
                            type="text"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            maxLength={80}
                            placeholder="Ej. María Pérez"
                            className="w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-accent"
                          />
                        </label>
                        <label className="space-y-1.5 text-xs font-semibold text-gray-700/80">
                          Relación (opcional)
                          <input
                            type="text"
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value)}
                            maxLength={80}
                            placeholder="Ej. Madre de Rodrigo (8 años)"
                            className="w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-accent"
                          />
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-gray-700/80">Valoración</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setRating(n)}
                              aria-label={`${n} estrellas`}
                              className="cursor-pointer"
                            >
                              <Star
                                className={`w-7 h-7 ${n <= rating ? 'text-brand-accent fill-brand-accent' : 'text-gray-300'}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="block space-y-1.5 text-xs font-semibold text-gray-700/80">
                        Email (opcional, no se publica)
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          maxLength={320}
                          placeholder="correo@ejemplo.com"
                          className="w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-accent"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col gap-4">
                      <label className="flex flex-1 flex-col space-y-1.5 text-xs font-semibold text-gray-700/80">
                        Mensaje
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={600}
                          placeholder="Cuéntanos qué ha significado el karate para tu familia..."
                          className="w-full flex-1 min-h-36 resize-none rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-accent"
                        />
                      </label>

                      {/* Honeypot anti-spam */}
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        className="hidden"
                      />

                      {submitError && (
                        <p className="rounded-xl bg-brand-red/10 px-3 py-2 text-xs font-medium text-brand-red">
                          {submitError}
                        </p>
                      )}

                      <div className="flex justify-end mt-auto">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="hero-button glass-card-hover disabled:opacity-60"
                        >
                          {isSubmitting ? (
                            <>
                              Enviando <Loader2 className="w-4 h-4 animate-spin" />
                            </>
                          ) : (
                            <>
                              Enviar reseña <Send className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isSubmitted && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSubmitted(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-thanks-title"
                aria-describedby="review-thanks-desc"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative z-10 w-full max-w-sm rounded-2xl border border-brand-accent/20 bg-white p-6 text-center shadow-2xl"
              >
                <img
                  src="/assets/LogoSolo.svg"
                  alt="Tosei Gusoku Dojo"
                  className="mx-auto h-16 w-16 drop-shadow-lg"
                />
                <h3 id="review-thanks-title" className="mt-4 font-display text-lg font-extrabold text-gray-800">
                  ¡Gracias por tu reseña!
                </h3>
                <p id="review-thanks-desc" className="mt-2 text-sm text-gray-600">
                  Estaremos revisándola y publicándola pronto. Tu opinión ayuda a más familias a conocer el dojo.
                </p>

                <div className="mt-5 space-y-3 border-t border-gray-200 pt-4 text-left">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">¿Nos ayudas en Google?</span> Publica la misma
                    reseña en nuestra ficha de Google Maps. Allí la ven muchas más familias.
                  </p>
                  <a
                    href={getGoogleWriteReviewUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-3 text-sm font-bold text-black transition hover:brightness-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                  >
                    Publicar en Google <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyReview}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-accent/40 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-brand-accent/10 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                  >
                    {isCopied ? (
                      <>
                        ¡Copiado! <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                      </>
                    ) : (
                      <>
                        Copiar mi reseña <Copy className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] leading-relaxed text-gray-500">
                    Copia tu reseña, abre Google con el botón de arriba e inicia sesión para pegarla.
                  </p>
                </div>

                <button
                  type="button"
                  autoFocus
                  onClick={() => setIsSubmitted(false)}
                  className="mt-5 w-full cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 transition hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                >
                  Entendido
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
