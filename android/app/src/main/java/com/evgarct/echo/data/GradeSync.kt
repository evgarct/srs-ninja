package com.evgarct.echo.data

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

/**
 * Sends grades in order, one at a time, so the card flies away immediately and the network never
 * blocks the review. A failed send stays queued and is retried with backoff; nothing is dropped.
 */
class GradeSync(private val api: EchoApi, private val scope: CoroutineScope) {
    private data class Pending(val cardId: String, val grade: Grade, val durationMs: Long)

    private val queue = ArrayDeque<Pending>()
    private val _pending = MutableStateFlow(0)
    val pending: StateFlow<Int> = _pending
    private var worker: Job? = null

    fun submit(cardId: String, grade: Grade, durationMs: Long) {
        synchronized(queue) { queue.addLast(Pending(cardId, grade, durationMs)); _pending.value = queue.size }
        if (worker?.isActive != true) worker = scope.launch { drain() }
    }

    private suspend fun drain() {
        var backoff = 1_000L
        while (true) {
            val next = synchronized(queue) { queue.firstOrNull() } ?: return
            try {
                api.grade(next.cardId, next.grade, next.durationMs)
                synchronized(queue) { queue.removeFirst(); _pending.value = queue.size }
                backoff = 1_000L
            } catch (e: AuthException) {
                Log.w("GradeSync", "signed out with ${_pending.value} grades queued")
                return
            } catch (e: Exception) {
                Log.w("GradeSync", "grade failed, retrying in ${backoff}ms: ${e.message}")
                delay(backoff)
                backoff = (backoff * 2).coerceAtMost(30_000L)
            }
        }
    }
}
