Portrait asset for SPIN THE WILBEN.

WilbenSpin.png is the cutout that rides the clock hand. Keep it, or replace it
with a better cutout that has:

- PNG or WebP with a transparent background
- about 1000 x 1400 px (any tall portrait crop around 0.7:1)
- full body, facing the camera, head at the top and feet at the bottom
- feet reaching the bottom edge of the image; the cutout rotates around the
  hub and will appear sideways and upside down around the dial by design
- arms raised, out, or at the sides all work; keep them inside the image
- trim most of the empty margin around the figure (wide transparent side
  margins are cropped automatically)

PORTRAIT_IS_PLACEHOLDER is already false. Set it back to true in src/config.ts
only if you put placeholder art in this slot and want the reminder badge.

If the file is missing or fails to load, the app draws a built-in silhouette
instead so the presentation never breaks.
