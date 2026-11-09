package com.evgarct.echo.ui.home

import android.widget.Toast
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.SizeTransform
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.text.style.Hyphens
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withLink
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.evgarct.echo.R
import com.evgarct.echo.data.Deck
import com.evgarct.echo.ui.PrimaryAction
import com.evgarct.echo.ui.Remote
import com.evgarct.echo.ui.TextAction
import com.evgarct.echo.ui.TitleLine
import androidx.compose.foundation.layout.offset
import com.evgarct.echo.ui.art.PointingCat
import com.evgarct.echo.ui.art.SelfDrawingCheck
import com.evgarct.echo.ui.art.SwingingBug
import com.evgarct.echo.ui.pressable
import com.evgarct.echo.ui.riseIn
import com.evgarct.echo.ui.theme.EchoEase
import com.evgarct.echo.ui.theme.Ink
import com.evgarct.echo.ui.theme.Type
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

val ExtraCounts = listOf(20, 10, 50)
val ExtraKinds = listOf(R.string.extra_kind_hard, R.string.extra_kind_new, R.string.extra_kind_random, R.string.extra_kind_forgotten)

/** The API's `kind` for each extra-review word. */
val ExtraKindKeys = mapOf(
    R.string.extra_kind_hard to "hard",
    R.string.extra_kind_new to "new",
    R.string.extra_kind_random to "random",
    R.string.extra_kind_forgotten to "forgotten",
)

@Composable
fun HomeScreen(
    decks: Remote<List<Deck>>,
    email: String,
    initialSelection: String?,
    onRetry: () -> Unit,
    onSignOut: () -> Unit,
    onReview: (deck: Deck) -> Unit,
    onExtra: (deck: Deck, count: Int, kindRes: Int) -> Unit,
) {
    val list = (decks as? Remote.Ready)?.value.orEmpty()
    var selectedId by rememberSaveable { mutableStateOf(initialSelection) }
    val selected = list.firstOrNull { it.id == selectedId }
    var extraN by rememberSaveable { mutableIntStateOf(0) }
    var extraKind by rememberSaveable { mutableIntStateOf(0) }
    var moreOpen by rememberSaveable { mutableStateOf(false) }
    val haptics = LocalHapticFeedback.current
    val context = LocalContext.current
    val soon = stringResource(R.string.next_iteration)

    Box(Modifier.fillMaxSize().background(Ink.Ground)) {
        SwingingBug(Modifier.align(Alignment.TopEnd).windowInsetsPadding(WindowInsets.statusBars).padding(end = 34.dp))

        Column(
            Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.statusBars)
                .windowInsetsPadding(WindowInsets.navigationBars),
        ) {
            BasicText(
                stringResource(R.string.wordmark),
                Modifier.padding(start = 24.dp, top = 14.dp),
                style = Type.hand.copy(fontSize = 36.sp, lineHeight = 36.sp, color = Ink.Graphite),
            )
            Spacer(Modifier.height(38.dp))
            Column(Modifier.padding(horizontal = 24.dp).riseIn()) {
                BasicText(todayLabel(), style = Type.mono)
                Spacer(Modifier.height(10.dp))
                HomeTitle(decks, selected)
            }
            Spacer(Modifier.height(30.dp))

            // Deck list: scrolls in its own area, the action zone below stays put.
            Column(
                Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 10.dp)
                    .riseIn(delayMs = 80)
                    .selectableGroup()
                    .semantics { contentDescription = context.getString(R.string.home_deck_group) },
            ) {
                Box(Modifier.padding(horizontal = 14.dp).fillMaxWidth().height(1.dp).background(Ink.Graphite))
                when (decks) {
                    Remote.Loading -> ListNote(stringResource(R.string.home_loading))
                    is Remote.Failed -> {
                        ListNote(stringResource(R.string.home_error))
                        TextAction(stringResource(R.string.home_retry), onRetry, Modifier.padding(start = 2.dp))
                    }
                    is Remote.Ready -> if (list.isEmpty()) ListNote(stringResource(R.string.home_empty_hint))
                }
                list.forEachIndexed { i, deck ->
                    val next = list.getOrNull(i + 1)
                    DeckRow(
                        deck = deck,
                        last = i == list.lastIndex,
                        selected = deck.id == selectedId,
                        dimmed = selectedId != null && deck.id != selectedId,
                        hideDivider = deck.id == selectedId || next?.id == selectedId,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
                            selectedId = if (selectedId == deck.id) null else deck.id
                        },
                    )
                }
                Spacer(Modifier.height(12.dp))
            }

            ActionZone(
                idle = decks is Remote.Ready && list.isNotEmpty(),
                deck = selected,
                extraN = ExtraCounts[extraN],
                extraKindRes = ExtraKinds[extraKind],
                onCycleN = { extraN = (extraN + 1) % ExtraCounts.size },
                onCycleKind = { extraKind = (extraKind + 1) % ExtraKinds.size },
                onReview = { selected?.let(onReview) },
                onExtra = { selected?.let { onExtra(it, ExtraCounts[extraN], ExtraKinds[extraKind]) } },
            )

            BottomNav(
                moreOpen = moreOpen,
                onSoon = { Toast.makeText(context, soon, Toast.LENGTH_SHORT).show() },
                onMore = { moreOpen = !moreOpen },
            )
        }

        MoreSheet(
            open = moreOpen,
            email = email,
            onDismiss = { moreOpen = false },
            onSignOut = { moreOpen = false; onSignOut() },
        )
    }
}

