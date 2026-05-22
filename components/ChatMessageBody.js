// Preserves line breaks, paragraphs, and leading spaces from chat textarea input.

export default function ChatMessageBody({ text, className, style = {} }) {
  if (text == null || text === '') return null;

  return (
    <span
      className={className}
      style={{
        display: 'block',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        ...style,
      }}
    >
      {text}
    </span>
  );
}
