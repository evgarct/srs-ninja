package com.evgarct.echo.ui.done

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.evgarct.echo.R
import com.evgarct.echo.data.Grade
import com.evgarct.echo.data.SessionResult
import com.evgarct.echo.ui.PrimaryAction
import com.evgarct.echo.ui.TextAction
import com.evgarct.echo.ui.art.SassyCat
import com.evgarct.echo.ui.riseIn
import com.evgarct.echo.ui.theme.Ink
import com.evgarct.echo.ui.theme.Type
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private val CountEase = CubicBezierEasing(0.33f, 1f, 0.68f, 1f) // ease-out cubic, like the canvas count-up

@Composable
fun DoneScreen(
    result: SessionResult,
    extraLabel: String,
    onHome: () -> Unit,
    onMore: () -> Unit,
) {
    BackHandler(onBack = onHome)
    val count = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        delay(300)
        count.animateTo(1f, tween(1100, easing = CountEase))
    }
    val bar = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        delay(340)
        bar.animateTo(1f, tween(900, easing = com.evgarct.echo.ui.theme.EchoEase))
    }
    val date = LocalDate.now().format(
        DateTimeFormatter.ofPattern(stringResource(R.string.date_short), com.evgarct.echo.ui.currentLocale()),
    )

    Column(
        Modifier
            .fillMaxSize()
            .background(Ink.Ground)
            .windowInsetsPadding(WindowInsets.statusBars)
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(start = 24.dp, end = 24.dp, top = 28.dp),
    ) {
        BasicText("${result.deckName} · $date", Modifier.riseIn(durationMs = 480), style = Type.mono)
        BasicText(
            stringResource(R.string.done_title_line1) + "\n" + stringResource(R.string.done_title_line2),
            Modifier.padding(top = 14.dp).riseIn(80),
            style = Type.display.copy(fontSize = 40.sp),
        )
        Column(
            Modifier.fillMaxWidth().padding(top = 10.dp).riseIn(160, 600),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            SassyCat(stringResource(R.string.done_cat_a11y))
            BasicText(stringResource(R.string.done_caption), Modifier.padding(top = 2.dp), style = Type.hand.copy(fontSize = 26.sp))
        }

        val e = count.value
        val secs = (result.millis / 1000f * e).toInt()
        Column(
            Modifier
                .padding(top = 18.dp)
                .riseIn(260)
                .drawBehind { drawLine(Ink.Graphite, Offset.Zero, Offset(size.width, 0f), 1.dp.toPx()) },
        ) {
            Row {
                Stat(Modifier.weight(1f), (result.total * e).toInt().toString(), stringResource(R.string.done_cards), divider = false)
                Stat(Modifier.weight(1f), "${(result.accuracy * e).toInt()}%", stringResource(R.string.done_accuracy), divider = true)
            }
            Row {
                Stat(Modifier.weight(1f), "${secs / 60}:${(secs % 60).toString().padStart(2, '0')}", stringResource(R.string.done_time), divider = false)
                Stat(Modifier.weight(1f), (result.struggled * e).toInt().toString(), stringResource(R.string.done_hard), divider = true)
            }
        }

        GradeBar(result, bar.value, Modifier.padding(top = 14.dp).riseIn(340))

        Spacer(Modifier.weight(1f))
        Column(Modifier.riseIn(420), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            PrimaryAction(stringResource(R.string.done_to_decks), trailing = null, onClick = onHome)
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                TextAction(extraLabel, onMore)
            }
        }
    }
}

@Composable
private fun Stat(modifier: Modifier, value: String, label: String, divider: Boolean) {
    Column(
        modifier
            .drawBehind {
                val w = 1.dp.toPx()
                drawLine(Ink.Rule, Offset(0f, size.height - w / 2), Offset(size.width, size.height - w / 2), w)
                if (divider) drawLine(Ink.Rule, Offset(w / 2, 0f), Offset(w / 2, size.height), w)
            }
            .padding(start = if (divider) 18.dp else 0.dp, top = 14.dp, bottom = 14.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        BasicText(value, style = Type.display.copy(fontSize = 30.sp, letterSpacing = (-0.02).em, lineHeight = 1.1.em, fontFeatureSettings = "tnum"))
        BasicText(label, style = Type.body.copy(fontSize = 13.sp, color = Ink.Soft))
    }
}

/** Grade split drawn as a bar: each segment grows from the left, 100 ms apart. */
@Composable
private fun GradeBar(result: SessionResult, progress: Float, modifier: Modifier) {
    val segs = listOf(
        Triple(Grade.Again, Ink.Graphite, R.string.grade_again),
        Triple(Grade.Hard, Ink.SlipEdge, R.string.grade_hard),
        Triple(Grade.Good, Color(0xFFB9B2A6), R.string.grade_good),
        Triple(Grade.Easy, Ink.Leaf, R.string.grade_easy),
    )
    Column(modifier) {
        Row(Modifier.fillMaxWidth().height(6.dp), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
            segs.filter { result.count(it.first) > 0 }.forEachIndexed { i, (g, color, _) ->
                val p = ((progress * 1.25f) - i * 0.1f).coerceIn(0f, 1f)
                Box(
                    Modifier
                        .weight(result.count(g).toFloat())
                        .fillMaxSize()
                        .graphicsLayer { scaleX = p; transformOrigin = TransformOrigin(0f, 0.5f) }
                        .background(color, RoundedCornerShape(3.dp)),
                )
            }
        }
        val labels = segs.map { (g, _, res) -> Triple(g, stringResource(res), result.count(g)) }
        BasicText(
            buildAnnotatedString {
                labels.forEachIndexed { i, (g, label, c) ->
                    if (i > 0) append(" · ")
                    if (g == Grade.Easy) withStyle(SpanStyle(color = Ink.Leaf)) { append("$label $c") } else append("$label $c")
                }
            },
            Modifier.padding(top = 8.dp),
            style = Type.mono.copy(color = Ink.Soft, fontWeight = FontWeight.Normal),
        )
    }
}
