'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
const logoSolo = '/assets/LogoSolo.svg';

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
            <img src={logoSolo} alt="Tosei Gusoku Dojo Logo" className="w-12 h-12 object-contain" />
            <div className="leading-none text-left">
              <span className="font-display font-extrabold text-base block tracking-tighter uppercase text-gray-700">Tosei Gusoku</span>
              <span className="text-[9px] block text-zinc-500 uppercase tracking-widest font-bold">Dojo Shito Ryu</span>
            </div>
          </div>
          <p className="text-xs text-gray-700/50 leading-relaxed font-sans max-w-sm">
            Escuela de Karate de primer nivel enfocada en el desarrollo integral humano de niños, jóvenes y adultos. Representantes de Inoue Ha Shito-Ryu Keishin Kai.
          </p>
          <div className="flex gap-3 pt-2">
            <a href="https://www.youtube.com/@ToseiGusokuDojo" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700/70 hover:bg-brand-accent hover:text-black transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
            <a href="https://www.instagram.com/toseigusokurd/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700/70 hover:bg-brand-accent hover:text-black transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" /></svg>
            </a>
            <a href="https://www.facebook.com/people/Tosei-Gusoku/100065134015633/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700/70 hover:bg-brand-accent hover:text-black transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
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
            <p>• Shito Ryu Inoue Ha ISKIA</p>
            <p>• Keishin Kai International</p>
            <p>• Reconocidos por FEDOKARATE</p>
            
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <h5 className="font-bold text-xs uppercase tracking-widest text-brand-accent font-display">Soporte</h5>
          <div className="text-xs text-gray-700/60 space-y-1.5">
            <Link href="/terminos" className="hover:text-brand-accent block">Términos Legales</Link>
            <Link href="/privacidad" className="hover:text-brand-accent block">Privacidad de Datos</Link>
            <p className="pt-2 text-[10px] text-gray-700/40">© {new Date().getFullYear()} Web Developed by León Gustavo Sensei.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
