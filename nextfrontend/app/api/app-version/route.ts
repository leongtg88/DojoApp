export const dynamic = 'force-dynamic'

/**
 * Debe coincidir con `deploymentId` de next.config.ts: identifica el build que
 * el servidor está sirviendo en este momento. El cliente compara este valor
 * con el `data-dpl-id` de su HTML para detectar que quedó desactualizado.
 */
function resolveDeploymentId(): string | null {
    return (
        process.env.NEXT_DEPLOYMENT_ID ??
        process.env.VERCEL_DEPLOYMENT_ID ??
        process.env.VERCEL_GIT_COMMIT_SHA ??
        null
    )
}

export function GET() {
    return Response.json(
        { version: resolveDeploymentId() },
        { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } },
    )
}
