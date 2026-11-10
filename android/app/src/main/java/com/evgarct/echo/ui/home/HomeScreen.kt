package com.evgarct.echo.ui.home

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.SizeTransform
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
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.text.style.Hyphens
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.evgarct.echo.R
import com.evgarct.echo.data.Deck
import com.evgarct.echo.ui.BottomNav
import com.evgarct.echo.ui.PrimaryAction
import com.evgarct.echo.ui.Remote
import com.evgarct.echo.ui.Section
import com.evgarct.echo.ui.SwitchSentence
import com.evgarct.echo.ui.TextAction
import com.evgarct.echo.ui.TitleLine
import com.evgarct.echo.ui.Word
import com.evgarct.echo.ui.currentLocale
import com.evgarct.echo.ui.art.SelfDrawingCheck
import com.evgarct.echo.ui.art.SittingCat
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

/** The top-level screen: the deck list or the "Ещё" page above the shared bottom navigation. */
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
    var extraN by rememberSaveable { mutableIntStateOf(0) }
    var extraKind by rememberSaveable { mutableIntStateOf(0) }
    var more by rememberSaveable { mutableStateOf(false) }
    val context = LocalContext.current
    val soonText = stringResource(R.string.next_iteration)
    val soon = { Toast.makeText(context, soonText, Toast.LENGTH_SHORT).show() }

    BackHandler(enabled = more) { more = false }

    Box(Modifier.fillMaxSize().background(Ink.Ground)) {
        // The cat sits on the real top edge of the screen. Its body is lowered so only its two
        // sides pass behind the system icons; the belly, paws and tail hang below the status bar.
        val statusBar = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
        val drop = (statusBar - 8.dp).coerceAtLeast(0.dp)
        val catAlpha by animateFloatAsState(if (more) 0f else 1f, tween(220), label = "cat")
        SittingCat(
            stringResource(R.string.home_cat_a11y),
            Modifier.align(Alignment.TopEnd).padding(end = 22.dp).offset(y = drop).graphicsLayer { alpha = catAlpha },
            extendUp = drop,
        )

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
            AnimatedContent(
                targetState = more,
                modifier = Modifier.weight(1f).fillMaxWidth(),
                transitionSpec = { fadeIn(tween(240, 80)) togetherWith fadeOut(tween(140)) },
                label = "section",
            ) { showMore ->
                if (showMore) {
                    MoreScreen(
                        drafts = list.sumOf { it.drafts },
                        email = email,
                        onSoon = soon,
                        onSignOut = onSignOut,
                    )
                } else {
                    Decks(
                        decks = decks,
                        selectedId = selectedId,
                        onSelect = { selectedId = it },
                        extraN = ExtraCounts[extraN],
                        extraKindRes = ExtraKinds[extraKind],
                        onCycleN = { extraN = (extraN + 1) % ExtraCounts.size },
                        onCycleKind = { extraKind = (extraKind + 1) % ExtraKinds.size },
                        onRetry = onRetry,
                        onReview = onReview,
                        onExtra = { onExtra(it, ExtraCounts[extraN], ExtraKinds[extraKind]) },
                    )
                }
            }
            BottomNav(
                current = if (more) Section.More else Section.Decks,
                onSelect = {
                    when (it) {
                        Section.Decks -> more = false
                        Section.More -> more = true
                        Section.Stats -> soon()
                    }
                },
            )
        }
    }
}

@Composable
private fun Decks(
    decks: Remote<List<Deck>>,
    selectedId: String?,
    onSelect: (String?) -> Unit,
    extraN: Int,
    extraKindRes: Int,
    onCycleN: () -> Unit,
    onCycleKind: () -> Unit,
    onRetry: () -> Unit,
    onReview: (Deck) -> Unit,
    onExtra: (Deck) -> Unit,
) {
    val list = (decks as? Remote.Ready)?.value.orEmpty()
    val selected = list.firstOrNull { it.id == selectedId }
    val haptics = LocalHapticFeedback.current
    val group = stringResource(R.string.home_deck_group)

    Column(Modifier.fillMaxSize()) {
        Spacer(Modifier.height(38.dp))
        Column(Modifier.padding(horizontal = 24.dp).riseIn()) {
            BasicText(todayLabel(), style = Type.mono)
            Spacer(Modifier.height(10.dp))
            HomeTitle(decks, selected)
        }
        Spacer(Modifier.height(26.dp))

        // Deck list: scrolls in its own area, the action zone below stays put.
        Column(
            Modifier
                .weight(1f)
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 10.dp)
                .riseIn(delayMs = 80)
                .selectableGroup()
                .semantics { contentDescription = group },
        ) {
            when (decks) {
                Remote.Loading -> ListNote(stringResource(R.string.home_loading))
                is Remote.Failed -> {
                    ListNote(stringResource(R.string.home_error))
                    TextAction(stringResource(R.string.home_retry), onRetry, Modifier.padding(start = 2.dp))
                }
                is Remote.Ready -> if (list.isEmpty()) ListNote(stringResource(R.string.home_empty_hint))
            }
            list.forEachIndexed { i, deck ->
                DeckRow(
                    deck = deck,
                    last = i == list.lastIndex,
                    selected = deck.id == selectedId,
                    dimmed = selectedId != null && deck.id != selectedId,
                    onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
                        onSelect(if (selectedId == deck.id) null else deck.id)
                    },
                )
            }
            Spacer(Modifier.height(12.dp))
        }

        ActionZone(
            idle = decks is Remote.Ready && list.isNotEmpty(),
            deck = selected,
            extraN = extraN,
            extraKindRes = extraKindRes,
            onCycleN = onCycleN,
            onCycleKind = onCycleKind,
            onReview = { selected?.let(onReview) },
            onExtra = { selected?.let(onExtra) },
        )
    }
}

