// Convierte un título en un slug kebab-case sin acentos ni caracteres especiales.
export function slugify(input: string): string {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 180)
        .replace(/-+$/g, '')
}

// Devuelve el primer slug libre partiendo de `base`, probando `base`, `base-2`, ...
export async function resolveUniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
    const root = base || 'articulo'
    let candidate = root
    let suffix = 2

    while (await exists(candidate)) {
        candidate = `${root}-${suffix}`
        suffix += 1
    }

    return candidate
}
