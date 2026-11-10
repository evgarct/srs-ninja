package com.evgarct.echo.data

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Sends grades in order, one at a time, so the card flies away immediately and the network never
 * blocks the review. Each grade carries its own review id, so a retry after a lost response is a
 * no-op on the server. Grades belong to the account that made them: after a sign-out they are
 * only sent again when that account is back, never under someone else's token.
 */
class GradeSync(private val api: EchoApi, private val scope: CoroutineScope) {
    private data class Pending(val owner: String, val reviewId: String, val cardId: String, val grade: Grade, val durationMs: Long)

    private val queue = ArrayDeque<Pending>()
    private val _pending = MutableStateFlow(0)
    /** Grades of the signed-in account still waiting to be saved. */
    val pending: StateFlow<Int> = _pending
    private var worker: Job? = null

    private fun currentOwner() = api.session?.email.orEmpty()

    private fun recount() {
        val owner = currentOwner()
        _pending.value = synchronized(queue) { queue.count { it.owner == owner } }
    }

    fun submit(cardId: String, grade: Grade, durationMs: Long) {
        val owner = currentOwner()
        synchronized(queue) { queue.addLast(Pending(owner, UUID.randomUUID().toString(), cardId, grade, durationMs)) }
        recount()
        kick()
    }

    /** Call after sign-in: resumes this account's grades left from before a sign-out. */
    fun kick() {
        recount()
        if (worker?.isActive != true) worker = scope.launch { drain() }
    }

    /** Suspends until every grade of the signed-in account is saved. */
    suspend fun awaitIdle() {
        kick()
        pending.first { it == 0 }
    }

    private suspend fun drain() {
        var backoff = 1_000L
        while (true) {
            val owner = currentOwner()
            val next = synchronized(queue) { queue.firstOrNull { it.owner == owner } } ?: return
            try {
                api.grade(next.cardId, next.grade, next.durationMs, next.reviewId)
                synchronized(queue) { queue.remove(next) }
                recount()
                backoff = 1_000L
            } catch (e: AuthException) {
                Log.w("GradeSync", "signed out; ${_pending.value} grades wait for this account")
                return
            } catch (e: Exception) {
                Log.w("GradeSync", "grade failed, retrying in ${backoff}ms: ${e.message}")
                delay(backoff)
                backoff = (backoff * 2).coerceAtMost(30_000L)
            }
        }
    }
}
