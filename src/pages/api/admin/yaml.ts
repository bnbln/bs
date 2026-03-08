import { NextApiRequest, NextApiResponse } from 'next';
import yaml from 'js-yaml';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'POST') {
        const { action, payload } = req.body;
        try {
            if (action === 'parse') {
                const data = yaml.load(payload);
                return res.status(200).json({ data });
            } else if (action === 'stringify') {
                const str = yaml.dump(payload, { indent: 2, lineWidth: -1 });
                return res.status(200).json({ data: str });
            } else {
                return res.status(400).json({ error: 'Unknown action' });
            }
        } catch (e: any) {
            return res.status(400).json({ error: e.message });
        }
    } else {
        res.setHeader('Allow', ['POST'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
