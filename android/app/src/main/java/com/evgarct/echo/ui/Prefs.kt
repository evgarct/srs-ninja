package com.evgarct.echo.ui

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf

/**
 * Display preferences kept on this phone. They only change how a card is presented, never which
 * cards are shown or how they are scheduled.
 */
class EchoPrefs(context: Context) {
    private val prefs = context.getSharedPreferences("echo", Context.MODE_PRIVATE)

    /** "Примеры под карточкой: спрятаны / открыты сразу": whether the slip opens with the answer. */
    var slipOpen by mutableStateOf(prefs.getBoolean(KEY_SLIP, false))
        private set

    fun toggleSlip() {
        slipOpen = !slipOpen
        prefs.edit().putBoolean(KEY_SLIP, slipOpen).apply()
    }

    private companion object {
        const val KEY_SLIP = "slip_open"
    }
}

val LocalPrefs = staticCompositionLocalOf<EchoPrefs> { error("EchoPrefs is not provided") }
