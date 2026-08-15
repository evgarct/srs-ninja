# Navigation feedback

High-frequency internal links continue to use Next.js prefetching, but navigation no longer renders inline spinners or a root route-level loading screen. Transitions are fast enough that the extra feedback caused more visual movement than value.

Loading indicators remain scoped to actions that can genuinely take time, including form submissions, saving settings, and audio generation.

The current screen remains responsive until the destination is ready, so a slow dynamic route or network request cannot appear as an ignored tap.
