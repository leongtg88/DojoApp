import { MarkdownAsync } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
    content: string
}

export async function MarkdownContent({ content }: MarkdownContentProps) {
    const rendered = await MarkdownAsync({ children: content, remarkPlugins: [remarkGfm] })
    return <div className="blog-prose text-gray-700">{rendered}</div>
}
