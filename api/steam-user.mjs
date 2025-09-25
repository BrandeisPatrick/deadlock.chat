import { resolveVanityUrl, getPlayerSummaries, calculateDeadlockAccountId } from './steam-api.mjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { steamids, vanityurl, player_name } = req.query;
  const finalVanityUrl = vanityurl || player_name;

  if (!steamids && !finalVanityUrl) {
    return res.status(400).json({
      error: 'steamids, vanityurl, or player_name parameter required',
      examples: {
        steamids: '/api/steam-user?steamids=76561197960361544',
        vanityurl: '/api/steam-user?vanityurl=username',
        player_name: '/api/steam-user?player_name=PlayerName'
      }
    });
  }

  // Get Steam API key from environment
  const steamApiKey = process.env.STEAM_API_KEY;
  
  if (!steamApiKey) {
    return res.status(500).json({ 
      error: 'Steam API key not configured',
      details: 'No Steam API key found in environment variables. Please add STEAM_API_KEY to your Vercel environment variables.'
    });
  }

  if (player_name && !finalVanityUrl && !steamids) {
    return res.status(404).json({
      error: 'Player not found',
      message: 'Display name search is not supported. Please use Steam profile URL or vanity URL instead.',
      searchTerm: player_name
    });
  }

  try {
    let finalSteamIds = steamids;

    if (finalVanityUrl) {
      const resolvedSteamId = await resolveVanityUrl(finalVanityUrl, steamApiKey);

      if (!resolvedSteamId) {
        return res.status(404).json({
          error: 'Player not found',
          message: 'No Steam user found with that vanity URL',
          vanityurl: finalVanityUrl
        });
      }

      finalSteamIds = resolvedSteamId;

      if (!steamids) {
        return res.status(200).json({
          resolved: true,
          vanityurl: finalVanityUrl,
          steamid: finalSteamIds,
          deadlockAccountId: calculateDeadlockAccountId(finalSteamIds)
        });
      }
    }

    const data = await getPlayerSummaries(finalSteamIds, steamApiKey);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch (error) {
    if (player_name && !steamids && !finalVanityUrl) {
      res.status(404).json({
        error: 'Player not found',
        message: `No Steam user found with display name "${player_name}"`,
        details: error.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to fetch Steam data',
        details: error.message
      });
    }
  }
}