@Composable
private fun ListNote(text: String) {
    BasicText(text, Modifier.padding(horizontal = 14.dp, vertical = 18.dp), style = Type.hand.copy(fontSize = 24.sp))
}

/** "Ещё": a paper slip above the nav with the account and sign-out. Tapping outside closes it. */
@Composable
private fun androidx.compose.foundation.layout.BoxScope.MoreSheet(
    open: Boolean,
    email: String,
    onDismiss: () -> Unit,
    onSignOut: () -> Unit,
) {
    val scrim by animateFloatAsState(if (open) 1f else 0f, tween(220), label = "scrim")
    if (scrim > 0.01f) {
        Box(
            Modifier
                .matchParentSize()
                .graphicsLayer { alpha = scrim }
                .background(Ink.Ground.copy(alpha = 0.6f))
                .pressable(onDismiss, 1f),
        )
    }
    androidx.compose.animation.AnimatedVisibility(
        visible = open,
        modifier = Modifier
            .align(Alignment.BottomStart)
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(start = 12.dp, end = 12.dp, bottom = 72.dp),
        enter = fadeIn(tween(200)) + slideInVertically(tween(380, easing = EchoEase)) { it / 3 },
        exit = fadeOut(tween(150)) + slideOutVertically(tween(220)) { it / 4 },
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .background(Ink.Paper, RoundedCornerShape(14.dp))
                .border(1.5.dp, Ink.Graphite, RoundedCornerShape(14.dp))
                .padding(horizontal = 20.dp, vertical = 16.dp),
        ) {
            BasicText(
                stringResource(R.string.more_signed_in, email),
                style = Type.mono.copy(color = Ink.Soft),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            TextAction(stringResource(R.string.more_sign_out), onSignOut, Modifier.padding(top = 4.dp).offset(x = (-12).dp))
        }
    }
}

private fun todayLabel(): String {
    val ru = Locale.forLanguageTag("ru")
    val s = LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, d MMMM", ru))
    return s.replaceFirstChar { it.titlecase(ru) }
}

/**
 * Screen title: always two lines in a fixed 92 dp block pinned to the bottom. Each line is its
 * own string and is sized independently to its real width, 44 → 28 sp in 1 sp steps, then ellipsis.
 */
@Composable
private fun HomeTitle(remote: Remote<List<Deck>>, selected: Deck?) {
    val decks = (remote as? Remote.Ready)?.value.orEmpty()
    val totalDue = decks.sumOf { it.due }
    val empty = remote is Remote.Ready && decks.isEmpty()
    val line1 = when {
        remote !is Remote.Ready -> " "
        empty -> stringResource(R.string.home_empty_line1)
        selected != null -> stringResource(R.string.home_title_deck_line1, selected.name)
        else -> pluralStringResource(R.plurals.home_title_idle_line1, totalDue, totalDue)
    }
    val line2 = when {
        remote !is Remote.Ready -> " "
        empty -> stringResource(R.string.home_empty_line2)
        selected == null && totalDue == 0 -> stringResource(R.string.home_title_idle_line2_none)
        selected == null -> stringResource(R.string.home_title_idle_line2)
        selected.due > 0 -> stringResource(R.string.home_title_deck_due_line2, selected.due)
        else -> stringResource(R.string.home_title_deck_done_line2)
    }
    // The block follows the text's sp scale, so a larger system font never clips the second line.
    val blockH = with(LocalDensity.current) { 92.sp.toDp() }
    Column(Modifier.fillMaxWidth().height(blockH), verticalArrangement = Arrangement.Bottom) {
        FitLine(line1)
        FitLine(line2)
    }
}

