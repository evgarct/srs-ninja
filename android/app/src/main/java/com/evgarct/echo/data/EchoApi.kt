package com.evgarct.echo.data

import android.content.Context
import android.util.Log
import com.evgarct.echo.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.Locale
import java.util.TimeZone

class ApiException(val status: Int, message: String) : Exception(message)

/** Wrong email/password, or the session can no longer be refreshed: show the login screen. */
class AuthException(message: String) : Exception(message)

data class AuthSession(val accessToken: String, val refreshToken: String, val expiresAtMs: Long, val email: String)

/**
 * Talks to Supabase Auth directly (the same email + password login as the web) and to the web
 * app's /api/mobile routes with the user's access token. Everything runs under the user's RLS.
 */
class EchoApi(context: Context) {
    private val prefs = context.getSharedPreferences("echo_auth", Context.MODE_PRIVATE)
    private val refreshLock = Mutex()

    @Volatile
    var session: AuthSession? = loadSession()
        private set

    val isConfigured: Boolean get() = BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_ANON_KEY.isNotBlank()

    suspend fun signIn(email: String, password: String): AuthSession {
        val body = JSONObject().put("email", email.trim()).put("password", password)
        val json = authCall("token?grant_type=password", body)
        return saveSession(json, email.trim())
    }

    fun signOut() {
        session = null
        prefs.edit().clear().apply()
    }

    suspend fun home(): List<Deck> {
        val tz = URLEncoder.encode(TimeZone.getDefault().id, "UTF-8")
        val json = JSONObject(authorized("GET", "/api/mobile/home?tz=$tz"))
        val decks = json.getJSONArray("decks")
        return (0 until decks.length()).map { i -> decks.getJSONObject(i).toDeck() }
    }

    suspend fun session(deckId: String, kind: SessionKind, extraCount: Int, extraKind: String?): ReviewSessionData {
        val query = if (kind == SessionKind.Extra) {
            "mode=extra&limit=$extraCount" + (extraKind?.let { "&kind=$it" } ?: "")
        } else "mode=due"
        val json = JSONObject(authorized("GET", "/api/mobile/decks/$deckId/session?$query"))
        val cards = json.getJSONArray("cards")
        val requeue = json.optJSONArray("requeue")
        val swipe = json.optJSONObject("swipe")?.let { s ->
            SwipeRules(
                commitDistance = s.getDouble("commitDistance").toFloat(),
                maxOffset = s.getDouble("maxOffset").toFloat(),
                lockDistance = s.getDouble("lockDistance").toFloat(),
                left = s.optString("left").toGrade(),
                right = s.optString("right").toGrade(),
            )
        } ?: SwipeRules.Web
        return ReviewSessionData(
            swipe = swipe,
            cards = (0 until cards.length()).map { i -> cards.getJSONObject(i).toCard() },
            requeue = if (requeue == null) RequeuePolicy.None else RequeuePolicy(
                (0 until requeue.length()).map { i ->
                    val row = requeue.getJSONObject(i)
                    row.optJSONObject("again").toWindow() to row.optJSONObject("hard").toWindow()
                },
            ),
        )
    }

    suspend fun grade(cardId: String, grade: Grade, durationMs: Long, reviewId: String) {
        val body = JSONObject()
            .put("cardId", cardId)
            .put("rating", grade.name.lowercase(Locale.ROOT))
            .put("durationMs", durationMs)
            .put("reviewId", reviewId)
        authorized("POST", "/api/mobile/reviews", body)
    }

    suspend fun complete(deckId: String, kind: SessionKind) {
        val body = JSONObject().put("sessionType", if (kind == SessionKind.Extra) "extra" else "due")
        authorized("POST", "/api/mobile/decks/$deckId/complete", body)
    }

    // --- auth plumbing ---

    private suspend fun validToken(): String = refreshLock.withLock {
        val current = session ?: throw AuthException("Not signed in")
        if (System.currentTimeMillis() < current.expiresAtMs - 60_000) return current.accessToken
        refreshLocked(current).accessToken
    }

    private suspend fun refreshLocked(current: AuthSession): AuthSession = try {
        val json = authCall("token?grant_type=refresh_token", JSONObject().put("refresh_token", current.refreshToken))
        saveSession(json, current.email)
    } catch (e: ApiException) {
        if (e.status in 400..499) { signOut(); throw AuthException("Session expired") } else throw e
    }

