# Navigation feedback requirements

- Every application route transition provides visible feedback without waiting for the destination server response.
- Primary navigation, deck opening, study actions, and deck-page links show a spinner and use production prefetching.
- A route-level loading state covers other Link and programmatic router transitions.
- Feedback preserves the current page until the destination is ready and works on mobile and desktop.
