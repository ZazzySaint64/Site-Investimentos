// Finds the investment a visitor typed, by code or by part of the name. Pure.

type Named = { ticker: string; name: string };

const MAX_MATCHES = 8;

function plain(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function findAssets<T extends Named>(
  assets: T[],
  query: string,
): { exact: T | null; matches: T[] } {
  const wanted = plain(query);
  if (!wanted) return { exact: null, matches: [] };
  const exact =
    assets.find((asset) => plain(asset.ticker) === wanted || plain(asset.name) === wanted) ?? null;
  if (exact) return { exact, matches: [] };
  const words = wanted.split(/\s+/);
  const matches = assets.filter((asset) => {
    const text = `${plain(asset.ticker)} ${plain(asset.name)}`;
    return words.every((word) => text.includes(word));
  });
  return matches.length === 1
    ? { exact: matches[0], matches: [] }
    : { exact: null, matches: matches.slice(0, MAX_MATCHES) };
}
