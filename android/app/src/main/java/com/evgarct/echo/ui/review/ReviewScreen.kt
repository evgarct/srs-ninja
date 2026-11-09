package com.evgarct.echo.ui.review

import android.content.Context
import android.view.HapticFeedbackConstants
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.FastOutLinearInEasing
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.evgarct.echo.R
import com.evgarct.echo.data.Card
import com.evgarct.echo.data.Deck
import com.evgarct.echo.data.Grade
import com.evgarct.echo.data.SessionKind
import com.evgarct.echo.data.SessionResult
import com.evgarct.echo.data.gradeForDrag
import com.evgarct.echo.data.RequeuePolicy
import com.evgarct.echo.data.ReviewSessionData
import com.evgarct.echo.ui.LocalSpeaker
import com.evgarct.echo.ui.Remote
import com.evgarct.echo.ui.PrimaryAction
import com.evgarct.echo.ui.TextAction
import com.evgarct.echo.ui.art.Art
import com.evgarct.echo.ui.art.SwipeHintCat
import com.evgarct.echo.ui.art.TapPaw
import com.evgarct.echo.ui.art.line
import com.evgarct.echo.ui.pressable
import com.evgarct.echo.ui.riseIn
import com.evgarct.echo.ui.theme.EchoEase
import com.evgarct.echo.ui.theme.FlyOutEase
import com.evgarct.echo.ui.theme.Ink
import com.evgarct.echo.ui.theme.LocalReducedMotion
import com.evgarct.echo.ui.theme.Type
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val CardH = 250.dp
private val SlipH = 354.dp
private val SlipEase = CubicBezierEasing(0.2f, 0.9f, 0.2f, 1f)

private enum class Face { Recall, Reveal }

private const val PREFS = "echo"
private const val KEY_SWIPES = "successful_swipes"

@Composable
fun ReviewScreen(
    deck: Deck,
    cards: Remote<ReviewSessionData>,
    kind: SessionKind,
    onRetry: () -> Unit,
    onGraded: (Card, Grade, Long) -> Unit,
    onClose: () -> Unit,
    onFinish: (SessionResult) -> Unit,
) {
    val ready = (cards as? Remote.Ready)?.value
    if (ready != null && ready.cards.isNotEmpty()) {
        ReviewSession(deck, ready.cards, ready.requeue, kind, onGraded, onClose, onFinish)
        return
    }
    BackHandler(onBack = onClose)
    val top = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    Box(Modifier.fillMaxSize().background(Ink.Ground)) {
        Row(Modifier.padding(top = top + 4.dp, start = 8.dp).height(48.dp), verticalAlignment = Alignment.CenterVertically) {
            TextAction(stringResource(R.string.review_close), onClose)
        }
        Column(
            Modifier.padding(top = top + 204.dp, start = 24.dp, end = 24.dp).fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            when (cards) {
                Remote.Loading -> {
                    // A blank sheet breathes while the deck is shuffled on the server.
                    val inf = rememberInfiniteTransition(label = "loading")
                    val breath by inf.animateFloat(0.45f, 1f, infiniteRepeatable(tween(900), RepeatMode.Reverse), label = "b")
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height(CardH)
                            .graphicsLayer { alpha = breath }
                            .background(Ink.Paper, RoundedCornerShape(18.dp))
                            .border(1.5.dp, Ink.Rule, RoundedCornerShape(18.dp)),
                    )
                    BasicText(stringResource(R.string.review_loading), style = Type.hand.copy(fontSize = 24.sp))
                }
                is Remote.Failed -> {
                    BasicText(stringResource(R.string.review_load_error), style = Type.hand.copy(fontSize = 26.sp))
                    PrimaryAction(stringResource(R.string.home_retry), trailing = null, onClick = onRetry)
                }
                is Remote.Ready -> {
                    BasicText(
                        stringResource(R.string.review_empty_line1) + "\n" + stringResource(R.string.review_empty_line2),
                        Modifier.riseIn(durationMs = 420, distance = 8.dp),
                        style = Type.display.copy(fontSize = 36.sp, lineHeight = 1.05.em, letterSpacing = (-0.025).em),
                    )
                    PrimaryAction(stringResource(R.string.review_back), trailing = null, onClick = onClose)
                }
            }
        }
    }
}

