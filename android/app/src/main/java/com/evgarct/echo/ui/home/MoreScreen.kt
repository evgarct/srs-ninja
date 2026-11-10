package com.evgarct.echo.ui.home

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.evgarct.echo.R
import com.evgarct.echo.ui.LocalPrefs
import com.evgarct.echo.ui.SwitchSentence
import com.evgarct.echo.ui.TextAction
import com.evgarct.echo.ui.Word
import com.evgarct.echo.ui.riseIn
import com.evgarct.echo.ui.theme.Ink
import com.evgarct.echo.ui.theme.Type

/** Canvas `.echo-row`: the word slides 6 dp to the right while pressed. */
fun Modifier.nudgeable(onClick: () -> Unit): Modifier = composed {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val x by animateFloatAsState(if (pressed) 6f else 0f, tween(160), label = "nudge")
    this
        .graphicsLayer { translationX = x * density }
        .clickable(source, indication = null, role = Role.Button, onClick = onClick)
}

/**
 * "Ещё": the sections as one large comma list, the preferences as a sentence whose words you tap,
 * and the account with sign-out at the bottom. Sections that are not built yet say so.
 */
@Composable
fun MoreScreen(drafts: Int, email: String, onSoon: () -> Unit, onSignOut: () -> Unit) {
    val prefs = LocalPrefs.current
    val items = listOf(
        R.string.more_new_deck to 0,
        R.string.more_drafts to drafts,
        R.string.more_import to 0,
        R.string.more_agents to 0,
        R.string.more_voices to 0,
    )
    Column(Modifier.fillMaxSize()) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp)) {
            Spacer(Modifier.height(56.dp))
            items.forEachIndexed { i, (label, badge) ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .heightIn(min = 56.dp)
                        .riseIn(delayMs = 60 + i * 60, durationMs = 480)
                        .nudgeable(onSoon),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    BasicText(
                        stringResource(label),
                        Modifier.weight(1f, fill = false),
                        style = Type.display.copy(fontSize = 38.sp, lineHeight = 1.15.em),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    if (badge > 0) {
                        Box(
                            Modifier
                                .align(Alignment.Top)
                                .padding(top = 10.dp)
                                .defaultMinSize(minWidth = 22.dp)
                                .height(22.dp)
                                .background(Ink.Leaf, CircleShape)
                                .padding(horizontal = 6.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            BasicText(badge.toString(), style = Type.mono.copy(color = Ink.Paper, lineHeight = 14.sp))
                        }
                    }
                }
            }
            Spacer(Modifier.height(48.dp))
            SwitchSentence(
                listOf(
                    Word(stringResource(R.string.more_pref_interface) + " "),
                    Word(stringResource(R.string.more_lang_ru), onSoon),
                    Word(", " + stringResource(R.string.more_pref_theme) + " "),
                    Word(stringResource(R.string.more_theme_light), onSoon),
                    Word(", " + stringResource(R.string.pref_slip) + " "),
                    Word(stringResource(if (prefs.slipOpen) R.string.pref_slip_open else R.string.pref_slip_hidden), prefs::toggleSlip),
                    Word("."),
                ),
                Type.body.copy(fontSize = 20.sp, lineHeight = 32.sp, letterSpacing = (-0.01).em, color = Ink.Soft),
                Modifier.riseIn(delayMs = 420, durationMs = 480),
            )
            Spacer(Modifier.height(16.dp))
        }
        Row(
            Modifier.padding(start = 24.dp, end = 24.dp, bottom = 8.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicText(
                email,
                Modifier.weight(1f),
                style = Type.mono.copy(color = Ink.Soft),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            TextAction(
                stringResource(R.string.more_sign_out),
                onSignOut,
                Modifier.offset(x = 12.dp),
                style = Type.body.copy(fontSize = 15.sp, color = Ink.Rust),
            )
        }
    }
}
