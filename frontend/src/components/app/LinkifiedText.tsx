import { Fragment } from "react";

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;
const TRAILING_PUNCTUATION = /[.,;:!?)}\]]+$/;

export function LinkifiedText({ text }: { text: string }) {
  return (
    <span className="whitespace-pre-wrap">
      {text.split(URL_PATTERN).map((part, index) => {
        if (!/^https?:\/\//i.test(part)) return <Fragment key={index}>{part}</Fragment>;

        const trailing = part.match(TRAILING_PUNCTUATION)?.[0] ?? "";
        const href = trailing ? part.slice(0, -trailing.length) : part;
        try {
          const url = new URL(href);
          if (url.protocol !== "http:" && url.protocol !== "https:") return part;
        } catch {
          return part;
        }

        return (
          <Fragment key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="break-all font-medium text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary/80 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {href}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            {trailing}
          </Fragment>
        );
      })}
    </span>
  );
}
