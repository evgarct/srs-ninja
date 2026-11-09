package com.evgarct.echo.data

import java.util.Locale

data class Example(val pre: String, val hit: String, val post: String)

data class Card(
    val id: String,
    /** Front text as shown; may hold a deliberate line break. */
    val text: String,
    val translation: String,
    val examples: List<Example>,
    val synonyms: List<String> = emptyList(),
    val meta: String,
    /** Target-language text to speak; null means the front itself. */
    val speech: String? = null,
) {
    /** What text-to-speech says, without layout breaks. */
    val spoken: String get() = (speech ?: text).replace('\n', ' ')

    /**
     * Production cards show the translation first and the target language is the answer,
     * so audio waits for the flip instead of giving the answer away.
     */
    val speaksAnswer: Boolean get() = speech != null && speech != text
}

data class Deck(
    val id: String,
    val name: String,
    val pair: String,
    val drafts: Int,
    val speechLocale: Locale,
    val cards: List<Card>,
    /** How many cards are due today; 0 means today's review is done. */
    val due: Int,
    val total: Int = cards.size,
    val completedToday: Boolean = false,
)

enum class Grade { Again, Hard, Good, Easy }

enum class SessionKind { Today, Extra }

/** Result of one review session, used by the summary screen. */
data class SessionResult(
    val deckId: String,
    val deckName: String,
    val kind: SessionKind,
    val grades: List<Grade>,
    val millis: Long,
) {
    val total get() = grades.size
    fun count(g: Grade) = grades.count { it == g }
    val accuracy get() = if (total == 0) 0 else ((count(Grade.Good) + count(Grade.Easy)) * 100f / total).toInt()
    val struggled get() = count(Grade.Again) + count(Grade.Hard)
}

/** Grade picked by horizontal drag distance in dp: a little = Hard/Good, far = Again/Easy. */
fun gradeForDrag(dxDp: Float): Grade? = when {
    dxDp <= -140f -> Grade.Again
    dxDp < -40f -> Grade.Hard
    dxDp >= 140f -> Grade.Easy
    dxDp > 40f -> Grade.Good
    else -> null
}
