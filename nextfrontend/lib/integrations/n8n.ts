import { createHmac } from 'node:crypto'

export type N8nEvent = 'enrollment.created' | 'student.converted'

interface N8nEnvelope {
	source: 'dojoapp'
	event: N8nEvent
	timestamp: string
	data: unknown
}

export function isN8nConfigured(): boolean {
	return Boolean(process.env.N8N_WEBHOOK_URL)
}

export async function postToN8n(event: N8nEvent, data: unknown): Promise<void> {
	const url = process.env.N8N_WEBHOOK_URL

	if (!url) {
		return
	}

	const envelope: N8nEnvelope = {
		source: 'dojoapp',
		event,
		timestamp: new Date().toISOString(),
		data,
	}

	try {
		const body = JSON.stringify(envelope)
		const headers: Record<string, string> = { 'Content-Type': 'application/json' }

		// Firma HMAC-SHA256 del body con N8N_WEBHOOK_SECRET: el workflow de n8n
		// debe verificar `x-dojoapp-signature` para descartar payloads falsificados.
		const secret = process.env.N8N_WEBHOOK_SECRET
		if (secret) {
			headers['x-dojoapp-signature'] = createHmac('sha256', secret).update(body).digest('hex')
		}

		await fetch(url, {
			method: 'POST',
			headers,
			body,
			// No seguir redirecciones: el webhook debe ser un destino exacto.
			redirect: 'error',
			signal: AbortSignal.timeout(5000),
		})
	} catch (error) {
		console.error('[n8n] No fue posible enviar el evento', event, error)
	}
}
