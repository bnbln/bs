import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import opentype from 'opentype.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
        return res.status(403).json({ error: 'Forbidden. Admin backend only available in development.' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { fontPath, fontName, generateSpecimen } = req.body;

        if (!fontPath || typeof fontPath !== 'string') {
            return res.status(400).json({ error: 'fontPath is required' });
        }
        if (!fontName || typeof fontName !== 'string') {
            return res.status(400).json({ error: 'fontName is required' });
        }

        // We assume fontPath is an absolute path on the user's mac, e.g. /Library/Fonts/SFPro.ttf
        if (!fs.existsSync(fontPath)) {
            return res.status(404).json({ error: `Font file not found at path: ${fontPath}` });
        }

        const font = await opentype.load(fontPath);
        if (!font) {
            return res.status(500).json({ error: 'Failed to load font with opentype.js' });
        }

        // Ensure output dir exists
        const outDir = path.join(process.cwd(), 'public', 'assets', 'fonts');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        // Generate 'Aa' symbol for the specimen block
        // Arbitrary large font size for the specimen "Aa" cover
        const sizeAa = 240;
        const pathAa = font.getPath('Aa', 0, sizeAa, sizeAa, {
            features: {
                liga: true,
                rlig: true
            }
        });

        // Get bounding box context roughly
        const bbAa = pathAa.getBoundingBox();
        const widthAa = Math.ceil(bbAa.x2 - bbAa.x1) + 20;
        const heightAa = Math.ceil(bbAa.y2 - bbAa.y1) + 20;
        const svgAa = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthAa}" height="${heightAa}" viewBox="${bbAa.x1 - 10} ${bbAa.y1 - 10} ${widthAa} ${heightAa}">
            ${pathAa.toSVG(2)}
        </svg>`;

        const safeName = fontName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const fileNameAa = `${safeName}-aa.svg`;
        fs.writeFileSync(path.join(outDir, fileNameAa), svgAa);

        let fileNameTitle = null;

        // If 'generateSpecimen' is true, generate the actual Font Name text as well (e.g. "Inter")
        if (generateSpecimen) {
            const sizeTitle = 160;
            const pathTitle = font.getPath(fontName, 0, sizeTitle, sizeTitle, {});
            const bbTitle = pathTitle.getBoundingBox();
            const widthTitle = Math.ceil(bbTitle.x2 - bbTitle.x1) + 40;
            const heightTitle = Math.ceil(bbTitle.y2 - bbTitle.y1) + 40;
            const svgTitle = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthTitle}" height="${heightTitle}" viewBox="${bbTitle.x1 - 20} ${bbTitle.y1 - 20} ${widthTitle} ${heightTitle}" preserveAspectRatio="xMinYMin meet">
                ${pathTitle.toSVG(2)}
            </svg>`;

            fileNameTitle = `${safeName}-title.svg`;
            fs.writeFileSync(path.join(outDir, fileNameTitle), svgTitle);
        }

        return res.status(200).json({
            success: true,
            files: {
                aa: `assets/fonts/${fileNameAa}`,
                title: fileNameTitle ? `assets/fonts/${fileNameTitle}` : null
            }
        });

    } catch (error: any) {
        console.error('Error generating font SVG:', error);
        return res.status(500).json({ error: error.message || 'Internal server error processing font' });
    }
}
