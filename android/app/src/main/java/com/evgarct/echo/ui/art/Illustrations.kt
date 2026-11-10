package com.evgarct.echo.ui.art

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.evgarct.echo.ui.theme.CssEaseIn
import com.evgarct.echo.ui.theme.CssEaseOut
import com.evgarct.echo.ui.theme.EchoEase
import com.evgarct.echo.ui.theme.Ink
import com.evgarct.echo.ui.theme.LocalReducedMotion

private fun blink(t: Float, period: Float) =
    kf(phase(t, period), 0f to 1f, .92f to 1f, .95f to .1f, 1f to 1f)

/**
 * Sign-in: a cat rises from behind a stack of cards, grips its edge with both paws, blinks and
 * waves its tail. The cards are drawn over the cat, so it really peeks from behind them.
 */
@Composable
fun PeekingCat(description: String, modifier: Modifier = Modifier) {
    // Reduced motion: the cat is already up and holding on.
    val clock = rememberClock(frozenAt = 2f)
    Art(240f, 160f, modifier.size(300.dp, 200.dp), description) {
        val t = clock.value
        val c = Ink.Graphite
        val w = 3f
        // echoPeek: 900 ms after a 200 ms delay, overshoots by 4 and settles.
        val peek = kf(((t - .2f) / .9f).coerceIn(0f, 1f), 0f to 46f, .6f to -4f, 1f to 0f, easing = EchoEase)
        moved(0f, peek) {
            rotated(kf(phase(t, 1.8f), 0f to -8f, .5f to 12f, 1f to -8f), 162f, 76f) {
                line("M162 76 C 178 74, 190 62, 186 46 C 184 38, 176 38, 176 45", c, w)
            }
            shape(
                "M84 84 C 78 58, 90 42, 100 37 L 98 17 L 115 30 C 121 28, 129 28, 135 30 L 152 17 L 150 38 C 160 45, 166 60, 160 84",
                Ink.Ground, c, w,
            )
            scaledAt(1f, blink(t, 4.5f), 124f, 52f) {
                line("M111 52 l 0 1", c, w); line("M137 52 l 0 1", c, w)
            }
            line("M120 60 L 124 63 L 128 60", c, w)
            line("M124 63 L 124 67", c, w)
        }
        sheet(74f, 98f, 112f, 60f, 10f, Ink.Stack2, c, w)
        sheet(66f, 90f, 128f, 60f, 11f, Ink.Stack1, c, w)
        sheet(58f, 82f, 144f, 60f, 12f, Ink.Paper, c, w)
        // echoGrip: the paws appear on the edge once the cat is up.
        val grip = ((t - .95f) / .3f).coerceIn(0f, 1f)
        if (grip > .01f) {
            shape("M92 79 L 92 92 C 92 101, 110 101, 110 92 L 110 79", Ink.Ground, c, w, grip)
            line("M98 94 L 98 98", c, w, grip); line("M104 94 L 104 98", c, w, grip)
            shape("M138 79 L 138 92 C 138 101, 156 101, 156 92 L 156 79", Ink.Ground, c, w, grip)
            line("M144 94 L 144 98", c, w, grip); line("M150 94 L 150 98", c, w, grip)
        }
        line("M76 116 L 128 116", c, w)
        line("M76 128 L 108 128", Ink.SlipEdge, w)
        drawCircle(Ink.Leaf, 6f, Offset(180f, 124f))
    }
}

private fun DrawScope.sheet(x: Float, y: Float, w: Float, h: Float, r: Float, fill: Color, stroke: Color, width: Float) {
    drawRoundRect(fill, Offset(x, y), Size(w, h), CornerRadius(r, r))
    drawRoundRect(stroke, Offset(x, y), Size(w, h), CornerRadius(r, r), style = Stroke(width))
}

/**
 * Home: a cat sits on the top edge of the screen, paws and tail hanging down. [extendUp] continues
 * its sides above the drawing so the body always reaches the real screen edge under the status bar.
 */
