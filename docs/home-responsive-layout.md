# Responsive-First Home Layout

## Summary

Home now behaves like a focused launcher instead of a mini dashboard:

- mobile uses one navigation layer only: the fixed bottom bar;
- desktop keeps the floating top shell;
- Home no longer renders a `Home / What to study next` heading block;
- the deck grid starts immediately and stays the primary surface;
- deck cards keep one due signal and two actions without extra chrome.
- three or more decks retain their natural card height and scroll inside the content area above the fixed mobile navigation.

## Files

- `src/components/nav.tsx`
- `src/app/page.tsx`
- `src/components/home-deck-card.tsx`

## Shell Contract

The shell now has a simpler split by viewport:

1. desktop: top floating navigation with brand, section links, and overflow actions;
2. mobile: bottom navigation with decks, stats, create, and overflow actions;
3. review routes: no global shell navigation, because review owns its own session chrome.

Create deck is a single controlled dialog rendered outside both dropdown menus. Desktop menu selection closes the menu and opens that persistent dialog; the mobile `+` button opens the same dialog directly. Failed creation keeps the form usable and reports a localized toast.

This removes the previous double-navigation feeling on phones.

## Home Hierarchy

Home no longer spends vertical space on a title surface above the deck list.

The page now opens directly into the actionable grid so the user can:

- see available decks immediately;
- compare due counts at a glance;
- start review without reading decorative copy first.

The viewport remains locked to prevent body bounce, while `HomeDeckList` owns vertical scrolling. Grid rows use their content height instead of sharing the available viewport height, so additional decks are never compressed or clipped. The page shell reserves the mobile navigation and safe-area space outside the scroll region.

## Deck Card Pattern

`HomeDeckCard` remains intentionally sparse:

- deck language and title;
- one `due` counter;
- optional draft badge when drafts exist;
- one primary review CTA;
- one secondary open-deck CTA.

The card should not add extra section labels, status chips, or explanatory filler.
