// src/lib/markdown-utils.ts

export function renderMarkdownToHtml(markdownText: string): string {
  if (!markdownText) return '';
  let html = markdownText;

  // Headers - ensure proper class names and newlines
  html = html.replace(/^# (.*$)/gim, '<h1 class="font-headline text-2xl font-bold mt-6 mb-3 border-b border-border/70 pb-1.5">$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="font-headline text-xl font-semibold mt-5 mb-2 border-b border-border/70 pb-1">$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="font-headline text-lg font-semibold mt-4 mb-1.5">$1</h3>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="font-headline text-base font-semibold mt-3 mb-1">$1</h4>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Unordered lists
  // Convert markdown list items to <li> tags
  html = html.replace(/^\s*([-*+]) +(.*)/gm, (match, bullet, content) => {
    return `<li>${content.trim()}</li>`;
  });
  // Wrap consecutive <li> tags in <ul> tags
  html = html.replace(/(<li>.*?<\/li>\s*)+/g, (match) => {
    // Remove trailing <br /> if any before adding to ul
    match = match.replace(/<br \/>$/,'');
    return `<ul class="list-disc list-outside pl-5 my-3 space-y-1.5">${match}</ul>`;
  });
  
  // Ordered lists
  // Convert markdown ordered list items to <li> tags
  html = html.replace(/^\s*\d+\.\s+(.*)/gm, (match, content) => {
    return `<li class="ml-1">${content.trim()}</li>`;
  });
  // Wrap consecutive <li> tags generated from ordered lists in <ol> tags
  // This regex is a bit more specific to avoid conflicts if <ul> also produces simple <li>
  html = html.replace(/(<li class="ml-1">.*?<\/li>\s*)+/g, (match) => {
    match = match.replace(/<br \/>$/,'');
    return `<ol class="list-decimal list-outside pl-5 my-3 space-y-1.5">${match}</ol>`;
  });

  // Paragraphs and line breaks
  // Process lines that are not already part of lists or headings
  html = html.split('\n').map(line => {
    const trimmedLine = line.trim();
    // If line is already an HTML block element or part of one, leave it.
    if (trimmedLine.match(/^<\/?(ul|ol|li|h[1-4]|p|strong|em|br)/i) || trimmedLine.match(/<\/(ul|ol|li|h[1-4]|p|strong|em)>$/i)) {
      return line;
    }
    if (trimmedLine === '') {
      return ''; // Treat empty lines as potential paragraph separators, handle later
    }
    return `<p class="my-2 leading-relaxed font-body">${line}</p>`;
  }).join('\n').replace(/\n+/g, '\n'); // Remove multiple blank lines, keep single ones for splitting paragraphs

  // Consolidate consecutive <p> tags that might have resulted from non-empty lines
  html = html.replace(/<\/p>\n<p class="my-2 leading-relaxed font-body">/g, '</p><p class="my-2 leading-relaxed font-body">');
  
  // Final cleanup for excessive breaks that might have been introduced or were originally there
  html = html.replace(/(<br ?\/?>\s*){2,}/gi, '<br class="my-1.5"/>'); // Consolidate multiple <br>
  html = html.replace(/<p class="my-2 leading-relaxed font-body">\s*<br class="my-1.5"\/>\s*<\/p>/gi, '<br class="my-1.5"/>'); // Empty p with br to just br
  html = html.replace(/<p class="my-2 leading-relaxed font-body">\s*<\/p>/gi, ''); // Remove truly empty p tags

  // Remove <br> tags that are directly adjacent to block elements
  html = html.replace(/<br class="my-1.5"\/>\s*<(ul|ol|h[1-4])/gi, '<$1');
  html = html.replace(/<\/(ul|ol|h[1-4])>\s*<br class="my-1.5"\/>/gi, '</$1>');
  html = html.replace(/^<br class="my-1.5"\/>|<br class="my-1.5"\/>$/gi, ''); // Trim leading/trailing breaks

  return html;
}
