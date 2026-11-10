package com.evgarct.echo.ui

import android.app.LocaleManager
import android.content.Context
import android.os.LocaleList
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalConfiguration
import java.util.Locale

/**
 * The interface language: Russian, English or Czech. Until the user picks one the app follows the
 * phone's language (English when it is none of the three). The choice is stored by the system
 * (per-app language), so it also shows in the system settings and survives reinstalling over.
 */
object AppLanguage {
    /** The order the language word cycles in. */
    private val tags = listOf("ru", "en", "cs")

    /** Switches to the next language; the system recreates the activity with the new strings. */
    fun cycle(context: Context) {
        val current = context.resources.configuration.locales[0].language
        val next = tags[(tags.indexOf(current).coerceAtLeast(0) + 1) % tags.size]
        context.getSystemService(LocaleManager::class.java)?.applicationLocales = LocaleList.forLanguageTags(next)
    }
}

/** The locale the interface is shown in, for dates and hyphenation. */
@Composable
fun currentLocale(): Locale = LocalConfiguration.current.locales[0]
