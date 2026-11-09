package com.evgarct.echo

import android.app.LocaleManager
import android.graphics.Color
import android.os.Bundle
import android.os.LocaleList
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import com.evgarct.echo.ui.EchoApp
import com.evgarct.echo.ui.LocalSpeaker
import com.evgarct.echo.ui.Speaker
import com.evgarct.echo.ui.theme.EchoTheme
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

class MainActivity : ComponentActivity(), Speaker {
    private var tts: TextToSpeech? = null
    @Volatile private var ready = false
    private val pending = ConcurrentHashMap<String, () -> Unit>()
    private val ids = AtomicLong()

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
        )
        super.onCreate(savedInstanceState)
        // Iteration 1 ships Russian copy only: pin the app locale so plurals ("9 карточек") and
        // dates follow Russian rules even on a phone set to another language.
        getSystemService(LocaleManager::class.java)?.let { lm ->
            if (lm.applicationLocales.isEmpty) lm.applicationLocales = LocaleList.forLanguageTags("ru")
        }
        tts =TextToSpeech(this) { status -> ready = status == TextToSpeech.SUCCESS }.apply {
            setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String) {}
                override fun onDone(utteranceId: String) = complete(utteranceId)
                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String) = complete(utteranceId)
                override fun onStop(utteranceId: String, interrupted: Boolean) = complete(utteranceId)
            })
        }
        setContent {
            EchoTheme {
                CompositionLocalProvider(LocalSpeaker provides this) { EchoApp() }
            }
        }
    }

    private fun complete(id: String) {
        pending.remove(id)?.let { runOnUiThread(it) }
    }

    override fun speak(text: String, locale: Locale, onDone: () -> Unit) {
        val engine = tts
        if (engine == null || !ready) {
            onDone()
            return
        }
        pending.values.forEach { runOnUiThread(it) }
        pending.clear()
        val id = "u${ids.incrementAndGet()}"
        pending[id] = onDone
        engine.language = locale
        engine.setSpeechRate(0.95f)
        engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, id)
    }

    override fun stop() {
        tts?.stop()
    }

    override fun onDestroy() {
        tts?.shutdown()
        super.onDestroy()
    }
}
