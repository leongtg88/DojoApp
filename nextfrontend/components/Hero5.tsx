'use client';

const Hero5 = ({ onOpenAssistant }: { onOpenAssistant: () => void }) => {
  return (
    <>
      <div
        className="relative h-[900px] w-full mx-auto bg-no-repeat bg-cover bg-center bg-fixed md:bg-scroll sm:h-[1100px] md:flex md:flex-row md:h-[700px] 2xl:h-[1000px] 2xl:max-w-[2040px] 2xl:pb-[100px]"
        style={{ backgroundImage: `url(/assets/BannerbgHero19080x1080.webp)` }}
      >
        <div className="absolute inset-x-0 top-0 -bottom-[2px] bg-gradient-to-t from-white via-white/50 to-transparent" />

        {/* Lado 1 */}
        <div className="hijo flex items-center justify-center xl:grow-1 xl:justify-end">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-r rounded-l" style={{ animation: "color-change 10s infinite linear", backgroundImage: "radial-gradient(closest-side, currentColor, transparent)" }} />
            <img
              src="/assets/BannerHero.svg"
              alt="Banner Hero"
              className="relative z-10 block mx-auto pt-6 w-[340px] max-w-[340px] max-h-[400px] px-2 sm:min-w-[400px] sm:pt-0 sm:min-h-[400px] xl:min-w-[500px] xl:min-h-[500px] 2xl:min-w-[600px] 2xl:min-h-[600px]"
            />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full opacity-90 pointer-events-none h-[30px] w-full min-w-[330px] max-w-[600px] z-10 2xl:max-w-[740px]"
              style={{ animation: "color-change 10s infinite linear", backgroundImage: "radial-gradient(closest-side, currentColor 45%, transparent)" }} />
            <div className="rain-container absolute inset-0">
              <div className="rain">
                <div className="waves"></div>
                <div className="particles">
                  {Array.from({ length: 11 }).map((_, i) => <div key={i}></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado 2 */}
        <div className="px-6 flex justify-center max-h-[1300px] items-center sm:px-6 sm:mt-[20px] sm:mb-[20px] md:px-6 md:mt-[20px] md:mb-[20px] xl:grow-1 xl:flex xl:justify-start text-left text-gray-700">
          <div
            className="bg-transparent backdrop-blur-sm px-4 py-4 border-[1px] hover:backdrop-blur-lg border-current rounded-lg shadow-xl/50 transition-[backdrop-filter] duration-500 xl:max-w-[600px]"
            style={{ animation: "color-change 10s infinite linear" }}
          >
            <h1 className="text-3xl md:p-4 lg:text-5xl font-bold lg:text-leading-tight">
              TU CUERPO ES<br />
              <span className="text-gray-700">TU TEMPLO</span>
            </h1>
            <p className="mt-4 text-sm md:text-base md:px-4 tracking-wide text-gray-900">
              &quot;El dolor que sientes hoy es la fuerza que sentirás mañana. Cada repetición, cada gota de sudor, te acerca a la mejor versión de ti mismo. ¡No te rindas!&quot;
            </p>
            <div className="mt-8 md:ml-4 py-2 px-6 inline-block bg-current backdrop-blur-sm shadow-xl/30 border hover-color-change hover:bg-white hover:text-gray-700 font-regular rounded-lg"
              style={{ animation: "border-color-change 10s infinite linear" }}>
              <button
                type="button"
                onClick={onOpenAssistant}
                className="text-gray-700 hover:text-white hover:bg-white text-sm font-semibold 2xl:text-base transition-colors duration-300 cursor-pointer"
              >
                Empieza Hoy
              </button>
            </div>
            <div className="mt-4 md:mb-4 w-full justify-between flex flex-row items-center lg:items-start">
              <div className="relative flex justify-start">
                <img src="/assets/LogoIskia.svg" alt="Logo Iskia" className="mt-8 z-10 w-[150px] h-auto" />
              </div>
              <div className="mt-8 flex flex-col space-x-4 space-y-2">
                <a href="https://www.youtube.com/@ToseiGusokuDojo" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-700 hover:text-indigo-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
                <a href="https://www.instagram.com/toseigusokurd/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-700 hover:text-indigo-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" /></svg>
                </a>
                <a href="https://www.facebook.com/people/Tosei-Gusoku/100065134015633/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-700 hover:text-indigo-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero5;
