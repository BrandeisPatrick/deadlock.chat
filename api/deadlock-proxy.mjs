export default async function (req, res) {
    const { url } = req.query; // The URL to proxy will be passed as a query parameter

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (!url) {
        res.status(400).json({ error: 'Missing "url" query parameter.' });
        return;
    }

    try {
        const targetUrl = decodeURIComponent(url);
        const response = await fetch(targetUrl);

        if (!response.ok) {
            // Forward the status and message from the target API
            res.status(response.status).json({ error: response.statusText });
            return;
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Deadlock proxy error:', error);
        res.status(500).json({ error: 'Failed to proxy request to Deadlock API.' });
    }
}