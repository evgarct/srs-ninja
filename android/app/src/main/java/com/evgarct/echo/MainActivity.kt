package com.evgarct.echo

import android.graphics.Color
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import com.evgarct.echo.ui.EchoApp
import com.evgarct.echo.ui.LocalSpeaker
import com.evgarct.echo.ui.Speaker
import com.evgarct.echo.ui.theme.EchoTheme

/**
 * Plays the same generated recordings as the web review (ElevenLabs files from `audio_cache`);
 * there is no on-device speech synthesis.
 */
class MainActivity : ComponentActivity(), Speaker {
    private var player: MediaPlayer? = null
    private var onFinished: (() -> Unit)? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
        )
        super.onCreate(savedInstanceState)
        // The interface language follows the phone (ru / cs, otherwise English) until the user
        // picks one in the app; see ui/AppLanguage.kt.
        setContent {
            EchoTheme {
                CompositionLocalProvider(LocalSpeaker provides this) { EchoApp() }
            }
        }
    }

    override fun play(url: String, onDone: () -> Unit) {
        stop()
        onFinished = onDone
        player = MediaPlayer().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build(),
            )
            setOnPreparedListener { it.start() }
            setOnCompletionListener { finishPlayback() }
            setOnErrorListener { _, what, extra ->
                Log.w("Echo", "audio failed ($what/$extra)")
                finishPlayback()
                true
            }
            try {
                setDataSource(url)
                prepareAsync()
            } catch (e: Exception) {
                Log.w("Echo", "audio failed: ${e.message}")
                finishPlayback()
            }
        }
    }

    private fun finishPlayback() {
        onFinished?.invoke()
        onFinished = null
        player?.release()
        player = null
    }

    override fun stop() {
        onFinished?.invoke()
        onFinished = null
        player?.release()
        player = null
    }

    override fun onStop() {
        stop()
        super.onStop()
    }
}
