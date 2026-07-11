import React, { useState } from 'react';
import { MOCK_GALLERY } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Maximize2, Eye } from 'lucide-react';

export default function GalleryLightbox() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((activeIdx + 1) % MOCK_GALLERY.length);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((activeIdx - 1 + MOCK_GALLERY.length) % MOCK_GALLERY.length);
    }
  };

  const currentItem = activeIdx !== null ? MOCK_GALLERY[activeIdx] : null;

  return (
    <div className="space-y-6">
      {/* Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_GALLERY.map((item, idx) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -4 }}
            className="group relative h-64 overflow-hidden rounded-2xl bg-[#111723] border border-white/5 cursor-pointer shadow-md"
            onClick={() => setActiveIdx(idx)}
          >
            {/* Background Image */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Elegant overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

            {/* Content box info */}
            <div className="absolute inset-x-0 bottom-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-brand-accent flex items-center gap-1">
                <Eye className="w-3 h-3" /> Ver Imagen
              </span>
              <h4 className="font-bold text-base font-display text-gray-700">{item.title}</h4>
              <p className="text-xs text-gray-700/70 line-clamp-2">{item.description}</p>
            </div>

            {/* Maximize Icon Overlay */}
            <div className="absolute top-4 right-4 w-9 h-9 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/10 hover:bg-brand-accent hover:text-black">
              <Maximize2 className="w-4 h-4" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox full visualizer */}
      <AnimatePresence>
        {activeIdx !== null && currentItem && (
          <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4">
            {/* Backdrop slide click target */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveIdx(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            />

            {/* Top stats counter & controller */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10 text-gray-700/70">
              <p className="text-xs font-mono font-bold">
                GALERÍA TOSEI GUSOKU — {activeIdx + 1} / {MOCK_GALLERY.length}
              </p>
              <button
                onClick={() => setActiveIdx(null)}
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-[#ff4b62] hover:text-gray-700 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Centered Image display */}
            <div className="relative max-w-4xl w-full flex items-center justify-center max-h-[70vh] z-10">
              {/* Navigation Left */}
              <button
                onClick={handlePrev}
                className="absolute left-2 md:-left-16 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700 hover:bg-brand-accent hover:text-black transition-all cursor-pointer z-20 shadow-lg"
                aria-label="Anterior imagen"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Slider image component */}
              <motion.img
                key={currentItem.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                src={currentItem.imageUrl}
                alt={currentItem.title}
                className="max-h-[65vh] max-w-full rounded-xl object-contain border border-white/10 shadow-2xl"
                referrerPolicy="no-referrer"
              />

              {/* Navigation Right */}
              <button
                onClick={handleNext}
                className="absolute right-2 md:-right-16 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700 hover:bg-brand-accent hover:text-black transition-all cursor-pointer z-20 shadow-lg"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom descriptions */}
            <motion.div
              key={`caption-${currentItem.id}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center max-w-xl z-10 mt-6 space-y-1 px-4 text-gray-700"
            >
              <h3 className="font-bold text-lg font-display text-brand-accent">{currentItem.title}</h3>
              <p className="text-xs text-gray-700/70">{currentItem.description}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
