plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

// Public client config comes from the web app's ignored .env.local (same values the browser gets);
// nothing secret is read here. `-Pecho.apiBase=http://localhost:3000` points a build at a local
// `next dev` (with `adb reverse tcp:3000 tcp:3000`); the default is the production APP_URL.
val webEnv: Map<String, String> = run {
    val f = rootProject.file("../.env.local")
    if (!f.exists()) emptyMap() else f.readLines()
        .filter { Regex("^[A-Z_]+=").containsMatchIn(it) }
        .associate { line ->
            val key = line.substringBefore("=")
            var value = line.substringAfter("=").trim()
            if (value.length >= 2 && value.first() == '"' && value.last() == '"') value = value.substring(1, value.length - 1)
            key to value.removeSuffix("\\n")
        }
}
fun quoted(v: String?) = "\"${v.orEmpty()}\""

// `vercel env pull` writes sensitive variables as a placeholder ("[SENSITIVE]"), so APP_URL from
// .env.local is used only when it really is a URL; otherwise the production address is the default.
val productionApi = "https://echo-phi-one.vercel.app"
val apiBase: String = ((project.findProperty("echo.apiBase") as String?)
    ?: webEnv["APP_URL"]?.takeIf { it.startsWith("https://") }
    ?: productionApi).trimEnd('/')
require(Regex("^https?://[A-Za-z0-9.-]+(:\\d+)?$").matches(apiBase)) { "echo.apiBase is not a URL: $apiBase" }
require(webEnv["NEXT_PUBLIC_SUPABASE_URL"].orEmpty().startsWith("https://") && webEnv["NEXT_PUBLIC_SUPABASE_ANON_KEY"].orEmpty().length > 20) {
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing in ../.env.local; the app could not sign in"
}
logger.lifecycle("Echo API base: $apiBase" + if (apiBase.contains("localhost")) "  (local build: needs `adb reverse tcp:3000 tcp:3000`, do not hand it to a user)" else "")

android {
    namespace = "com.evgarct.echo"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.evgarct.echo"
        minSdk = 34
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"
        buildConfigField("String", "SUPABASE_URL", quoted(webEnv["NEXT_PUBLIC_SUPABASE_URL"]))
        buildConfigField("String", "SUPABASE_ANON_KEY", quoted(webEnv["NEXT_PUBLIC_SUPABASE_ANON_KEY"]))
        buildConfigField("String", "API_BASE", quoted(apiBase))
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.09.00")
    implementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-text")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.animation:animation")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")

    testImplementation("junit:junit:4.13.2")
}
