import { withSessionRoute } from "../../lib/session";

async function loginRoute(req, res) {
    if (req.method === 'POST') {
        const { username, password } = req.body;

        try {
            const response = await fetch('http://127.0.0.1:5000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                req.session.user = { isLoggedIn: true, username };
                await req.session.save();
                res.json({ isLoggedIn: true, username });
            } else {
                res.status(response.status).json({ error: data.error || '登入失敗' });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: '發生了意外錯誤' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default withSessionRoute(loginRoute);