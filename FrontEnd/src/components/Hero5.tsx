import heroImageDesktop from '../assets/Desktop Full.svg';
import LogoIskia from '../assets/LogoIskia.svg';
import BannerHero from '../assets/BannerHero.svg';

const Hero5 = () => {
    return (
        <>
            {/* Hero Section - Contenedor principal */}
            <div className="relative h-[900px] w-full mx-auto bg-no-repeat bg-cover bg-center bg-fixed
                sm:h-[1100px] 
                md:flex md:flex-row md:h-[700px]
                2xl:h-[1000px] 2xl:max-w-[1940px] 2xl:pb-[100px] "
                style={{ backgroundImage: `url(${heroImageDesktop})` }}
            >
                {/* Overlay - Cubre todo el Hero Section */}
                {/* High-contrast vignettes */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                <div className="absolute inset-0 bg-white/40" />

                {/* Lado1 */}
                <div className="hijo flex items-center justify-center
            xl:grow-1 xl:justify-end
            ">
                    <div className="relative inline-block">
                        {/* Blur effect - detrás de la imagen */}
                        <div
                            className="absolute inset-0 rounded-r rounded-l"
                            style={{
                                animation: "color-change 10s infinite linear",
                                backgroundImage: "radial-gradient(closest-side, currentColor, transparent)"
                            }}
                        />

                        {/* Imagen - centrada gracias al flex del padre */}
                        <img
                            src={BannerHero}
                            alt="Banner Hero"
                            className="relative z-10 block
                            mx-auto  w-[340px] max-w-[340px] max-h-[400px] px-2 
                            sm:min-w-[400px] sm:min-h-[400px]
                            xl:min-w-[500px] xl:min-h-[500px]
                            2xl:min-w-[600px] 2xl:min-h-[600px]
                "
                        />
                        {/* Blur effect at the bottom */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full opacity-90 pointer-events-none
            h-[30px] w-full min-w-[330px] max-w-[600px] z-10
            2xl:max-w-[740px] 4xl:max-w-[900px]"
                            style={{
                                animation: "color-change 10s infinite linear",
                                backgroundImage: "radial-gradient(closest-side, currentColor 45%, transparent )"
                            }} />

                        {/* Rain container */}
                        <div className="rain-container absolute inset-0">
                            <div className="rain">
                                <div className="waves"></div>
                                <div className="particles">
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Lado2 */}

                <div className="
                    px-6 flex justify-center max-h-[1300px]  items-center
                    sm:px-6 sm:mt-[20px] sm:mb-[20px]
                    md:px-6 md:mt-[20px] md:mb-[20px]
                    xl:grow-1 xl:flex xl:justify-start
                    text-left text-gray-700  ">

                    {/*Contenedor  titulos */}
                    <div className="bg-transparent backdrop-blur-xs px-4 py-4  border-[1px] hover:backdrop-blur-lg border-current  rounded-lg shadow-xl/50 transition-[backdrop-filter] duration-500
                    xl:max-w-[600px]"
                        style={{ animation: " color-change 10s infinite linear" }}>

                        <h1 className=" text-3xl lg:text-5xl font-bold lg:text-leading-tight">
                            TU CUERPO ES
                            <br />
                            <span className="text-gray-700">TU TEMPLO</span>
                        </h1>
                        <p className="mt-4 text-sm font-light tracking-wide text-gray-700">
                            "El dolor que sientes hoy es la fuerza que sentirás mañana. Cada repetición, cada gota de sudor, te acerca a la mejor versión de ti mismo. ¡No te rindas!"
                        </p>

                        {/*Boton */}
                        <div className="mt-8   py-2 px-6 inline-block bg-current  backdrop-blur-sm shadow-xl/30 border hover-border-white   hover:bg-color-change  hover:text-gray-700 font-regular  rounded-lg "
                            style={{ animation: "border-color-change  10s infinite linear" }}>
                            <a
                                href="#"
                                className="text-gray-700 hover:text-gray-700 text-sm font-semibold  2xl:text-base  transition-colors duration-300"
                            >
                                Empieza Hoy
                            </a>
                        </div>
                        {/*end Boton */}


                        {/* Redes sociales y logo Padre*/}
                        <div className="mt-4  w-full justify-between flex flex-row items-center lg:items-start">

                            {/*Contenedor  Logo IKIA*/}
                            <div className=" relative flex justify-start ">

                                {/* Logo IKIA */}
                                <img src={LogoIskia} alt="Logo Iskia" className="mt-8  z-10  w-[150px] h-auto" />

                                {/* Blur effect  */}
                                <div className=" "

                                    style={{
                                        animation: "color-change 10s infinite linear",
                                        backgroundImage: "radial-gradient(closest-side, currentColor, transparent)"
                                    }}>
                                </div>
                                {/*End Blur effect  */}
                            </div>
                            {/* Fin Contenedor  Logo IKIA */}




                            {/* Redes sociales */}
                            <div className="mt-8 flex flex-col  space-x-4 space-y-2">
                                <a href="#" className="text-gray-700 hover:text-indigo-400">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22.46 6c-.8.36-1.65.6-2.54.7.9-.54 1.6-1.4 1.92-2.44-.84.5-1.78.86-2.78 1.06C18.26 4.3 17.1 4 15.82 4c-2.44 0-4.42 1.98-4.42 4.42 0 .34.04.68.1.1L7.1 9.42C6.7 7.9 5.8 6.63 4.58 5.82c-.34.58-.53 1.25-.53 1.96 0 1.5.76 2.84 1.94 3.62-.7-.02-1.36-.22-1.94-.54v.06c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.14-1.14.14-.28 0-.55-.02-.82-.08.56 1.72 2.18 2.97 4.1 3-1.48 1.16-3.36 1.86-5.4 1.86-.35 0-.7-.02-1.04-.06 1.92 1.24 4.2 1.96 6.68 1.96 8.02 0 12.4-6.64 12.4-12.4v-.56c.84-.6 1.58-1.36 2.16-2.24z" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-700 hover:text-indigo-400">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.2 6.78h-1.34c-.5 0-.6.24-.6.6v.94h1.86l-.24 1.86h-1.62v4.78h-1.94v-4.78H9v-1.86h1.32v-.7c0-1.3.8-2.02 1.96-2.02h1.6v1.88z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-700 hover:text-indigo-400">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 5.8c.2.1.3.2.4.4.1.2.2.4.2.6v6.4c0 .4-.1.7-.4.9-.2.2-.5.3-.8.3h-1.2c-.3 0-.6-.1-.8-.3-.2-.2-.4-.5-.4-.9V9.4c0-.4.1-.7.4-.9.2-.2.5-.3.8-.3h1.2c.3 0 .6.1.8.3zm-3.6 0c.2.1.3.2.4.4.1.2.2.4.2.6v6.4c0 .4-.1.7-.4.9-.2.2-.5.3-.8.3h-1.2c-.3 0-.6-.1-.8-.3-.2-.2-.4-.5-.4-.9V9.4c0-.4.1-.7.4-.9.2-.2.5-.3.8-.3h1.2c.3 0 .6.1.8.3zm-3.6 0c.2.1.3.2.4.4.1.2.2.4.2.6v6.4c0 .4-.1.7-.4.9-.2.2-.5.3-.8.3H8c-.3 0-.6-.1-.8-.3-.2-.2-.4-.5-.4-.9V9.4c0-.4.1-.7.4-.9.2-.2.5-.3.8-.3h1.2c.3 0 .6.1.8.3z" clipRule="evenodd" />
                                    </svg>
                                </a>
                            </div>
                            {/* Fin contenedor Redes sociales */}



                        </div>

                    </div>

                </div>

            </div>


        </>
    );
};

export default Hero5;