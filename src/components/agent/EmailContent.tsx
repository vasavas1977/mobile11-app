import DOMPurify from 'dompurify';

interface EmailContentProps {
  content: string;
  metadata?: {
    has_html?: boolean;
    html_content?: string;
    [key: string]: unknown;
  };
}

export const EmailContent = ({ content, metadata }: EmailContentProps) => {
  if (metadata?.has_html && metadata?.html_content) {
    const sanitizedHtml = DOMPurify.sanitize(metadata.html_content as string, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 
        'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
        'div', 'span', 'img', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'ul', 'ol', 'li', 'blockquote', 'hr', 'pre', 'code',
        'font', 'center', 'small', 'sub', 'sup'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'style', 'class', 'width', 'height',
        'border', 'cellpadding', 'cellspacing', 'align', 'valign',
        'bgcolor', 'color', 'face', 'size', 'target'
      ],
      ALLOW_DATA_ATTR: false,
    });
    
    return (
      <div 
        className="email-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }
  
  return <p className="text-sm whitespace-pre-wrap">{content}</p>;
};