@Composable
private fun ReviewSession(
    deck: Deck,
    cards: List<Card>,
    requeue: RequeuePolicy,
    kind: SessionKind,
    onGraded: (Card, Grade, Long) -> Unit,
    onClose: () -> Unit,
    onFinish: (SessionResult) -> Unit,
) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE) }
    val density = LocalDensity.current
    val view = LocalView.current
    val speaker = LocalSpeaker.current
    val scope = rememberCoroutineScope()
    val soon = stringResource(R.string.next_iteration)

    // The session queue: the head is on top; Again/Hard go back in where the web policy puts them.
    val queue = remember { mutableStateListOf<Card>().apply { addAll(cards) } }
    // Bumps every time a new card lands on top (including a requeued one), keying per-card effects.
    var turn by remember { mutableIntStateOf(0) }
    var face by remember { mutableStateOf(Face.Recall) }
    var detail by remember { mutableStateOf(false) }
    var dragging by remember { mutableStateOf(false) }
    var leaving by remember { mutableStateOf(false) }
    var playing by remember { mutableStateOf(false) }
    var hintReady by remember { mutableStateOf(false) }
    var dragGrade by remember { mutableStateOf<Grade?>(null) }
    val grades = remember { mutableStateListOf<Grade>() }
    var startedAt by remember { mutableStateOf(System.currentTimeMillis()) }
    var totalSwipes by remember { mutableIntStateOf(prefs.getInt(KEY_SWIPES, 0)) }

    val dx = remember { Animatable(0f) }
    val dy = remember { Animatable(0f) }
    val flip = remember { Animatable(0f) }
    val shift = remember { Animatable(0f) }

    val n = cards.size
    val done = queue.isEmpty()
    val card = queue.firstOrNull()
    val reveal = face == Face.Reveal
    // Cards that have left the session for good; a requeued card still counts as remaining.
    val finished = n - queue.size

    fun say(c: Card) {
        val url = c.audioUrl ?: return
        playing = true
        val started = System.currentTimeMillis()
        speaker.play(url) {
            val left = 1200 - (System.currentTimeMillis() - started)
            scope.launch { if (left > 0) delay(left); playing = false }
        }
    }

    // When the card landed on top: the grade's duration is measured from here.
    var shownAt by remember { mutableStateOf(System.currentTimeMillis()) }
    // Web autoplay rule: recognition plays when the card appears, production when the answer is
    // revealed (its Russian front never plays), and only cards with a recording play at all.
    LaunchedEffect(turn) {
        shownAt = System.currentTimeMillis()
        val c = queue.firstOrNull() ?: return@LaunchedEffect
        if (!c.production) {
            delay(if (turn == 0) 420 else 60)
            say(c)
        }
    }
    LaunchedEffect(turn, face) {
        val c = queue.firstOrNull() ?: return@LaunchedEffect
        if (face == Face.Reveal && c.production) {
            delay(200)
            say(c)
        }
    }
    // Swipe hint: 1.2 s after the flip, restarted on every card.
    LaunchedEffect(turn, face) {
        hintReady = false
        if (face == Face.Reveal) { delay(1200); hintReady = true }
    }

    fun doFlip() {
        if (reveal || flip.isRunning || done) return
        scope.launch {
            flip.animateTo(90f, tween(150, easing = FastOutLinearInEasing))
            face = Face.Reveal
            flip.snapTo(-90f)
            flip.animateTo(0f, tween(190, easing = LinearOutSlowInEasing))
        }
    }

    fun grade(g: Grade, bySwipe: Boolean) {
        if (leaving || done) return
        leaving = true
        dragging = false
        detail = false
        hintReady = false
        grades += g
        queue.firstOrNull()?.let { onGraded(it, g, System.currentTimeMillis() - shownAt) }
        if (bySwipe) {
            totalSwipes += 1
            prefs.edit().putInt(KEY_SWIPES, totalSwipes).apply()
        }
        view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
        val dir = if (g == Grade.Again || g == Grade.Hard) -1f else 1f
        val fly = with(density) { 560.dp.toPx() } * dir
        val up = with(density) { (-20).dp.toPx() }
        scope.launch {
            launch { dx.animateTo(fly, tween(420, easing = FlyOutEase)) }
            launch { dy.animateTo(up, tween(420, easing = FlyOutEase)) }
            launch { delay(140); shift.animateTo(1f, tween(340, easing = EchoEase)) }
            delay(480)
            dragGrade = null
            dx.snapTo(0f); dy.snapTo(0f); flip.snapTo(0f)
            face = Face.Recall
            val current = queue.removeAt(0)
            requeue.insertIndex(queue.size, g)?.let { at -> queue.add(at.coerceIn(0, queue.size), current) }
            turn += 1
            shift.snapTo(0f)
            leaving = false
        }
    }

    BackHandler(onBack = onClose)

    val top = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val bottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    BoxWithConstraints(Modifier.fillMaxSize().background(Ink.Ground)) {
        val cardW = maxWidth - 40.dp
        val cardTop = top + 124.dp
        val footerTop = maxHeight - bottom - 64.dp
        // The canvas drew the slip at 354; on a taller phone it may use the whole runway so nothing scrolls away.
        val slipMax = maxOf(SlipH, footerTop - (cardTop + CardH) - 12.dp)

        // Top bar
        Row(
            Modifier.padding(top = top + 4.dp, start = 8.dp, end = 8.dp).fillMaxWidth().height(48.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            TextAction(stringResource(R.string.review_close), onClose)
            BasicText(
                buildAnnotatedString {
                    withStyle(SpanStyle(color = Ink.Graphite)) { append("${minOf(finished + 1, n)}") }
                    append(" / $n")
                },
                style = Type.mono.copy(fontSize = 13.sp, color = Ink.Soft),
            )
            TextAction(stringResource(R.string.review_more), { Toast.makeText(context, soon, Toast.LENGTH_SHORT).show() })
        }
        val progress by animateFloatAsState(finished / n.toFloat(), tween(500, easing = EchoEase), label = "progress")
        Box(
            Modifier
                .padding(top = top + 60.dp, start = 20.dp, end = 20.dp)
                .fillMaxWidth()
                .height(1.dp)
                .background(Ink.Rule)
                .drawBehind { drawRect(Ink.Leaf, size = size.copy(width = size.width * progress)) },
        )

        // Grade scale: appears while the card is being dragged.
        val scaleAlpha by animateFloatAsState(if (dragging) 1f else 0f, tween(200), label = "scale")
        Row(
            Modifier
                .padding(top = top + 70.dp, start = 51.dp, end = 51.dp)
                .fillMaxWidth()
                .height(22.dp)
                .graphicsLayer { alpha = scaleAlpha },
        ) {
            listOf(Grade.Again to R.string.grade_again, Grade.Hard to R.string.grade_hard, Grade.Good to R.string.grade_good, Grade.Easy to R.string.grade_easy)
                .forEach { (g, res) ->
                    val c by animateColorAsState(if (dragGrade == g) Ink.Leaf else Ink.Idle, tween(120), label = "lbl")
                    BasicText(
                        stringResource(res),
                        Modifier.weight(1f),
                        style = Type.mono.copy(fontSize = 11.5.sp, color = c, textAlign = androidx.compose.ui.text.style.TextAlign.Center),
                        maxLines = 1,
                    )
                }
        }

        if (!done && card != null) {
            // Back of the stack: layers step back 11 dp per side and 12 dp up; it thins out near the end.
            val behind = queue.size - 1
            val lift = with(density) { (kotlin.math.abs(dx.value) / 160.dp.toPx()).coerceAtMost(1f) } * if (dragging) 4f else 0f
            for (d in 3 downTo 1) {
                val depth = d - shift.value
                val visible = d <= behind
                val a by animateFloatAsState(if (visible) 1f else 0f, tween(300), label = "layer$d")
                val alpha = a * (3f - depth).coerceIn(0f, 1f)
                if (alpha > 0.01f) {
                    val inset = (11f * depth).dp
                    val y = cardTop - (12f * depth).dp - if (d == 1) lift.dp else 0.dp
                    Box(
                        Modifier
                            .offset(x = 20.dp + inset, y = y)
                            .width(cardW - inset * 2)
                            .height(CardH)
                            .graphicsLayer { this.alpha = alpha }
                            .background(listOf(Ink.Stack1, Ink.Stack2, Ink.Stack3)[d - 1], RoundedCornerShape(18.dp))
                            .border(1.5.dp, Ink.Graphite, RoundedCornerShape(18.dp)),
                    )
                }
            }

            // Card and its slip move as one object.
            val px = { v: Float -> with(density) { v.toDp().value } }
            Box(
                Modifier
                    .offset(x = 20.dp, y = cardTop)
                    .width(cardW)
                    .height(CardH)
                    .graphicsLayer {
                        translationX = dx.value
                        translationY = dy.value
                        rotationZ = px(dx.value) / 24f
                        transformOrigin = TransformOrigin(0.5f, 0.9f)
                        alpha = if (shift.value > 0f) 1f - (shift.value * 4f).coerceAtMost(1f) else 1f
                    }
                    .pointerInput(reveal, leaving) {
                        if (!reveal || leaving) return@pointerInput
                        var rawX = 0f
                        var rawY = 0f
                        detectDragGestures(
                            onDragStart = { rawX = 0f; rawY = 0f; dragging = true },
                            onDragEnd = {
                                val g = gradeForDrag(rawX / density.density)
                                if (g != null) grade(g, bySwipe = true) else {
                                    dragging = false
                                    dragGrade = null
                                    val yDp = rawY / density.density
                                    if (yDp < -50f) detail = true
                                    if (yDp > 50f) detail = false
                                    scope.launch { dx.animateTo(0f, tween(380, easing = EchoEase)) }
                                    scope.launch { dy.animateTo(0f, tween(380, easing = EchoEase)) }
                                }
                            },
                            onDragCancel = {
                                dragging = false
                                dragGrade = null
                                scope.launch { dx.animateTo(0f, tween(380, easing = EchoEase)) }
                                scope.launch { dy.animateTo(0f, tween(380, easing = EchoEase)) }
                            },
                        ) { change, amount ->
                            change.consume()
                            rawX += amount.x
                            rawY += amount.y
                            val limit = 40.dp.toPx()
                            scope.launch { dx.snapTo(rawX) }
                            scope.launch { dy.snapTo((rawY * 0.25f).coerceIn(-limit, limit)) }
                            val g = gradeForDrag(rawX / density.density)
                            if (g != dragGrade) {
                                dragGrade = g
                                view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                            }
                        }
                    },
            ) {
                Slip(card, open = reveal && detail, maxHeight = slipMax, onClose = { detail = false })
                CardFace(
                    card = card,
                    idx = turn,
                    face = face,
                    flipDeg = flip.value,
                    leaning = dragGrade == Grade.Good || dragGrade == Grade.Easy,
                    playing = playing,
                    onFlip = ::doFlip,
                    onAudio = { say(card) },
                )
                AnimatedVisibility(
                    visible = reveal && !detail && !leaving,
                    modifier = Modifier.align(Alignment.BottomCenter).offset(y = 48.dp),
                    enter = fadeIn(tween(300)),
                    exit = fadeOut(tween(150)),
                ) {
                    Box(
                        Modifier.size(48.dp, 44.dp).clickable(
                            remember { MutableInteractionSource() }, null,
                            onClickLabel = stringResource(R.string.review_open_sheet_a11y),
                        ) { detail = true },
                        contentAlignment = Alignment.Center,
                    ) {
                        Art(22f, 14f, Modifier.size(22.dp, 14.dp)) {
                            line("M3 3 C 7 7, 9 9, 11 11 C 14 8, 16 6, 19 3", Ink.Soft, 2f)
                        }
                    }
                }
            }

            // Swipe hint in the empty runway between the card and the footer.
            val showHint = reveal && !detail && hintReady && grades.size < 3 && totalSwipes < 10 && !leaving && !dragging
            AnimatedVisibility(
                visible = showHint,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = bottom + 64.dp + 56.dp)
                    .graphicsLayer { scaleX = .85f; scaleY = .85f },
                enter = fadeIn(tween(300)),
                exit = fadeOut(tween(200)),
            ) {
                SwipeHintCat(stringResource(R.string.review_swipe_hint_a11y), Modifier.graphicsLayer { alpha = .35f })
            }
        } else {
            EndOfDeck(
                modifier = Modifier.padding(top = top + 204.dp, start = 24.dp, end = 24.dp),
                onResults = {
                    onFinish(SessionResult(deck.id, deck.name, kind, grades.toList(), System.currentTimeMillis() - startedAt))
                },
                onAgain = {
                    grades.clear()
                    startedAt = System.currentTimeMillis()
                    face = Face.Recall
                    queue.clear()
                    queue.addAll(cards)
                    turn += 1
                },
            )
        }

        Footer(
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = bottom),
            reveal = reveal && !done,
            showAnswer = !reveal && !done,
            active = dragGrade,
            onShow = ::doFlip,
            onGrade = { grade(it, bySwipe = false) },
        )
    }
}

