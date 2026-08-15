# Navigation feedback

High-frequency internal links use `PendingLink`, enabling full Next.js prefetching and `useLinkStatus` feedback on the activated link. The root App Router `loading.tsx` supplies route-level feedback for all other links and programmatic router transitions.

The current screen remains responsive until the destination is ready, so a slow dynamic route or network request cannot appear as an ignored tap.
