export function stripDiacritics(q: string): string {
    return q.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export function formatMoney(n: number) {
    return `$ ${n.toFixed(2)} MXN`;
}