@Composable
private fun ListNote(text: String) {
    BasicText(text, Modifier.padding(horizontal = 14.dp, vertical = 18.dp), style = Type.hand.copy(fontSize = 24.sp))
}

@Composable
private fun todayLabel(): String {
    val locale = currentLocale()
    val s = LocalDate.now().format(DateTimeFormatter.ofPattern(stringResource(R.string.date_long), locale))
    return s.replaceFirstChar { it.titlecase(locale) }
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
        selected == null -> pluralStringResource(R.plurals.home_title_idle_line2, totalDue)
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
    onClick: () -> Unit,
) {
    val alpha by animateFloatAsState(if (dimmed) 0.4f else 1f, tween(260), label = "dim")
    val hl by animateFloatAsState(if (selected) 1f else 0f, tween(260), label = "hl")
    val numColor by animateColorAsState(if (selected) Ink.Leaf else Ink.Graphite, tween(260), label = "num")
    val drafts = if (deck.drafts > 0) pluralStringResource(R.plurals.drafts, deck.drafts, deck.drafts) else null
    val meta = listOfNotNull(
        deck.pair,
        drafts,
        if (deck.due == 0) stringResource(R.string.home_deck_done_meta) else null,
    ).joinToString(" · ")
    val ru = LocaleList(currentLocale().toLanguageTag())

    Box(
        Modifier
            .fillMaxWidth()
            .graphicsLayer { this.alpha = alpha }
            .selectable(selected = selected, role = Role.RadioButton, onClick = onClick),
    ) {
        // Selection is a paper layer behind the row, 2 dp inside it: the text never moves.
        Box(
            Modifier
                .matchParentSize()
                .padding(vertical = 2.dp)
                .graphicsLayer { this.alpha = hl }
                .background(Ink.Paper, RoundedCornerShape(14.dp))
                .border(1.5.dp, Ink.Graphite, RoundedCornerShape(14.dp)),
        )
        Row(Modifier.padding(horizontal = 14.dp, vertical = 16.dp), verticalAlignment = Alignment.Top) {
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
            Spacer(Modifier.width(12.dp))
            Box(Modifier.width(56.dp), contentAlignment = Alignment.TopEnd) {
                if (deck.due > 0) {
                    BasicText(
                        deck.due.toString(),
                        style = Type.mono.copy(fontSize = 22.sp, lineHeight = 30.sp, color = numColor),
                    )
                } else {
                    SelfDrawingCheck(stringResource(R.string.home_deck_done_a11y), Modifier.offset(y = (-2).dp))
                }
            }
        }
    }
}

/** The zone under the list: one quiet line while nothing is picked, then the review action slides up. */
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

    Box(Modifier.fillMaxWidth().height(148.dp)) {
        BasicText(
            stringResource(R.string.home_pick_first),
            Modifier.align(Alignment.TopStart).padding(start = 24.dp, end = 24.dp).offset(y = 96.dp).graphicsLayer { alpha = idleAlpha },
            style = Type.mono,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        val d = shown
        if (d != null && (picked || actAlpha > 0.01f)) {
            Column(
                Modifier
                    .align(Alignment.BottomCenter)
                    .padding(start = 24.dp, end = 24.dp, bottom = 14.dp)
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
                    // "Ещё 20 сложных из этой колоды." — the number and the kind are words you tap to change.
                    SwitchSentence(
                        listOf(
                            Word(stringResource(R.string.home_extra_prefix) + " "),
                            Word(extraN.toString(), onCycleN),
                            Word(" "),
                            Word(stringResource(extraKindRes), onCycleKind),
                            Word(" " + stringResource(R.string.home_extra_suffix)),
                        ),
                        Type.body.copy(fontSize = 20.sp, lineHeight = 31.sp, letterSpacing = (-0.01).em, color = Ink.Soft),
                    )
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
