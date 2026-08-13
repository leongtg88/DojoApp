import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validaciones mínimas en servidor
    if (!body.nombre || !body.tipo) {
      return NextResponse.json({ ok: false, error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Guardar en CRM / base de datos
    const id = crypto.randomUUID();

    // Simulación de persistencia
    console.log('Nueva solicitud:', { id, ...body });

    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
