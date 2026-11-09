package com.evgarct.echo.data

import kotlin.random.Random

data class Example(val pre: String, val hit: String, val post: String)

/** One review card exactly as the server maps it (`mapCardForMobile`); the app adds no rules of its own. */
data class Card(
    val id: String,
    /** Front text as shown: the expression for recognition, the translation for production. */
    val text: String,
    val translation: String,
    val examples: List<Example>,
    val synonyms: List<String> = emptyList(),
    val meta: String,
    /** Production cards show Russian first; their audio belongs to the answer side (web autoplay rule). */
    val production: Boolean = false,
    /** The note's generated expression audio from `audio_cache`; null means no speaker, like the web. */
    val audioUrl: String? = null,
)

data class Deck(
    val id: String,
    val name: String,
    val pair: String,
    val drafts: Int,
    /** How many cards are due today; 0 means today's review is done. */
    val due: Int,
    val total: Int = 0,
    val completedToday: Boolean = false,
)

enum class Grade { Again, Hard, Good, Easy }

enum class SessionKind { Today, Extra }

/** Where a graded card goes back, served by the web's `getReviewRequeueWindow`. */
data class RequeueWindow(val min: Int, val max: Int)

class RequeuePolicy(private val rows: List<Pair<RequeueWindow?, RequeueWindow?>>) {
    /**
     * Index in the remaining queue to reinsert the card at, or null when it leaves the session.
     * Same pick as the web's `applyReviewQueueOutcome`: uniform inside the server's window.
     */
    fun insertIndex(remaining: Int, grade: Grade, random: Random = Random): Int? {
        val row = rows.getOrNull(remaining) ?: return null
        val window = when (grade) {
            Grade.Again -> row.first
            Grade.Hard -> row.second
            else -> null
        } ?: return null
        return if (window.min == window.max) window.min else window.min + random.nextInt(window.max - window.min + 1)
    }

    companion object {
        val None = RequeuePolicy(emptyList())
    }
}

data class ReviewSessionData(val cards: List<Card>, val requeue: RequeuePolicy)

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
