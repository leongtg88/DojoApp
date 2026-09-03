import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Ingresa un correo electrónico válido' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Enlace de recuperación enviado exitosamente a ${email}`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || 'Error en el servidor' },
      { status: 500 }
    );
  }
}
