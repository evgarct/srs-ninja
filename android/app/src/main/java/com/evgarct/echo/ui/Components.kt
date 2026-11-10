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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
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

/** Plays a card's recorded audio, provided by the activity. [onDone] runs on the main thread. */
interface Speaker {
    fun play(url: String, onDone: () -> Unit = {})
    fun stop()
}

val LocalSpeaker = staticCompositionLocalOf<Speaker> {
    object : Speaker {
        override fun play(url: String, onDone: () -> Unit) = onDone()
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

/** One piece of a [SwitchSentence]: plain text, or a word you tap to change a setting. */
class Word(val text: String, val onClick: (() -> Unit)? = null)

/**
 * A setting written as a sentence ("Ещё 20 сложных из этой колоды."): tappable words are graphite
 * with a dotted underline, 1.5 dp thick, 5 dp under the baseline. They are switches, not links.
 */
@Composable
fun SwitchSentence(words: List<Word>, style: TextStyle, modifier: Modifier = Modifier) {
    val link = androidx.compose.ui.text.TextLinkStyles(androidx.compose.ui.text.SpanStyle(color = Ink.Graphite))
    val ranges = ArrayList<IntRange>()
    val text = androidx.compose.ui.text.buildAnnotatedString {
        words.forEachIndexed { i, w ->
            val click = w.onClick
            if (click == null) append(w.text) else {
                val start = length
                pushLink(androidx.compose.ui.text.LinkAnnotation.Clickable("w$i", link) { click() })
                append(w.text)
                pop()
                ranges += start until length
            }
        }
    }
    var layout by remember { androidx.compose.runtime.mutableStateOf<androidx.compose.ui.text.TextLayoutResult?>(null) }
    BasicText(
        text,
        modifier.drawBehind {
            val l = layout ?: return@drawBehind
            val total = l.layoutInput.text.length
            val dot = 1.5.dp.toPx()
            val effect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(0.01f, dot * 2.2f))
            for (range in ranges) {
                var i = range.first
                val end = minOf(range.last + 1, total)
                while (i < end) {
                    val line = l.getLineForOffset(i)
                    val lineEnd = minOf(end, l.getLineEnd(line, visibleEnd = true))
                    if (lineEnd <= i) { i = maxOf(i + 1, l.getLineEnd(line)); continue }
                    val x0 = l.getBoundingBox(i).left
                    val x1 = l.getBoundingBox(lineEnd - 1).right
                    val y = l.getLineBaseline(line) + 5.dp.toPx()
                    drawLine(
                        Ink.Graphite,
                        androidx.compose.ui.geometry.Offset(minOf(x0, x1), y),
                        androidx.compose.ui.geometry.Offset(maxOf(x0, x1), y),
                        dot,
                        cap = androidx.compose.ui.graphics.StrokeCap.Round,
                        pathEffect = effect,
                    )
                    i = lineEnd
                }
            }
        },
        style = style,
        onTextLayout = { layout = it },
    )
}

/** The three sections under every top-level screen; the current one is medium with a green underline. */
enum class Section { Decks, Stats, More }

@Composable
fun BottomNav(current: Section, onSelect: (Section) -> Unit, modifier: Modifier = Modifier) {
    val sections = androidx.compose.ui.res.stringResource(com.evgarct.echo.R.string.nav_sections)
    Row(
        modifier
            .padding(horizontal = 12.dp)
            .fillMaxWidth()
            .height(64.dp)
            .drawBehind {
                drawLine(Ink.Rule, androidx.compose.ui.geometry.Offset.Zero, androidx.compose.ui.geometry.Offset(size.width, 0f), 1.dp.toPx())
            }
            .semantics { contentDescription = sections },
        verticalAlignment = Alignment.CenterVertically,
    ) {
        NavItem(androidx.compose.ui.res.stringResource(com.evgarct.echo.R.string.nav_decks), current == Section.Decks) { onSelect(Section.Decks) }
        NavItem(androidx.compose.ui.res.stringResource(com.evgarct.echo.R.string.nav_stats), current == Section.Stats) { onSelect(Section.Stats) }
        NavItem(androidx.compose.ui.res.stringResource(com.evgarct.echo.R.string.nav_more), current == Section.More) { onSelect(Section.More) }
    }
}

@Composable
private fun NavItem(label: String, current: Boolean, onClick: () -> Unit) {
    Box(Modifier.height(48.dp).pressable(onClick, 0.95f).padding(horizontal = 12.dp), contentAlignment = Alignment.Center) {
        BasicText(
            label,
            Modifier.drawBehind {
                if (current) {
                    val y = size.height + 6.dp.toPx()
                    drawLine(Ink.Leaf, androidx.compose.ui.geometry.Offset(0f, y), androidx.compose.ui.geometry.Offset(size.width, y), 2.dp.toPx())
                }
            },
            style = Type.body.copy(
                fontSize = 15.sp,
                fontWeight = if (current) FontWeight.Medium else FontWeight.Normal,
                color = if (current) Ink.Graphite else Ink.Soft,
            ),
        )
    }
}

/** Launches [block] once the composable has been on screen for [ms]. */
@Composable
fun After(ms: Long, key: Any?, block: suspend () -> Unit) {
    LaunchedEffect(key) {
        delay(ms)
        launch { block() }
    }
}
