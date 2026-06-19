export function stripDiacritics(q: string): string {
    return q.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}