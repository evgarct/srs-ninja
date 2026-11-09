package com.evgarct.echo.ui.art

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.evgarct.echo.ui.theme.CssEaseOut
import com.evgarct.echo.ui.theme.Ink
import com.evgarct.echo.ui.theme.LocalReducedMotion

/** The bug hanging on its thread at the top of Home: swings, wiggles its legs, blinks. */
@Composable
fun SwingingBug(modifier: Modifier = Modifier) {
    val clock = rememberClock()
    Art(64f, 118f, modifier.size(64.dp, 118.dp)) {
        val t = clock.value
        val c = Ink.Graphite
        rotated(kf(phase(t, 3.6f), 0f to -7f, .5f to 7f, 1f to -7f), 33f, 0f) {
            line("M33 0 L 32 58", c)
            line("M32 60 C 22 60, 18 72, 22 82 C 26 92, 40 92, 43 82 C 46 72, 42 60, 32 60", c)
            val legs = kf(phase(t, .9f), 0f to -8f, .5f to 8f, 1f to -8f)
            rotated(legs, 24f, 78f) {
                line("M24 69 L 12 63", c); line("M22 77 L 9 79", c); line("M25 86 L 15 95", c)
            }
            rotated(-legs, 42f, 74f) {
                line("M41 69 L 52 64", c); line("M43 78 L 55 80", c)
            }
            scaledAt(1f, blink(t, 4f), 32f, 72f) {
                line("M28 72 l 0 0.5", c); line("M36 72 l 0 0.5", c)
            }
            line("M29 80 q 3 2 6 0", c)
        }
    }
}

private fun blink(t: Float, period: Float) =
    kf(phase(t, period), 0f to 1f, .92f to 1f, .95f to .1f, 1f to 1f)

/** Idle Home: the cat points up at the deck list. */
@Composable
fun PointingCat(modifier: Modifier = Modifier) {
    val clock = rememberClock()
    Art(96f, 80f, modifier.size(96.dp, 80.dp)) {
        val t = clock.value
        val c = Ink.Graphite
        val w = 2.3f
        moved(0f, kf(phase(t, 2.4f), 0f to 0f, .5f to -4f, 1f to 0f)) {
            line("M30 36 L 28 22 L 38 30", c, w)
            line("M46 29 L 55 20 L 54 36", c, w)
            line("M28 38 C 24 52, 34 60, 42 60 C 52 60, 58 52, 54 38", c, w)
            scaledAt(1f, blink(t, 5f), 41f, 44f) {
                line("M36 44 l 0 0.5", c, w); line("M47 43 l 0 0.5", c, w)
            }
            line("M40 50 l 1.5 1.5 l 1.5 -1.5", c, w)
            moved(0f, kf(phase(t, 1.2f), 0f to 0f, .5f to -6f, 1f to 0f)) {
                line("M58 46 C 66 40, 70 30, 72 16", c, w)
                line("M66 22 L 72 14 L 77 22", c, w)
            }
            line("M32 60 C 30 66, 30 72, 32 78", c, w)
            line("M50 60 C 54 66, 54 72, 52 78", c, w)
        }
    }
}

/** A deck done for today: a green check draws itself by hand, sparks flash around it, every 3.6 s. */
@Composable
fun SelfDrawingCheck(description: String, modifier: Modifier = Modifier) {
    // Reduced motion freezes on the finished check with the sparks lit.
    val clock = rememberClock(frozenAt = 3.6f * 0.4f)
    Art(52f, 36f, modifier.size(52.dp, 36.dp), description) {
        val p = phase(clock.value, 3.6f)
        val drawn = kf(p, 0f to 0f, .22f to 1f, 1f to 1f)
        val alpha = kf(p, 0f to 1f, .82f to 1f, .92f to 0f, 1f to 0f)
        partialLine("M14 19 C 17 22, 19 25, 21 28 C 26 19, 31 12, 38 6", drawn, Ink.Leaf, 3f, alpha)
        spark(clock.value, 0f, Offset(4f, 8.5f)) { line("M6 10 l -4 -3", Ink.Graphite, 2f, it) }
        spark(clock.value, .08f, Offset(2f, 20f)) { line("M4 20 l -4 0", Ink.Graphite, 2f, it) }
        spark(clock.value, .16f, Offset(46f, 2.5f)) { line("M44 4 l 4 -3", Ink.Graphite, 2f, it) }
        spark(clock.value, .24f, Offset(48.5f, 14f)) { line("M46 14 l 5 0", Ink.Graphite, 2f, it) }
        spark(clock.value, .3f, Offset(42f, 26f)) { drawCircle(Ink.Leaf, 1.8f, Offset(42f, 26f), alpha = it) }
    }
}

