export type BlockType =
    | 'frontmatter'
    | 'text'
    | 'header'
    | 'list'
    | 'mockup'
    | 'callout'
    | 'palette'
    | 'gallery'
    | 'video'
    | 'project-ref'
    | 'animation-sequence'
    | 'code';

export interface Block {
    id: string;
    type: BlockType;
    content: string;
    fenceInfo?: string;
}

export function generateId() {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function parseMarkdownToBlocks(markdown: string): Block[] {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let i = 0;

    if (lines[0] === '---') {
        let fmEnd = 1;
        while (fmEnd < lines.length && lines[fmEnd] !== '---') {
            fmEnd++;
        }
        if (fmEnd < lines.length) {
            blocks.push({
                id: generateId(),
                type: 'frontmatter',
                content: lines.slice(0, fmEnd + 1).join('\n')
            });
            i = fmEnd + 1;
        }
    }

    let textBuffer: string[] = [];

    const flushText = () => {
        if (textBuffer.length > 0) {
            const content = textBuffer.join('\n').trim();
            if (content) {
                blocks.push({
                    id: generateId(),
                    type: 'text',
                    content
                });
            }
            textBuffer = [];
        }
    };

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed === '') {
            flushText();
            i++;
            continue;
        }

        if (/^\[(project|projects):/i.test(trimmed)) {
            flushText();
            blocks.push({ id: generateId(), type: 'project-ref', content: trimmed });
            i++;
            continue;
        }

        if (trimmed.startsWith('#')) {
            flushText();
            blocks.push({ id: generateId(), type: 'header', content: trimmed });
            i++;
            continue;
        }

        if (trimmed.startsWith('- ')) {
            flushText();
            const listItems: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('- ')) {
                listItems.push(lines[i]);
                i++;
            }
            blocks.push({ id: generateId(), type: 'list', content: listItems.join('\n').trim() });
            continue;
        }

        if (trimmed.startsWith('![')) {
            flushText();
            blocks.push({ id: generateId(), type: 'gallery', content: trimmed });
            i++;
            continue;
        }

        if (trimmed.startsWith('[video')) {
            flushText();
            blocks.push({ id: generateId(), type: 'video', content: trimmed });
            i++;
            continue;
        }

        if (trimmed.startsWith('```')) {
            flushText();
            const fenceStart = line;
            i++;
            const bodyLines: string[] = [];
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                bodyLines.push(lines[i]);
                i++;
            }
            i++; // Skip closing fence

            const fenceInfo = fenceStart.replace(/^```+/, '').trim();
            const typeStr = fenceInfo.split(/\s+/)[0].toLowerCase();

            let blockType: BlockType = 'code';
            if (['mockup', 'iphone', 'macbook'].includes(typeStr) || fenceInfo.includes('type="iphone"') || fenceInfo.includes('type="macbook"')) blockType = 'mockup';
            else if (['insight', 'note', 'warning', 'context', 'result', 'callout'].includes(typeStr)) blockType = 'callout';
            else if (typeStr === 'palette' || fenceInfo.includes('type="palette"')) blockType = 'palette';
            else if (typeStr.includes('animation') || typeStr.includes('video')) blockType = 'animation-sequence';

            blocks.push({
                id: generateId(),
                type: blockType,
                content: bodyLines.join('\n'), // Preserves empty lines in code block
                fenceInfo: fenceStart.trim()
            });
            continue;
        }

        textBuffer.push(line);
        i++;
    }

    flushText();
    return blocks;
}

export function serializeBlocksToMarkdown(blocks: Block[]): string {
    const parts: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.type === 'frontmatter') {
            parts.push(b.content);
        } else if (b.type === 'text' || b.type === 'header' || b.type === 'list' || b.type === 'gallery' || b.type === 'video' || b.type === 'project-ref') {
            parts.push(b.content);
        } else {
            // code blocks
            parts.push(`${b.fenceInfo || '```'}\n${b.content}${b.content && !b.content.endsWith('\n') ? '\n' : ''}\`\`\``);
        }
    }

    return parts.join('\n\n') + '\n';
}

export function parseFenceAttributes(attr: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const fenceWithoutType = attr.replace(/^```\w*\s*/, '');
    const regex = /(\w+)=(("[^"]*")|('[^']*')|([^\s]+))/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(fenceWithoutType)) !== null) {
        const key = m[1];
        let val = m[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        if (val.trim() !== '') {
            attrs[key] = val;
        }
    }
    return attrs;
}

export function serializeFenceAttributes(typeString: string, attrs: Record<string, string>): string {
    const attrStr = Object.entries(attrs)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
    return `\`\`\`${typeString}${attrStr ? ' ' + attrStr : ''}`;
}
