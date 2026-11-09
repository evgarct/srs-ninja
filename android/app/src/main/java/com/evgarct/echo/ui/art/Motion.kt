package com.evgarct.echo.ui.art

import androidx.compose.animation.core.Easing
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.evgarct.echo.ui.theme.CssEaseInOut
import com.evgarct.echo.ui.theme.LocalReducedMotion

/**
 * Seconds since the drawing appeared, advanced once per frame. Reading it inside a draw
 * lambda only redraws, never recomposes. With reduced motion the clock stays at [frozenAt].
 */
@Composable
fun rememberClock(frozenAt: Float = 0f): State<Float> {
    val reduced = LocalReducedMotion.current
    val t = remember { mutableFloatStateOf(frozenAt) }
    if (!reduced) {
        LaunchedEffect(Unit) {
            val start = withFrameNanos { it }
            while (true) withFrameNanos { t.floatValue = (it - start) / 1_000_000_000f }
        }
    }
    return t
}

/** Position inside a repeating cycle, 0..1. */
fun phase(t: Float, period: Float, delay: Float = 0f): Float {
    val x = (t - delay) / period
    return if (x < 0f) 0f else x - kotlin.math.floor(x)
}

/** CSS-style keyframes: stops are (offset 0..1, value), each segment eased. */
fun kf(p: Float, vararg stops: Pair<Float, Float>, easing: Easing = CssEaseInOut): Float {
    if (p <= stops.first().first) return stops.first().second
    for (i in 1 until stops.size) {
        val (o1, v1) = stops[i]
        val (o0, v0) = stops[i - 1]
        if (p <= o1) {
            val f = if (o1 == o0) 1f else (p - o0) / (o1 - o0)
            return v0 + (v1 - v0) * easing.transform(f)
        }
    }
    return stops.last().second
}

private val pathCache = HashMap<String, Path>()

/** An SVG `d` string from the design, parsed once and reused. */
fun svg(d: String): Path = pathCache.getOrPut(d) { PathParser().parsePathString(d).toPath() }

/** A drawing in the canvas's own viewBox units, scaled to fit the composable's width. */
@Composable
fun Art(
    viewW: Float,
    viewH: Float,
    modifier: Modifier,
    description: String? = null,
    draw: DrawScope.() -> Unit,
) {
    val m = if (description != null) modifier.semantics { contentDescription = description } else modifier
    Canvas(m) {
        val s = size.width / viewW
        withTransform({ scale(s, s, Offset.Zero) }) { draw() }
    }
}

fun DrawScope.line(d: String, color: Color, width: Float = 2.2f, alpha: Float = 1f) {
    drawPath(svg(d), color, alpha = alpha, style = Stroke(width, cap = StrokeCap.Round, join = StrokeJoin.Round))
}

fun DrawScope.fill(d: String, color: Color, alpha: Float = 1f) {
    drawPath(svg(d), color, alpha = alpha, style = Fill)
}

/** Draws only the first [fraction] of a path's length, the "pen drawing itself" effect. */
fun DrawScope.partialLine(d: String, fraction: Float, color: Color, width: Float, alpha: Float = 1f) {
    if (fraction <= 0f || alpha <= 0f) return
    val pm = PathMeasure().apply { setPath(svg(d), false) }
    val out = Path()
    pm.getSegment(0f, pm.length * fraction.coerceAtMost(1f), out, true)
    drawPath(out, color, alpha = alpha, style = Stroke(width, cap = StrokeCap.Round, join = StrokeJoin.Round))
}

inline fun DrawScope.rotated(deg: Float, px: Float, py: Float, block: DrawScope.() -> Unit) {
    withTransform({ rotate(deg, Offset(px, py)) }, block)
}

inline fun DrawScope.moved(dx: Float, dy: Float, block: DrawScope.() -> Unit) {
    withTransform({ translate(dx, dy) }, block)
}

inline fun DrawScope.scaledAt(sx: Float, sy: Float, px: Float, py: Float, block: DrawScope.() -> Unit) {
    withTransform({ scale(sx, sy, Offset(px, py)) }, block)
}
