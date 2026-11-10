package com.evgarct.echo.ui.theme

import android.provider.Settings
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.evgarct.echo.R

/** Paper-and-graphite palette from the design canvas: one spot of green per screen. */
object Ink {
    val Ground = Color(0xFFF1ECE6)
    val Paper = Color(0xFFFBF9F5)
    val Graphite = Color(0xFF1D1C1A)
    val Muted = Color(0xFF6B675F)
    val Soft = Color(0xFF5C5852)
    val Hand = Color(0xFF3B3934)
    val Rule = Color(0xFFD8D1C6)
    val Dash = Color(0xFFCEC6BA)
    val SlipEdge = Color(0xFF8F887D)
    val Idle = Color(0xFF8A857C)
    val Leaf = Color(0xFF2E7A3C)
    val LeafLight = Color(0xFF7FC08A)
    val LeafWash = Color(0xFFDCEBDD)
    /** Destructive words only: "Выйти", "Закончить ревью". */
    val Rust = Color(0xFFA3341B)
    val Stack1 = Color(0xFFF8F5F0)
    val Stack2 = Color(0xFFF5F2EC)
    val Stack3 = Color(0xFFF3F0EA)
}

private fun variable(res: Int, weight: Int) = Font(
    res,
    weight = FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

/** Onest carries content, JetBrains Mono the service text, Caveat only next to drawings. */
object Type {
    val Onest = FontFamily(variable(R.font.onest_var, 400), variable(R.font.onest_var, 500))
    val Mono = FontFamily(variable(R.font.jetbrains_mono_var, 400), variable(R.font.jetbrains_mono_var, 500))
    val Hand = FontFamily(variable(R.font.caveat_var, 500))

    val body = TextStyle(fontFamily = Onest, color = Ink.Graphite, fontSize = 16.sp)
    val mono = TextStyle(fontFamily = Mono, color = Ink.Muted, fontSize = 12.sp)
    val display = TextStyle(
        fontFamily = Onest,
        fontWeight = FontWeight.Medium,
        color = Ink.Graphite,
        letterSpacing = (-0.03).em,
        lineHeight = 1.02.em,
    )
    val hand = TextStyle(fontFamily = Hand, fontWeight = FontWeight.Medium, color = Ink.Hand)
}

/** The design's house curve, cubic-bezier(.2,.8,.2,1): quick start, long soft landing. */
val EchoEase = CubicBezierEasing(0.2f, 0.8f, 0.2f, 1f)
val CssEase = CubicBezierEasing(0.25f, 0.1f, 0.25f, 1f)
val CssEaseInOut = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)
val CssEaseOut = CubicBezierEasing(0f, 0f, 0.58f, 1f)
val CssEaseIn = CubicBezierEasing(0.42f, 0f, 1f, 1f)
val FlyOutEase = CubicBezierEasing(0.5f, 0f, 0.75f, 0f)

/** True when the system "remove animations" setting is on: looping drawings freeze on a static frame. */
val LocalReducedMotion = staticCompositionLocalOf { false }

@Composable
fun EchoTheme(content: @Composable () -> Unit) {
    val context = LocalContext.current
    val reduced = remember {
        Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    }
    CompositionLocalProvider(LocalReducedMotion provides reduced, content = content)
}
