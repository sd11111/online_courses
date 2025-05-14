import { NextApiRequest, NextApiResponse } from 'next';
import { deleteCookie } from 'cookies-next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Удаляем cookie с userId
    deleteCookie('userId', { req, res });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}