@Composable
private fun CardFace(
    card: Card,
    idx: Int,
    face: Face,
    flipDeg: Float,
    leaning: Boolean,
    playing: Boolean,
    onFlip: () -> Unit,
    onAudio: () -> Unit,
) {
    val border by animateColorAsState(if (leaning) Ink.Leaf else Ink.Graphite, tween(150), label = "border")
    val flipLabel = stringResource(R.string.review_flip_a11y)
    val density = LocalDensity.current
    Box(
        Modifier
            .fillMaxSize()
            .graphicsLayer {
                rotationY = flipDeg
                cameraDistance = 14f * density.density
            }
            .background(Ink.Paper, RoundedCornerShape(18.dp))
            .border(1.5.dp, border, RoundedCornerShape(18.dp))
            .then(
                if (face == Face.Recall) Modifier.clickable(
                    remember { MutableInteractionSource() }, null, role = Role.Button, onClickLabel = flipLabel, onClick = onFlip,
                ) else Modifier,
            ),
    ) {
        Column(
            Modifier.fillMaxSize().padding(start = 26.dp, top = 26.dp, end = 16.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            // Phrase: up to 3 lines, sized to its real width 32 → 24 sp, then ellipsis.
            androidx.compose.runtime.key(idx) {
                BasicText(
                    card.text,
                    Modifier.fillMaxWidth().riseIn(durationMs = 260, distance = 8.dp),
                    style = Type.display.copy(fontSize = 32.sp, lineHeight = 1.08.em, letterSpacing = (-0.025).em),
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                    autoSize = TextAutoSize.StepBased(24.sp, 32.sp, 1.sp),
                )
            }
            Row(verticalAlignment = Alignment.Bottom) {
                Box(Modifier.weight(1f)) {
                    if (face == Face.Reveal) {
                        // Translation: pinned to the bottom, grows upward, 19 → 17 sp, max 3 lines.
                        BasicText(
                            card.translation,
                            Modifier.padding(bottom = 10.dp).riseIn(durationMs = 300, distance = 8.dp),
                            style = Type.body.copy(fontSize = 19.sp, lineHeight = 1.3.em, color = Ink.Soft),
                            maxLines = 3,
                            overflow = TextOverflow.Ellipsis,
                            autoSize = TextAutoSize.StepBased(17.sp, 19.sp, 1.sp),
                        )
                    } else {
                        TapPaw(Modifier.padding(bottom = 4.dp))
                    }
                }
                Spacer(Modifier.width(60.dp))
            }
        }
        // Like the web: a speaker only when the note has a recording, and on a production card only
        // once the target-language answer is visible.
        if (card.audioUrl != null && (face == Face.Reveal || !card.production)) {
            AudioButton(playing, onAudio, Modifier.align(Alignment.BottomEnd).padding(end = 16.dp, bottom = 16.dp))
        }
    }
}

@Composable
private fun AudioButton(playing: Boolean, onClick: () -> Unit, modifier: Modifier) {
    val label = stringResource(R.string.review_audio_a11y)
    val bg by animateColorAsState(if (playing) Ink.Leaf else Color.Transparent, tween(200), label = "abg")
    val ink by animateColorAsState(if (playing) Ink.Paper else Ink.Graphite, tween(200), label = "aink")
    val reduced = LocalReducedMotion.current
    val inf = rememberInfiniteTransition(label = "rings")
    val r1 by inf.animateFloat(0f, 1f, infiniteRepeatable(tween(1200, easing = LinearOutSlowInEasing)), label = "r1")
    val wave by inf.animateFloat(.25f, 1f, infiniteRepeatable(tween(400), RepeatMode.Reverse), label = "wave")
    Box(
        modifier
            .size(48.dp)
            .pressable(onClick, 0.94f, label = label)
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        if (playing && !reduced) {
            for (offset in listOf(0f, 0.5f)) {
                val p = (r1 + offset) % 1f
                Box(
                    Modifier
                        .size(40.dp)
                        .graphicsLayer { scaleX = 1f + p; scaleY = 1f + p; alpha = 0.55f * (1f - p) }
                        .border(1.5.dp, Ink.Leaf, CircleShape),
                )
            }
        }
        Box(
            Modifier
                .size(40.dp)
                .background(bg, CircleShape)
                .border(1.dp, if (playing) Ink.Leaf else Ink.Graphite, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Art(18f, 18f, Modifier.size(18.dp)) {
                line("M3 7h2.5L9 4v10l-3.5-3H3z", ink, 1.3f)
                line("M11.5 6.5a3.5 3.5 0 010 5", ink, 1.3f, if (playing) wave else 1f)
                line("M13.5 4.5a6.4 6.4 0 010 9", ink, 1.3f, if (playing) 1.25f - wave else 1f)
            }
        }
    }
}

/** The slip under the card: examples with the studied phrase on a pale-green wash, near expressions, metadata. */
@Composable
private fun Slip(card: Card, open: Boolean, maxHeight: Dp, onClose: () -> Unit) {
    val inner by animateFloatAsState(if (open) 1f else 0f, tween(260, delayMillis = if (open) 120 else 0), label = "slipInner")
    val shape = RoundedCornerShape(bottomStart = 14.dp, bottomEnd = 14.dp)
    // The slip is as tall as its content, never taller than the runway above the footer.
    AnimatedVisibility(
        visible = open,
        modifier = Modifier.offset(x = 16.dp, y = CardH - 20.dp).fillMaxWidth().padding(end = 32.dp),
        enter = expandVertically(tween(440, easing = SlipEase), expandFrom = Alignment.Top),
        exit = shrinkVertically(tween(300, easing = SlipEase), shrinkTowards = Alignment.Top),
    ) {
    Box(
        Modifier
            .fillMaxWidth()
            .heightIn(max = maxHeight)
            .background(Ink.Paper, shape)
            .drawBehind {
                val w = 1.dp.toPx()
                val r = 14.dp.toPx()
                drawLine(Ink.SlipEdge, Offset(w / 2, 0f), Offset(w / 2, size.height - r), w)
                drawLine(Ink.SlipEdge, Offset(size.width - w / 2, 0f), Offset(size.width - w / 2, size.height - r), w)
                drawLine(Ink.SlipEdge, Offset(r, size.height - w / 2), Offset(size.width - r, size.height - w / 2), w)
                drawArc(Ink.SlipEdge, 90f, 90f, false, Offset(w / 2, size.height - 2 * r), androidx.compose.ui.geometry.Size(2 * r - w, 2 * r - w), style = Stroke(w))
                drawArc(Ink.SlipEdge, 0f, 90f, false, Offset(size.width - 2 * r + w / 2, size.height - 2 * r), androidx.compose.ui.geometry.Size(2 * r - w, 2 * r - w), style = Stroke(w))
            }
            .pointerInput(Unit) {
                var y = 0f
                detectDragGestures(onDragStart = { y = 0f }, onDragEnd = { if (y > 40.dp.toPx()) onClose() }) { c, a -> c.consume(); y += a.y }
            },
    ) {
        Column(Modifier.fillMaxWidth().padding(top = 40.dp).graphicsLayer { alpha = inner }) {
            Column(
                Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState()).padding(start = 18.dp, end = 22.dp, bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                card.examples.forEachIndexed { i, e ->
                    Row {
                        BasicText("${i + 1}", Modifier.width(28.dp), style = Type.mono.copy(lineHeight = 24.sp))
                        HighlightedExample(e)
                    }
                }
                if (card.synonyms.isNotEmpty()) {
                    Row(Modifier.padding(top = 8.dp)) {
                        BasicText("≈", Modifier.width(28.dp), style = Type.mono.copy(fontSize = 13.sp, lineHeight = 24.sp))
                        BasicText(card.synonyms.joinToString("\n"), style = Type.body.copy(lineHeight = 24.sp, color = Ink.Soft))
                    }
                }
            }
            Row(
                Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .drawBehind {
                        drawLine(
                            Ink.Dash, Offset.Zero, Offset(size.width, 0f), 1.dp.toPx(),
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(3.dp.toPx(), 3.dp.toPx())),
                        )
                    }
                    .clickable(remember { MutableInteractionSource() }, null, onClickLabel = stringResource(R.string.review_close_sheet_a11y), onClick = onClose)
                    .padding(start = 46.dp, end = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                BasicText(card.meta, Modifier.weight(1f), style = Type.mono.copy(fontSize = 11.5.sp), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Art(20f, 20f, Modifier.size(20.dp)) { line("M6 12l4-4 4 4", Ink.Soft, 1.5f) }
            }
        }
    }
    }
}

/** The studied phrase sits on a pale-green wash: 3 dp side padding, 1 dp top/bottom, 4 dp corners, split per line. */
@Composable
private fun HighlightedExample(e: com.evgarct.echo.data.Example) {
    var layout by remember { mutableStateOf<androidx.compose.ui.text.TextLayoutResult?>(null) }
    BasicText(
        e.pre + e.hit + e.post,
        Modifier.drawBehind {
            val l = layout ?: return@drawBehind
            val padX = 3.dp.toPx()
            val r = 4.dp.toPx()
            for (rect in com.evgarct.echo.ui.rangeLineRects(l, e.pre.length, e.pre.length + e.hit.length)) {
                val mid = rect.center.y
                val half = 11.dp.toPx() // 22 dp tall wash centred on a 24 dp line
                drawRoundRect(
                    Ink.LeafWash,
                    Offset(rect.left - padX, mid - half),
                    androidx.compose.ui.geometry.Size(rect.width + padX * 2, half * 2),
                    androidx.compose.ui.geometry.CornerRadius(r, r),
                )
            }
        },
        style = Type.body.copy(lineHeight = 24.sp),
        onTextLayout = { layout = it },
    )
}

@Composable
private fun Footer(
    modifier: Modifier,
    reveal: Boolean,
    showAnswer: Boolean,
    active: Grade?,
    onShow: () -> Unit,
    onGrade: (Grade) -> Unit,
) {
    val gradesA by animateFloatAsState(if (reveal) 1f else 0f, tween(260), label = "gradesA")
    val gradesY by animateFloatAsState(if (reveal) 0f else 14f, tween(320, easing = EchoEase), label = "gradesY")
    val showA by animateFloatAsState(if (showAnswer) 1f else 0f, tween(200), label = "showA")
    val density = LocalDensity.current
    Box(
        modifier
            .padding(horizontal = 12.dp)
            .fillMaxWidth()
            .height(64.dp)
            .drawBehind { drawLine(Ink.Rule, Offset.Zero, Offset(size.width, 0f), 1.dp.toPx(), cap = StrokeCap.Butt) },
    ) {
        if (gradesA > 0.01f) {
            Row(Modifier.fillMaxSize().graphicsLayer { alpha = gradesA; translationY = gradesY * density.density }) {
                listOf(Grade.Again to R.string.grade_again, Grade.Hard to R.string.grade_hard, Grade.Good to R.string.grade_good, Grade.Easy to R.string.grade_easy)
                    .forEach { (g, res) ->
                        val c by animateColorAsState(if (active == g) Ink.Leaf else Ink.Graphite, tween(120), label = "g")
                        Box(Modifier.weight(1f).fillMaxSize().pressable({ if (reveal) onGrade(g) }, 0.94f), contentAlignment = Alignment.Center) {
                            BasicText(stringResource(res), style = Type.body.copy(fontSize = 15.sp, fontWeight = FontWeight.Medium, color = c), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
            }
        }
        if (showA > 0.01f) {
            Box(Modifier.fillMaxSize().graphicsLayer { alpha = showA }, contentAlignment = Alignment.Center) {
                TextAction(
                    stringResource(R.string.review_show_answer),
                    { if (showAnswer) onShow() },
                    style = Type.body.copy(fontSize = 15.sp, fontWeight = FontWeight.Medium),
                )
            }
        }
    }
}

@Composable
private fun EndOfDeck(modifier: Modifier, onResults: () -> Unit, onAgain: () -> Unit) {
    val reduced = LocalReducedMotion.current
    val inf = rememberInfiniteTransition(label = "nudge")
    val nudge by inf.animateFloat(0f, 5f, infiniteRepeatable(tween(600), RepeatMode.Reverse), label = "n")
    Column(modifier.fillMaxWidth().riseIn(durationMs = 420, distance = 8.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        BasicText(
            stringResource(R.string.review_last_line1) + "\n" + stringResource(R.string.review_last_line2),
            style = Type.display.copy(fontSize = 36.sp, lineHeight = 1.05.em, letterSpacing = (-0.025).em),
        )
        Box {
            PrimaryAction(stringResource(R.string.review_results), trailing = " ", onClick = onResults)
            BasicText(
                "→",
                Modifier.align(Alignment.CenterEnd).padding(end = 20.dp).graphicsLayer { translationX = if (reduced) 0f else nudge * density },
                style = Type.body.copy(color = Ink.LeafLight),
            )
        }
        TextAction(stringResource(R.string.review_again), onAgain, Modifier.offset(x = (-12).dp))
    }
}
