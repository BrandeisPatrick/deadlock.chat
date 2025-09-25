const BASE_URL = 'https://api.steampowered.com';

export async function resolveVanityUrl(vanityUrl, apiKey) {
  const url = `${BASE_URL}/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${encodeURIComponent(vanityUrl)}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Deadlock-Match-Analyzer/1.0' }
  });
  if (!response.ok) {
    throw new Error(`Steam Vanity API returned ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.response.success !== 1) {
    return null;
  }
  return data.response.steamid;
}

export async function getPlayerSummaries(steamIds, apiKey) {
  const url = `${BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamIds}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Deadlock-Match-Analyzer/1.0' }
  });
  if (!response.ok) {
    throw new Error(`Steam API returned ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.response && Array.isArray(data.response.players)) {
    data.response.players.forEach(player => {
      if (player.steamid) {
        player.deadlockAccountId = calculateDeadlockAccountId(player.steamid);
      }
    });
  }
  return data;
}

export function calculateDeadlockAccountId(steamId) {
  return (BigInt(steamId) - BigInt('76561197960265728')).toString();
}
