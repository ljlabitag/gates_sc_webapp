import { useEffect } from "react";

/**
 * Sets the document title and meta description for the lifetime of a page
 * component, restoring the previous values on unmount. The app is a SPA, so
 * without this every route would keep index.html's conference-wide title.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    let created = false;
    const previousDescription = meta?.content;

    if (description) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
        created = true;
      }
      meta.content = description;
    }

    return () => {
      document.title = previousTitle;
      if (!description || !meta) return;
      if (created) meta.remove();
      else if (previousDescription !== undefined) meta.content = previousDescription;
    };
  }, [title, description]);
}
