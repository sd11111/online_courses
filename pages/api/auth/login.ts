import { NextApiRequest, NextApiResponse } from 'next';
import { loginUser } from '../../../lib/auth';
import { setCookie } from 'cookies-next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await loginUser(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // В реальном проекте используйте JWT или другие методы безопасной аутентификации
    setCookie('userId', user.id, { req, res, maxAge: 60 * 60 * 24 * 7 }); // 7 дней

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}