private inline fun DrawScope.spark(t: Float, delay: Float, center: Offset, draw: DrawScope.(Float) -> Unit) {
    val p = phase(t, 3.6f, delay)
    val s = kf(p, 0f to 0f, .18f to 0f, .26f to 1.3f, .34f to 1f, 1f to 1f, easing = CssEaseOut)
    val a = kf(p, 0f to 0f, .18f to 0f, .26f to 1f, .34f to 1f, .5f to 0f, 1f to 0f, easing = CssEaseOut)
    if (a <= 0.01f) return
    scaledAt(s, s, center.x, center.y) { draw(a) }
}

/** Recall face: a cat paw taps the card and a green ring spreads from the touch. */
@Composable
fun TapPaw(modifier: Modifier = Modifier) {
    val clock = rememberClock(frozenAt = .6f)
    Art(44f, 46f, modifier.size(44.dp, 46.dp)) {
        val p = phase(clock.value, 1.6f)
        val rs = kf(p, 0f to .4f, .48f to .4f, .52f to .6f, 1f to 1.8f, easing = CssEaseOut)
        val ra = kf(p, 0f to 0f, .48f to 0f, .52f to .9f, 1f to 0f, easing = CssEaseOut)
        if (ra > 0.01f) drawCircle(Ink.Leaf, 9f * rs, Offset(22f, 17f), alpha = ra, style = Stroke(1.8f))
        moved(0f, kf(p, 0f to 0f, .35f to -5f, .5f to 2f, .6f to 0f, 1f to 0f)) {
            val c = Ink.Soft
            line("M18 27 C 20 34, 21 40, 21 46", c, 2f)
            line("M28 26 C 31 32, 33 39, 34 46", c, 2f)
            drawOval(Ink.Paper, Offset(11f, 7.5f), Size(23f, 20f))
            drawOval(c, Offset(11f, 7.5f), Size(23f, 20f), style = Stroke(2f))
            fill("M17.5 21.5 q 5 -6 10 0 q -0.5 4 -5 4 q -4.5 0 -5 -4 z", c)
            drawCircle(c, 2f, Offset(14.5f, 15.5f))
            drawCircle(c, 2.1f, Offset(19.5f, 11.5f))
            drawCircle(c, 2.1f, Offset(25.5f, 11.5f))
            drawCircle(c, 2f, Offset(30.5f, 15.5f))
        }
    }
}

/**
 * Swipe hint between two arrows: the cat rides left (strained face) and right (pleased face),
 * two 3 s cycles, then rests in the centre with a neutral face. Only "easier" (right) is green.
 */
@Composable
fun SwipeHintCat(description: String, modifier: Modifier = Modifier) {
    val clock = rememberClock()
    val reduced = LocalReducedMotion.current
    Art(160f, 56f, modifier.size(160.dp, 56.dp), description) {
        val t = clock.value
        val running = !reduced && t < 6f
        val p = if (running) phase(t, 3f) else 0f
        val c = Ink.Graphite
        val left = if (running) kf(p, 0f to .3f, .25f to 1f, .5f to .3f, .75f to .3f, 1f to .3f) else .3f
        val right = if (running) kf(p, 0f to .3f, .5f to .3f, .75f to 1f, 1f to .3f) else .3f
        line("M10 30 C 18 28, 26 29, 34 30", c, 2f, left)
        line("M16 23 L 9 30 L 16 37", c, 2f, left)
        line("M126 30 C 134 29, 142 28, 150 30", Ink.Leaf, 2f, right)
        line("M144 23 L 151 30 L 144 37", Ink.Leaf, 2f, right)
        val dx = kf(p, 0f to 0f, .25f to -26f, .5f to 0f, .75f to 26f, 1f to 0f)
        val rot = kf(p, 0f to 0f, .25f to -8f, .5f to 0f, .75f to 8f, 1f to 0f)
        moved(dx, 0f) {
            rotated(rot, 80f, 50f) {
                line("M66 46 C 62 34, 68 26, 80 26 C 92 26, 98 34, 94 46 C 90 52, 70 52, 66 46", c, 2f)
                line("M68 32 L 66 19 L 75 27", c, 2f); line("M85 27 L 94 19 L 92 32", c, 2f)
                val n = if (running) kf(p, 0f to 1f, .08f to 1f, .12f to 0f, .4f to 0f, .44f to 1f, .58f to 1f, .62f to 0f, .9f to 0f, .94f to 1f, 1f to 1f) else 1f
                val h = if (running) kf(p, 0f to 0f, .08f to 0f, .12f to 1f, .4f to 1f, .44f to 0f, 1f to 0f) else 0f
                val e = if (running) kf(p, 0f to 0f, .58f to 0f, .62f to 1f, .9f to 1f, .94f to 0f, 1f to 0f) else 0f
                if (n > .01f) { line("M73 38 l 0 0.5", c, 2f, n); line("M87 38 l 0 0.5", c, 2f, n); line("M78 44 l 2 1.5 l 2 -1.5", c, 2f, n) }
                if (e > .01f) { line("M70 39 q 3 -4 6 0", c, 2f, e); line("M84 39 q 3 -4 6 0", c, 2f, e); line("M75 43 q 5 5 10 0", c, 2f, e) }
                if (h > .01f) {
                    line("M71 35 l 4 3 l -4 3", c, 2f, h); line("M89 35 l -4 3 l 4 3", c, 2f, h)
                    line("M74 46 q 1.5 -2 3 0 q 1.5 2 3 0 q 1.5 -2 3 0 q 1.5 2 3 0", c, 2f, h)
                    line("M61 26 q -3 4 0 7 q 3 -3 0 -7", c, 1.6f, h)
                }
            }
        }
    }
}