@Composable
private fun FitLine(text: String) {
    AnimatedContent(
        targetState = text,
        transitionSpec = {
            ((fadeIn(tween(260, 60)) + slideInVertically(tween(360, 60, EchoEase)) { it / 3 }) togetherWith
                (fadeOut(tween(160)) + slideOutVertically(tween(200)) { -it / 4 }))
                .using(SizeTransform(clip = false))
        },
        label = "title-line",
    ) { value -> TitleLine(value) }
}

@Composable
private fun DeckRow(
    deck: Deck,
    last: Boolean,
    selected: Boolean,
    dimmed: Boolean,
    hideDivider: Boolean,
    onClick: () -> Unit,
) {
    val alpha by animateFloatAsState(if (dimmed) 0.4f else 1f, tween(260), label = "dim")
    val hl by animateFloatAsState(if (selected) 1f else 0f, tween(260), label = "hl")
    val divider by animateFloatAsState(if (hideDivider) 0f else 1f, tween(200), label = "divider")
    val numColor by animateColorAsState(if (selected) Ink.Leaf else Ink.Graphite, tween(260), label = "num")
    val drafts = if (deck.drafts > 0) pluralStringResource(R.plurals.drafts, deck.drafts, deck.drafts) else null
    val meta = listOfNotNull(
        deck.pair,
        drafts,
        if (deck.due == 0) stringResource(R.string.home_deck_done_meta) else null,
    ).joinToString(" · ")
    val ru = LocaleList("ru")

    Box(
        Modifier
            .fillMaxWidth()
            .graphicsLayer { this.alpha = alpha }
            .selectable(selected = selected, role = Role.RadioButton, onClick = onClick),
    ) {
        // Selection is a paper layer behind the row: geometry never moves.
        Box(
            Modifier
                .matchParentSize()
                .graphicsLayer {
                    this.alpha = hl
                    val s = 0.97f + 0.03f * hl
                    scaleX = s; scaleY = s
                }
                .background(Ink.Paper, RoundedCornerShape(14.dp))
                .border(1.5.dp, Ink.Graphite, RoundedCornerShape(14.dp)),
        )
        Column(Modifier.padding(horizontal = 14.dp)) {
            Row(Modifier.padding(vertical = 18.dp), verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    BasicText(
                        deck.name + if (last) "." else ",",
                        style = Type.display.copy(
                            fontSize = 28.sp, lineHeight = 1.05.em, letterSpacing = (-0.02).em,
                            hyphens = Hyphens.Auto, lineBreak = LineBreak.Paragraph, localeList = ru,
                        ),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    BasicText(meta, style = Type.mono.copy(color = Ink.Soft), maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Box(Modifier.width(56.dp), contentAlignment = Alignment.TopEnd) {
                    if (deck.due > 0) {
                        BasicText(
                            deck.due.toString(),
                            style = Type.mono.copy(fontSize = 22.sp, lineHeight = 30.sp, color = numColor),
                        )
                    } else {
                        SelfDrawingCheck(stringResource(R.string.home_deck_done_a11y), Modifier.padding(top = 0.dp))
                    }
                }
            }
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .graphicsLayer { this.alpha = divider }
                    .background(Ink.Rule),
            )
        }
    }
}

/** The zone under the list: the pointing cat while nothing is picked, then the review action slides up. */
@Composable
private fun ActionZone(
    idle: Boolean,
    deck: Deck?,
    extraN: Int,
    extraKindRes: Int,
    onCycleN: () -> Unit,
    onCycleKind: () -> Unit,
    onReview: () -> Unit,
    onExtra: () -> Unit,
) {
    val picked = deck != null
    // Keep the last picked deck so the action can slide out with its own label.
    var shown by remember { mutableStateOf(deck) }
    if (deck != null) shown = deck
    val idleAlpha by animateFloatAsState(if (picked || !idle) 0f else 1f, tween(300), label = "idle")
    val act by animateFloatAsState(if (picked) 1f else 0f, tween(420, easing = EchoEase), label = "act")
    val actAlpha by animateFloatAsState(if (picked) 1f else 0f, tween(280), label = "actA")
    val rise = with(LocalDensity.current) { 30.dp.toPx() }

    Box(Modifier.fillMaxWidth().height(132.dp)) {
        Column(
            Modifier.align(Alignment.Center).graphicsLayer { alpha = idleAlpha },
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            PointingCat()
            BasicText(stringResource(R.string.home_pick_first), style = Type.hand.copy(fontSize = 24.sp))
        }
        val d = shown
        if (d != null && (picked || actAlpha > 0.01f)) {
            Column(
                Modifier
                    .align(Alignment.BottomCenter)
                    .padding(start = 24.dp, end = 24.dp, bottom = 12.dp)
                    .graphicsLayer {
                        alpha = actAlpha
                        translationY = (1f - act) * rise
                    },
            ) {
                if (d.due > 0) {
                    PrimaryAction(
                        stringResource(R.string.home_review_today),
                        stringResource(R.string.home_count_arrow, d.due),
                        onClick = { if (picked) onReview() },
                    )
                } else {
                    ExtraSentence(extraN, stringResource(extraKindRes), onCycleN, onCycleKind)
                    Spacer(Modifier.height(10.dp))
                    PrimaryAction(
                        stringResource(R.string.home_review_extra),
                        stringResource(R.string.home_count_arrow, extraN),
                        onClick = { if (picked) onExtra() },
                    )
                }
            }
        }
    }
}

/** "Ещё 20 сложных из этой колоды." — the number and the kind are words you tap to change. */
@Composable
private fun ExtraSentence(n: Int, kind: String, onCycleN: () -> Unit, onCycleKind: () -> Unit) {
    val link = TextLinkStyles(SpanStyle(color = Ink.Graphite))
    val prefix = stringResource(R.string.home_extra_prefix) + " "
    val nText = n.toString()
    val text = buildAnnotatedString {
        append(prefix)
        withLink(LinkAnnotation.Clickable("n", link) { onCycleN() }) { append(nText) }
        append(" ")
        withLink(LinkAnnotation.Clickable("kind", link) { onCycleKind() }) { append(kind) }
        append(" "); append(stringResource(R.string.home_extra_suffix))
    }
    val nStart = prefix.length
    val kStart = nStart + nText.length + 1
    var layout by remember { mutableStateOf<androidx.compose.ui.text.TextLayoutResult?>(null) }
    // Dotted underline, 1.5 dp thick, 5 dp below the baseline: these words are switches, not links.
    BasicText(
        text,
        Modifier.drawBehind {
            val l = layout ?: return@drawBehind
            val dot = 1.5.dp.toPx()
            val effect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(0.01f, dot * 2.2f))
            for ((s, e) in listOf(nStart to nStart + nText.length, kStart to kStart + kind.length)) {
                for (r in com.evgarct.echo.ui.rangeLineRects(l, s, e)) {
                    val y = l.getLineBaseline(l.getLineForOffset(s.coerceAtLeast(0))).let { base ->
                        if (r.top <= base && base <= r.bottom) base else r.bottom - 6.dp.toPx()
                    } + 5.dp.toPx()
                    drawLine(Ink.Graphite, Offset(r.left, y), Offset(r.right, y), dot, cap = androidx.compose.ui.graphics.StrokeCap.Round, pathEffect = effect)
                }
            }
        },
        style = Type.body.copy(fontSize = 20.sp, lineHeight = 31.sp, letterSpacing = (-0.01).em, color = Ink.Soft),
        onTextLayout = { layout = it },
    )
}

@Composable
private fun BottomNav(moreOpen: Boolean, onSoon: () -> Unit, onMore: () -> Unit) {
    val ctx = LocalContext.current
    Row(
        Modifier
            .padding(horizontal = 12.dp)
            .fillMaxWidth()
            .height(64.dp)
            .drawBehind { drawLine(Ink.Rule, Offset.Zero, Offset(size.width, 0f), 1.dp.toPx()) }
            .semantics { contentDescription = ctx.getString(R.string.nav_sections) },
        verticalAlignment = Alignment.CenterVertically,
    ) {
        NavItem(stringResource(R.string.nav_decks), current = !moreOpen) {}
        NavItem(stringResource(R.string.nav_stats), current = false, onClick = onSoon)
        NavItem(stringResource(R.string.nav_more), current = moreOpen, onClick = onMore)
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
                    drawLine(Ink.Leaf, Offset(0f, y), Offset(size.width, y), 2.dp.toPx())
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