    private suspend fun authorized(method: String, path: String, body: JSONObject? = null): String {
        val token = validToken()
        return try {
            http(method, BuildConfig.API_BASE.trimEnd('/') + path, body, mapOf("Authorization" to "Bearer $token"))
        } catch (e: ApiException) {
            if (e.status != 401) throw e
            // The token may have been revoked or rotated elsewhere: refresh once and retry.
            val fresh = refreshLock.withLock { refreshLocked(session ?: throw AuthException("Not signed in")) }
            http(method, BuildConfig.API_BASE.trimEnd('/') + path, body, mapOf("Authorization" to "Bearer ${fresh.accessToken}"))
        }
    }

    private suspend fun authCall(path: String, body: JSONObject): JSONObject = try {
        JSONObject(http("POST", "${BuildConfig.SUPABASE_URL.trimEnd('/')}/auth/v1/$path", body, mapOf("apikey" to BuildConfig.SUPABASE_ANON_KEY)))
    } catch (e: ApiException) {
        if (e.status == 400 && path.contains("password")) throw AuthException(e.message ?: "Invalid login") else throw e
    }

    private fun saveSession(json: JSONObject, email: String): AuthSession {
        val s = AuthSession(
            accessToken = json.getString("access_token"),
            refreshToken = json.getString("refresh_token"),
            expiresAtMs = System.currentTimeMillis() + json.optLong("expires_in", 3600) * 1000,
            email = json.optJSONObject("user")?.optString("email")?.takeIf { it.isNotBlank() } ?: email,
        )
        session = s
        prefs.edit()
            .putString("access", s.accessToken)
            .putString("refresh", s.refreshToken)
            .putLong("expires", s.expiresAtMs)
            .putString("email", s.email)
            .apply()
        return s
    }

    private fun loadSession(): AuthSession? {
        val refresh = prefs.getString("refresh", null) ?: return null
        return AuthSession(
            accessToken = prefs.getString("access", "") ?: "",
            refreshToken = refresh,
            expiresAtMs = prefs.getLong("expires", 0),
            email = prefs.getString("email", "") ?: "",
        )
    }

    private suspend fun http(method: String, url: String, body: JSONObject?, headers: Map<String, String>): String =
        withContext(Dispatchers.IO) {
            val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = 12_000
                readTimeout = 20_000
                setRequestProperty("Accept", "application/json")
                headers.forEach { (k, v) -> setRequestProperty(k, v) }
                if (body != null) {
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")
                }
            }
            try {
                if (body != null) conn.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
                val code = conn.responseCode
                val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
                if (code !in 200..299) {
                    Log.w("EchoApi", "$method ${url.substringBefore('?')} → $code")
                    val message = runCatching { JSONObject(text) }.getOrNull()?.let {
                        it.optString("error_description").ifBlank { it.optString("msg") }.ifBlank { it.optString("error") }
                    }.orEmpty()
                    throw ApiException(code, message.ifBlank { "HTTP $code" })
                }
                text
            } finally {
                conn.disconnect()
            }
        }
}

private val PAIR_CODES = mapOf("english" to "EN", "czech" to "CS", "turkish" to "TR", "russian" to "RU")

private fun String.toGrade(): Grade? = Grade.entries.firstOrNull { it.name.equals(this, ignoreCase = true) }

private fun JSONObject?.toWindow(): RequeueWindow? = this?.let { RequeueWindow(it.getInt("min"), it.getInt("max")) }

private fun JSONObject.toDeck(): Deck {
    val language = getString("language")
    val translation = optString("translationLanguage", "russian")
    return Deck(
        id = getString("id"),
        name = getString("name"),
        pair = "${PAIR_CODES[language] ?: language.take(2).uppercase()} → ${PAIR_CODES[translation] ?: translation.take(2).uppercase()}",
        drafts = optInt("drafts"),
        due = optInt("due"),
        total = optInt("total"),
        completedToday = optBoolean("completedToday"),
    )
}

private fun JSONArray.strings() = (0 until length()).map { getString(it) }

private fun JSONObject.toCard(): Card {
    val ex = getJSONArray("examples")
    return Card(
        id = getString("cardId"),
        text = getString("front"),
        translation = getString("back"),
        examples = (0 until ex.length()).map { i ->
            ex.getJSONObject(i).let { Example(it.optString("pre"), it.optString("hit"), it.optString("post")) }
        },
        synonyms = optJSONArray("synonyms")?.strings().orEmpty(),
        meta = optString("meta"),
        production = optString("cardType") == "production",
        audioUrl = if (isNull("audioUrl")) null else optString("audioUrl").ifBlank { null },
    )
}