/** Session done: a sassy cat on the table swats the green ball off, smug head tilt, slow blink. */
@Composable
fun SassyCat(description: String, modifier: Modifier = Modifier) {
    val clock = rememberClock(frozenAt = 0.5f)
    Art(220f, 132f, modifier.size(300.dp, 180.dp), description) {
        val t = clock.value
        val p = phase(t, 4f)
        val c = Ink.Graphite
        val w = 2.6f
        line("M20 96 L 150 96", c, w); line("M150 96 L 150 101", c, w)
        line("M0 128 L 120 128", c, w); line("M132 128 L 220 128", c, w)
        rotated(kf(phase(t, 2.2f), 0f to 0f, .2f to 14f, .3f to -6f, .4f to 10f, .55f to 0f, 1f to 0f), 74f, 92f) {
            line("M74 92 C 56 92, 48 104, 52 116 C 54 122, 62 121, 61 115", c, w)
        }
        line("M80 47 C 70 60, 68 80, 72 96", c, w)
        line("M104 47 C 114 60, 118 80, 112 96", c, w)
        line("M84 96 c 0 -6, 8 -6, 8 0", c, w)
        rotated(kf(p, 0f to 0f, .18f to 0f, .26f to -14f, .31f to 16f, .4f to 0f, 1f to 0f), 108f, 68f) {
            line("M108 68 C 120 70, 130 78, 135 86", c, w)
            line("M135 86 c 3 3, 8 1, 6 -3 c -1 -2, -4 -2, -6 0", c, w)
        }
        rotated(kf(p, 0f to 0f, .4f to 0f, .5f to -7f, .78f to -7f, .88f to 0f, 1f to 0f), 92f, 46f) {
            line("M74 40 C 70 26, 80 18, 92 18 C 104 18, 112 26, 108 40 C 105 50, 77 50, 74 40", c, w)
            line("M77 26 L 73 9 L 86 19", c, w); line("M98 19 L 111 8 L 107 27", c, w)
            line("M79 32 L 88 31", c, w); line("M95 30 L 104 29", c, w)
            scaledAt(1f, kf(p, 0f to 1f, .6f to 1f, .64f to .15f, .68f to .15f, .72f to 1f, 1f to 1f), 92f, 33f) {
                line("M82 33 q 2 3 4 0", c, w); line("M97 31 q 2 3 4 0", c, w)
            }
            line("M95 23 q 5 -4 10 -1", c, w); line("M86 40 q 4 3 9 -1", c, w)
            line("M112 34 l 7 -1", c, w); line("M112 38 l 7 1", c, w)
        }
        val bx = kf(p, 0f to 0f, .29f to 0f, .36f to 14f, .46f to 24f, .53f to 31f, .6f to 38f, .82f to 72f, .88f to 72f, .92f to 0f, 1f to 0f)
        val by = kf(p, 0f to 0f, .29f to 0f, .36f to -3f, .46f to 33f, .53f to 22f, .6f to 33f, .82f to 33f, .88f to 33f, .92f to 0f, 1f to 0f)
        val ba = kf(p, 0f to 1f, .82f to 1f, .88f to 0f, .92f to 0f, 1f to 1f)
        if (ba > .01f) drawCircle(Ink.Leaf, 5f, Offset(143f + bx, 90.5f + by), alpha = ba)
    }
}
