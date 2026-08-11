'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, MessagesSquare, Play } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  const scrollToSection = (id: string) => {
    if (pathname === '/') {
      const section = document.getElementById(id);
      if (section) {
        const top = section.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <footer className="bg-white pt-15 md:pt-16 pb-32 md:pb-16 px-6 md:px-12 border-t border-white/5 relative z-10 text-left">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">

        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center font-extrabold font-display text-lg text-gray-700">TG</div>
            <div className="leading-none text-left">
              <span className="font-display font-extrabold text-base block tracking-tighter uppercase text-gray-700">Tosei Gusoku</span>
              <span className="text-[9px] block text-zinc-500 uppercase tracking-widest font-bold">Dojo Shito Ryu</span>
            </div>
          </div>
          <p className="text-xs text-gray-700/50 leading-relaxed font-sans max-w-sm">
            Escuela de Karate de primer nivel enfocada en el desarrollo integral humano de niños, jóvenes y adultos. Representantes de Inoue Ha Shito-Ryu Keishin Kai.
          </p>
          <div className="flex gap-3 pt-2">
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700/70 hover:bg-brand-accent hover:text-black transition-colors">
              <Camera className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700/70 hover:bg-brand-accent hover:text-black transition-colors">
              <MessagesSquare className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700/70 hover:bg-brand-accent hover:text-black transition-colors">
              <Play className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="md:col-span-3 space-y-3">
          <h5 className="font-bold text-xs uppercase tracking-widest text-brand-accent font-display">Secciones</h5>
          <ul className="space-y-2 text-xs font-semibold text-gray-700/60">
            <li><Link href="/" className="hover:text-brand-accent cursor-pointer">Inicio (Dojo Home)</Link></li>
            <li><Link href="/nosotros" className="hover:text-brand-accent cursor-pointer">Sobre Nosotros</Link></li>
            <li><button onClick={() => scrollToSection('horarios')} className="hover:text-brand-accent cursor-pointer">Horarios de Práctica</button></li>
            <li><button onClick={() => scrollToSection('contacto')} className="hover:text-brand-accent cursor-pointer">Sucursal Bella Vista</button></li>
            <li><Link href="/inscripcion" className="hover:text-brand-accent cursor-pointer">Formulario de Inscripción</Link></li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-3">
          <h5 className="font-bold text-xs uppercase tracking-widest text-brand-accent font-display">Organización</h5>
          <div className="text-xs text-gray-700/60 space-y-1">
            <p>• Shito Ryu Inoue Ha branch</p>
            <p>• Keishin Kai International</p>
            <p>• Reconocidos por FEDOKARATE</p>
            <p>• Miembro WKF Olímpico</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <h5 className="font-bold text-xs uppercase tracking-widest text-brand-accent font-display">Soporte</h5>
          <div className="text-xs text-gray-700/60 space-y-1.5">
            <a href="#" className="hover:text-brand-accent block">Términos Legales</a>
            <a href="#" className="hover:text-brand-accent block">Privacidad de Datos</a>
            <p className="pt-2 text-[10px] text-gray-700/40">© {new Date().getFullYear()} Escuela Tosei Gusoku. Modern Bushido Excellence.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
