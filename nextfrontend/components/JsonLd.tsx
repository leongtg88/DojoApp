import Script from 'next/script';

interface JsonLdProps {
  data: Record<string, unknown>;
  id?: string;
}

export default function JsonLd({ data, id }: JsonLdProps) {
  const escaped = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <Script
      id={id ?? 'json-ld'}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escaped }}
    />
  );
}