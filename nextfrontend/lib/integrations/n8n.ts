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
		await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(envelope),
			signal: AbortSignal.timeout(5000),
		})
	} catch (error) {
		console.error('[n8n] No fue posible enviar el evento', event, error)
	}
}
