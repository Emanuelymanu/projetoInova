type Ponto = { latitude: number | string; longitude: number | string };

/** Distância em km entre dois pontos (fórmula de haversine). */
export function distanciaKm(a: Ponto, b: Ponto): number {
  const rad = (g: number | string) => (Number(g) * Math.PI) / 180;
  const dLat = rad(b.latitude) - rad(a.latitude);
  const dLon = rad(b.longitude) - rad(a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Data local do servidor no formato AAAA-MM-DD. */
export function hojeISO(): string {
  const d = new Date();
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}
