package com.evgarct.echo.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.evgarct.echo.R
import com.evgarct.echo.data.AuthException
import com.evgarct.echo.data.Deck
import com.evgarct.echo.data.ReviewSessionData
import com.evgarct.echo.data.EchoApi
import com.evgarct.echo.data.GradeSync
import com.evgarct.echo.data.SessionKind
import com.evgarct.echo.data.SessionResult
import com.evgarct.echo.ui.done.DoneScreen
import com.evgarct.echo.ui.home.ExtraKindKeys
import com.evgarct.echo.ui.home.HomeScreen
import com.evgarct.echo.ui.login.LoginScreen
import com.evgarct.echo.ui.review.ReviewScreen
import com.evgarct.echo.ui.theme.EchoEase
import com.evgarct.echo.ui.theme.Ink
import kotlinx.coroutines.launch
import java.io.IOException

private sealed interface Screen {
    val order: Int
    data object Login : Screen { override val order = -1 }
    data class Home(val selected: String?, val nonce: Long = System.nanoTime()) : Screen { override val order = 0 }
    data class Review(val deck: Deck, val kind: SessionKind, val extraCount: Int, val extraKindRes: Int, val nonce: Long = System.nanoTime()) : Screen { override val order = 1 }
    data class Done(val result: SessionResult, val deck: Deck) : Screen { override val order = 2 }
}

/** Loading state of a list fetched from the API. */
sealed interface Remote<out T> {
    data object Loading : Remote<Nothing>
    data class Ready<T>(val value: T) : Remote<T>
    data class Failed(val message: String) : Remote<Nothing>
}

/** Iteration 1 flow: sign in → pick a deck → review its cards → summary → back to the decks. */
@Composable
fun EchoApp() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val api = remember { EchoApi(context.applicationContext) }
    val sync = remember { GradeSync(api, scope) }

    var screen by remember { mutableStateOf<Screen>(if (api.session != null) Screen.Home(null) else Screen.Login) }
    var decks by remember { mutableStateOf<Remote<List<Deck>>>(Remote.Loading) }
    var loginBusy by remember { mutableStateOf(false) }
    var loginError by remember { mutableStateOf<String?>(null) }
    // The extra-review phrase the user last set on Home ("20 сложных"), reused on the summary.
    var extra by remember { mutableStateOf(20 to R.string.extra_kind_hard) }

    fun toLogin() {
        api.signOut()
        decks = Remote.Loading
        screen = Screen.Login
    }

    fun reloadDecks() {
        scope.launch {
            if (decks !is Remote.Ready) decks = Remote.Loading
            decks = try {
                Remote.Ready(api.home())
            } catch (e: AuthException) {
                toLogin(); return@launch
            } catch (e: Exception) {
                Remote.Failed(e.message ?: "")
            }
        }
    }

    val home = screen as? Screen.Home
    LaunchedEffect(home?.nonce) { if (home != null) reloadDecks() }

    AnimatedContent(
        targetState = screen,
        modifier = Modifier.fillMaxSize().background(Ink.Ground),
        contentKey = {
            when (it) {
                is Screen.Review -> it.nonce
                is Screen.Home -> "home"
                else -> it::class
            }
        },
        transitionSpec = {
            val forward = targetState.order > initialState.order ||
                (targetState is Screen.Review && initialState is Screen.Done)
            if (forward) {
                // The next sheet of paper rises over the previous one, which settles back.
                (fadeIn(tween(320, 80)) + slideInVertically(tween(460, 40, EchoEase)) { it / 10 }) togetherWith
                    (fadeOut(tween(200)) + scaleOut(tween(320, easing = EchoEase), targetScale = 0.96f))
            } else {
                (fadeIn(tween(320, 60)) + scaleIn(tween(420, 60, EchoEase), initialScale = 0.97f)) togetherWith
                    (fadeOut(tween(220)) + slideOutVertically(tween(320, easing = EchoEase)) { it / 12 })
            }
        },
        label = "screen",
    ) { s ->
        when (s) {
            Screen.Login -> LoginScreen(
                busy = loginBusy,
                error = loginError,
                onSubmit = { email, password ->
                    if (!api.isConfigured) {
                        loginError = context.getString(R.string.login_error_config); return@LoginScreen
                    }
                    loginBusy = true
                    loginError = null
                    scope.launch {
                        try {
                            api.signIn(email, password)
                            sync.kick() // grades this account left queued before a sign-out
                            screen = Screen.Home(null)
                        } catch (e: AuthException) {
                            loginError = context.getString(R.string.login_error_credentials)
                        } catch (e: IOException) {
                            loginError = context.getString(R.string.login_error_network)
                        } catch (e: Exception) {
                            loginError = e.message ?: context.getString(R.string.login_error_network)
                        } finally {
                            loginBusy = false
                        }
                    }
                },
            )
            is Screen.Home -> HomeScreen(
                decks = decks,
                email = api.session?.email.orEmpty(),
                initialSelection = s.selected,
                onRetry = ::reloadDecks,
                onSignOut = ::toLogin,
                onReview = { d -> screen = Screen.Review(d, SessionKind.Today, 0, 0) },
                onExtra = { d, count, kindRes ->
                    extra = count to kindRes
                    screen = Screen.Review(d, SessionKind.Extra, count, kindRes)
                },
            )
            is Screen.Review -> {
                var cards by remember(s.nonce) { mutableStateOf<Remote<ReviewSessionData>>(Remote.Loading) }
                var attempt by remember(s.nonce) { mutableStateOf(0) }
                LaunchedEffect(s.nonce, attempt) {
                    cards = Remote.Loading
                    cards = try {
                        val kind = ExtraKindKeys[s.extraKindRes]
                        Remote.Ready(api.session(s.deck.id, s.kind, s.extraCount, kind))
                    } catch (e: AuthException) {
                        toLogin(); return@LaunchedEffect
                    } catch (e: Exception) {
                        Remote.Failed(e.message ?: "")
                    }
                }
                ReviewScreen(
                    deck = s.deck,
                    cards = cards,
                    kind = s.kind,
                    onRetry = { attempt++ },
                    onGraded = { card, grade, ms -> sync.submit(card.id, grade, ms) },
                    onClose = { screen = Screen.Home(s.deck.id) },
                    onFinish = { result ->
                        // Like the web: the deck is marked complete only once every grade of the
                        // session is saved, and a failed completion is retried, never dropped.
                        scope.launch {
                            sync.awaitIdle()
                            var backoff = 1_000L
                            repeat(6) {
                                try {
                                    api.complete(s.deck.id, s.kind)
                                    return@launch
                                } catch (e: AuthException) {
                                    return@launch
                                } catch (e: Exception) {
                                    kotlinx.coroutines.delay(backoff)
                                    backoff = (backoff * 2).coerceAtMost(30_000L)
                                }
                            }
                        }
                        screen = Screen.Done(result, s.deck)
                    },
                )
            }
            is Screen.Done -> DoneScreen(
                result = s.result,
                extraLabel = context.getString(R.string.done_more, extra.first, context.getString(extra.second)),
                onHome = { screen = Screen.Home(s.result.deckId) },
                onMore = { screen = Screen.Review(s.deck, SessionKind.Extra, extra.first, extra.second) },
            )
        }
    }
}
