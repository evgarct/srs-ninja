package com.evgarct.echo.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.evgarct.echo.ui.theme.EchoEase
import com.evgarct.echo.ui.theme.Ink
import com.evgarct.echo.ui.theme.Type
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Locale

/** Text-to-speech, provided by the activity. [onDone] runs on the main thread. */
interface Speaker {
    fun speak(text: String, locale: Locale, onDone: () -> Unit = {})
    fun stop()
}

val LocalSpeaker = staticCompositionLocalOf<Speaker> {
    object : Speaker {
        override fun speak(text: String, locale: Locale, onDone: () -> Unit) = onDone()
        override fun stop() {}
    }
}

/** Shared press feedback from the canvas: `scale(.97)` while held, 120 ms. */
fun Modifier.pressable(
    onClick: () -> Unit,
    pressedScale: Float = 0.97f,
    role: Role = Role.Button,
    label: String? = null,
): Modifier = composed {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val s by animateFloatAsState(if (pressed) pressedScale else 1f, tween(120), label = "press")
    this
        .graphicsLayer { scaleX = s; scaleY = s }
        .clickable(source, indication = null, role = role, onClickLabel = label, onClick = onClick)
}

/** `echoUp`: fade in while rising 14 dp, house easing, with a stagger delay. */
fun Modifier.riseIn(delayMs: Int = 0, durationMs: Int = 520, distance: Dp = 14.dp): Modifier = composed {
    val a = remember { Animatable(0f) }
    val px = with(LocalDensity.current) { distance.toPx() }
    LaunchedEffect(Unit) {
        delay(delayMs.toLong())
        a.animateTo(1f, tween(durationMs, easing = EchoEase))
    }
    graphicsLayer {
        alpha = a.value
        translationY = (1f - a.value) * px
    }
}

/** Dark 56 dp action: label left (one line, ellipsis), counter right in mono green, never squeezed. */
@Composable
fun PrimaryAction(label: String, trailing: String?, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier
            .fillMaxWidth()
            .height(56.dp)
            .pressable(onClick)
            .clip(RoundedCornerShape(14.dp))
            .background(Ink.Graphite)
            .padding(horizontal = 20.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = if (trailing == null) Arrangement.Center else Arrangement.SpaceBetween,
    ) {
        BasicText(
            label,
            Modifier.weight(1f, fill = trailing != null),
            style = Type.body.copy(color = Ink.Paper, fontWeight = FontWeight.Medium),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        if (trailing != null) {
            BasicText(trailing, Modifier.padding(start = 12.dp), style = Type.mono.copy(fontSize = 14.sp, color = Ink.LeafLight), maxLines = 1)
        }
    }
}

/** Word-as-button: underlined text with a 48 dp touch target. */
@Composable
fun TextAction(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    style: TextStyle = Type.body.copy(fontSize = 15.sp),
) {
    Box(modifier.height(48.dp).pressable(onClick, 0.96f).padding(horizontal = 12.dp), contentAlignment = Alignment.Center) {
        BasicText(text, style = style.copy(textDecoration = TextDecoration.Underline), maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/**
 * One line of a two-line screen title (dev sticker "текст при любой локализации"): it owns exactly
 * 46 sp of height, never wraps, is sized to its real width 44 → 28 sp in 1 sp steps, then ellipsis.
 * The glyphs may overhang the row (Onest's ascenders and descenders exceed a 1.02 line) but are
 * never clipped, and the row height follows the font scale so a larger system font cannot cut it.
 */
@Composable
fun TitleLine(text: String, modifier: Modifier = Modifier) {
    val rowH = with(LocalDensity.current) { 46.sp.toDp() }
    BasicText(
        text,
        modifier
            .fillMaxWidth()
            .height(rowH)
            .wrapContentHeight(Alignment.CenterVertically, unbounded = true),
        style = Type.display.copy(
            fontSize = 44.sp,
            lineHeightStyle = androidx.compose.ui.text.style.LineHeightStyle(
                androidx.compose.ui.text.style.LineHeightStyle.Alignment.Center,
                androidx.compose.ui.text.style.LineHeightStyle.Trim.None,
            ),
        ),
        maxLines = 1,
        softWrap = false,
        overflow = TextOverflow.Ellipsis,
        autoSize = androidx.compose.foundation.text.TextAutoSize.StepBased(minFontSize = 28.sp, maxFontSize = 44.sp, stepSize = 1.sp),
    )
}

/** One rect per visual line that the character range [start, end) occupies. */
fun rangeLineRects(layout: androidx.compose.ui.text.TextLayoutResult, start: Int, end: Int): List<androidx.compose.ui.geometry.Rect> {
    val out = mutableListOf<androidx.compose.ui.geometry.Rect>()
    var i = start
    while (i < end) {
        val line = layout.getLineForOffset(i)
        val lineEnd = minOf(end, layout.getLineEnd(line, visibleEnd = true))
        if (lineEnd <= i) { i = layout.getLineEnd(line); continue }
        val first = layout.getBoundingBox(i)
        val last = layout.getBoundingBox(lineEnd - 1)
        out += androidx.compose.ui.geometry.Rect(
            minOf(first.left, last.left), layout.getLineTop(line), maxOf(first.right, last.right), layout.getLineBottom(line),
        )
        i = lineEnd
    }
    return out
}

/** Launches [block] once the composable has been on screen for [ms]. */
@Composable
fun After(ms: Long, key: Any?, block: suspend () -> Unit) {
    LaunchedEffect(key) {
        delay(ms)
        launch { block() }
    }
}
