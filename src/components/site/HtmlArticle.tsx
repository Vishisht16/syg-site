import { memo, forwardRef } from "react";

/**
 * Renders server-generated HTML. Memoized so parent re-renders (scroll
 * progress, panels) never re-apply innerHTML and wipe client-injected
 * content such as rendered mermaid diagrams.
 */
export const HtmlArticle = memo(
  forwardRef<
    HTMLElement,
    {
      html: string;
      className?: string;
      as?: "article" | "div";
      onClick?: (e: React.MouseEvent<HTMLElement>) => void;
    }
  >(function HtmlArticle({ html, className, as = "article", onClick }, ref) {
    const Tag = as as "article";
    return (
      <Tag
        ref={ref as React.Ref<HTMLElement>}
        className={className}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }),
);
