package com.evgarct.echo.ui.login

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.evgarct.echo.R
import com.evgarct.echo.ui.PrimaryAction
import com.evgarct.echo.ui.SwitchSentence
import com.evgarct.echo.ui.TextAction
import com.evgarct.echo.ui.TitleLine
import com.evgarct.echo.ui.Word
import com.evgarct.echo.ui.art.PeekingCat
import com.evgarct.echo.ui.riseIn
import com.evgarct.echo.ui.theme.EchoEase
import com.evgarct.echo.ui.theme.Ink
import com.evgarct.echo.ui.theme.Type

/** Email + password, the same account as the web app. */
@Composable
fun LoginScreen(
    busy: Boolean,
    error: String?,
    onSubmit: (email: String, password: String) -> Unit,
    onCreateAccount: () -> Unit,
    onSoon: () -> Unit,
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    val focus = LocalFocusManager.current
    val passwordFocus = remember { FocusRequester() }
    val canSubmit = email.isNotBlank() && password.isNotEmpty() && !busy
    val submit = {
        if (canSubmit) {
            focus.clearFocus()
            onSubmit(email, password)
        }
    }
    val languageLabel = stringResource(R.string.login_language_a11y)

    BoxWithConstraints(
        Modifier
            .fillMaxSize()
            .background(Ink.Ground)
            .windowInsetsPadding(WindowInsets.statusBars)
            .windowInsetsPadding(WindowInsets.navigationBars)
            .imePadding(),
    ) {
    // At least one screen tall, so the two links stay at the bottom; scrolls when the keyboard is up.
    Column(Modifier.verticalScroll(rememberScrollState()).heightIn(min = maxHeight)) {
        Row(
            Modifier.padding(start = 24.dp, end = 12.dp, top = 6.dp).fillMaxWidth().height(48.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            BasicText(
                stringResource(R.string.wordmark),
                style = Type.hand.copy(fontSize = 36.sp, lineHeight = 36.sp, color = Ink.Graphite),
            )
            SwitchSentence(
                listOf(Word(stringResource(R.string.login_language), onSoon)),
                Type.mono.copy(fontSize = 13.sp, color = Ink.Graphite),
                Modifier.padding(horizontal = 12.dp).semantics { contentDescription = languageLabel },
            )
        }
        Spacer(Modifier.height(18.dp))
        PeekingCat(stringResource(R.string.login_cat_a11y), Modifier.align(Alignment.CenterHorizontally))
        Spacer(Modifier.height(28.dp))
        Column(Modifier.padding(horizontal = 24.dp).riseIn(120)) {
            TitleLine(stringResource(R.string.login_title_line1))
            TitleLine(stringResource(R.string.login_title_line2))
        }
        Spacer(Modifier.height(32.dp))
        Column(Modifier.padding(horizontal = 24.dp).riseIn(200), verticalArrangement = Arrangement.spacedBy(18.dp)) {
            PaperField(
                label = stringResource(R.string.login_email),
                placeholder = stringResource(R.string.login_email_placeholder),
                value = email,
                onChange = { email = it },
                contentType = ContentType.EmailAddress,
                keyboard = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                actions = KeyboardActions(onNext = { passwordFocus.requestFocus() }),
            )
            PaperField(
                label = stringResource(R.string.login_password),
                placeholder = "••••••••",
                value = password,
                onChange = { password = it },
                contentType = ContentType.Password,
                keyboard = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Go),
                actions = KeyboardActions(onGo = { submit() }),
                modifier = Modifier.focusRequester(passwordFocus),
                secret = true,
            )
            AnimatedVisibility(
                visible = error != null,
                enter = fadeIn(tween(200)) + slideInVertically(tween(320, easing = EchoEase)) { -it / 2 },
                exit = fadeOut(tween(150)),
            ) {
                BasicText(error.orEmpty(), style = Type.hand.copy(fontSize = 22.sp, color = Ink.Graphite))
            }
            PrimaryAction(
                stringResource(if (busy) R.string.login_busy else R.string.login_submit),
                trailing = if (busy) null else "→",
                onClick = submit,
                modifier = Modifier.padding(top = 8.dp),
            )
        }
        Spacer(Modifier.weight(1f).height(24.dp))
        Row(
            Modifier.padding(horizontal = 24.dp).fillMaxWidth().riseIn(280),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextAction(stringResource(R.string.login_create), onCreateAccount, Modifier.offset(x = (-12).dp))
            TextAction(
                stringResource(R.string.login_forgot),
                onSoon,
                Modifier.offset(x = 12.dp),
                style = Type.body.copy(fontSize = 15.sp, color = Ink.Soft),
            )
        }
    }
    }
}

@Composable
private fun PaperField(
    label: String,
    placeholder: String,
    value: String,
    onChange: (String) -> Unit,
    contentType: ContentType,
    keyboard: KeyboardOptions,
    actions: KeyboardActions,
    modifier: Modifier = Modifier,
    secret: Boolean = false,
) {
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    // The rule under the field: graphite hairline, 2 dp green while typing.
    val rule by animateColorAsState(if (focused) Ink.Leaf else Ink.Graphite, tween(200), label = "rule")
    val ruleW by animateDpAsState(if (focused) 2.dp else 1.dp, tween(200), label = "ruleW")
    val text = TextStyle(fontFamily = Type.Onest, fontSize = 19.sp, color = Ink.Graphite)
    Column(modifier.fillMaxWidth()) {
        BasicText(label, style = Type.mono.copy(fontSize = 11.5.sp, color = Ink.Soft))
        BasicTextField(
            value = value,
            onValueChange = onChange,
            singleLine = true,
            interactionSource = source,
            textStyle = text,
            cursorBrush = SolidColor(Ink.Leaf),
            keyboardOptions = keyboard,
            keyboardActions = actions,
            visualTransformation = if (secret) PasswordVisualTransformation() else VisualTransformation.None,
            decorationBox = { field ->
                Box {
                    if (value.isEmpty()) BasicText(placeholder, style = text.copy(color = Ink.Idle), maxLines = 1)
                    field()
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .semantics { this.contentType = contentType }
                .drawBehind {
                    val w = ruleW.toPx()
                    drawLine(rule, Offset(0f, size.height - w / 2), Offset(size.width, size.height - w / 2), w)
                }
                .padding(vertical = 8.dp),
        )
    }
}