@Composable
fun SittingCat(description: String, modifier: Modifier = Modifier, extendUp: Dp = 0.dp) {
    val clock = rememberClock()
    Art(110f, 130f, modifier.size(110.dp, 130.dp), description) {
        val t = clock.value
        val c = Ink.Graphite
        val w = 2.6f
        val up = extendUp.value
        rotated(kf(phase(t, 3.2f), 0f to -9f, .5f to 9f, 1f to -9f), 55f, 30f) {
            line("M55 30 C 53 58, 60 80, 54 98 C 50 110, 38 110, 38 100", c, w)
        }
        if (up > 0f) {
            drawRect(Ink.Ground, Offset(14f, -up), Size(82f, up + 1f))
            drawLine(c, Offset(14f, -up), Offset(14f, 0f), w)
            drawLine(c, Offset(96f, -up), Offset(96f, 0f), w)
        }
        shape("M14 0 C 14 24, 34 32, 56 32 C 78 32, 96 24, 96 0", Ink.Ground, c, w)
        moved(0f, kf(phase(t, 2.6f), 0f to 0f, .5f to 3f, 1f to 0f)) {
            shape("M24 20 L 24 36 C 24 45, 41 45, 41 36 L 41 24", Ink.Ground, c, w)
            line("M30 38 L 30 42", c, w); line("M35 38 L 35 42", c, w)
        }
        moved(0f, kf(phase(t, 2.6f, 1.3f), 0f to 0f, .5f to 3f, 1f to 0f)) {
            shape("M69 24 L 69 36 C 69 45, 86 45, 86 36 L 86 20", Ink.Ground, c, w)
            line("M75 38 L 75 42", c, w); line("M80 38 L 80 42", c, w)
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

/** Recall face: a pale-green cat paw presses the card and a green ring spreads from the touch. */
@Composable
fun TapPaw(modifier: Modifier = Modifier) {
    val clock = rememberClock(frozenAt = 0f)
    Art(44f, 46f, modifier.size(44.dp, 46.dp)) {
        val p = phase(clock.value, 1.6f)
        val rs = kf(p, 0f to .4f, .48f to .4f, .52f to .6f, 1f to 1.8f, easing = CssEaseOut)
        val ra = kf(p, 0f to 0f, .48f to 0f, .52f to .9f, 1f to 0f, easing = CssEaseOut)
        if (ra > 0.01f) drawCircle(Ink.Leaf, 13f * rs, Offset(22f, 25f), alpha = ra, style = Stroke(1.6f))
        val dy = kf(p, 0f to 0f, .38f to -4f, .5f to 1f, .62f to 0f, 1f to 0f)
        val s = kf(p, 0f to 1f, .38f to 1.04f, .5f to .86f, .62f to 1f, 1f to 1f)
        moved(0f, dy) {
            scaledAt(s, s, 22f, 30f) {
                rotated(-12f, 22f, 22f) {
                    val c = Ink.Graphite
                    shape(
                        "M13 29 C 13 23, 18 20, 22 20 C 26 20, 31 23, 31 29 C 31 32.5, 28.5 33.5, 26.5 32.5 C 24.5 31.5, 23.5 31.5, 22 31.5 C 20.5 31.5, 19.5 31.5, 17.5 32.5 C 15.5 33.5, 13 32.5, 13 29 Z",
                        Ink.LeafWash, c, 1.8f,
                    )
                    toe(11f, 18f, 3.2f, 4.2f, -25f)
                    toe(17.5f, 12f, 3.4f, 4.6f, -8f)
                    toe(26.5f, 12f, 3.4f, 4.6f, 8f)
                    toe(33f, 18f, 3.2f, 4.2f, 25f)
                }
            }
        }
    }
}

private fun DrawScope.toe(cx: Float, cy: Float, rx: Float, ry: Float, deg: Float) {
    rotated(deg, cx, cy) {
        drawOval(Ink.LeafWash, Offset(cx - rx, cy - ry), Size(rx * 2, ry * 2))
        drawOval(Ink.Graphite, Offset(cx - rx, cy - ry), Size(rx * 2, ry * 2), style = Stroke(1.8f))
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

/**
 * Session done: a fat cat sits on the table with half-closed eyes, flicks its tail, glances
 * sideways and swats the green ball off the edge; the ball drops out of sight and comes back.
 */
@Composable
fun SassyCat(description: String, modifier: Modifier = Modifier) {
    val clock = rememberClock(frozenAt = 0.4f)
    Art(240f, 152f, modifier.size(300.dp, 190.dp), description) {
        val t = clock.value
        val p = phase(t, 4f)
        val c = Ink.Graphite
        val w = 3f
        line("M14 112 L 200 112", c, w)
        line("M200 112 L 200 120", c, w)
        rotated(kf(phase(t, 2.2f), 0f to 0f, .2f to 14f, .3f to -6f, .4f to 10f, .55f to 0f, 1f to 0f), 62f, 104f) {
            line("M62 104 C 40 106, 30 92, 38 78 C 42 71, 52 72, 52 80", c, w)
        }
        line("M62 112 C 54 84, 62 56, 78 46 L 76 24 L 94 38 C 102 35, 112 35, 120 38 L 138 24 L 137 47 C 152 58, 158 86, 150 112", c, w)
        line("M92 112 C 92 104, 104 104, 104 112", c, w)
        rotated(kf(p, 0f to 0f, .18f to 0f, .26f to -14f, .31f to 16f, .4f to 0f, 1f to 0f), 148f, 90f) {
            line("M146 88 C 156 86, 166 90, 172 98", c, w)
            line("M172 98 C 177 100, 180 95, 176 92", c, w)
        }
        line("M88 62 L 102 62", c, w)
        line("M114 62 L 128 62", c, w)
        moved(kf(p, 0f to -4f, .4f to -4f, .5f to 4f, .8f to 4f, .9f to -4f, 1f to -4f), 0f) {
            line("M97 63 C 97 68, 103 68, 103 63", c, w)
            line("M123 63 C 123 68, 129 68, 129 63", c, w)
        }
        line("M104 76 L 108 79 L 112 76", c, w)
        line("M108 79 C 108 84, 116 85, 119 81", c, w)
        line("M82 74 L 70 72", c, w); line("M82 79 L 71 82", c, w)
        line("M134 74 L 146 71", c, w)
        val bx = kf(p, 0f to 0f, .29f to 0f, .37f to 20f, .48f to 34f, .56f to 42f, .9f to 0f, 1f to 0f, easing = CssEaseIn)
        val by = kf(p, 0f to 0f, .29f to 0f, .37f to 0f, .48f to 30f, .56f to 58f, .9f to 0f, 1f to 0f, easing = CssEaseIn)
        val ba = kf(p, 0f to 1f, .48f to 1f, .56f to 0f, .9f to 0f, 1f to 1f, easing = CssEaseIn)
        if (ba > .01f) drawCircle(Ink.Leaf, 7f, Offset(186f + bx, 104f + by), alpha = ba)
    }
}
