// Shared shape for a profile Highlight as used by the UI (a subset of the full
// row). The full row type lives in database.types.ts under Tables["highlights"].
export type Highlight = {
  id: string;
  title: string;
  media_url: string;
  caption: string | null;
};
