package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Reads only when the screen turned on/off and how long each app was in the
// foreground. Never content, never notifications. All maths happens in JS on
// the phone; nothing here touches the network.
class UsageStatsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun usm() = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

  override fun definition() = ModuleDefinition {
    Name("UsageStats")

    Function("hasAccess") {
      val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      } else {
        @Suppress("DEPRECATION")
        ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("openSettings") {
      context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    // Screen transitions in [start, end] as [state, timeMs]: 1 = on, 0 = off.
    // SCREEN_INTERACTIVE needs Android 9; older phones get an empty list.
    AsyncFunction("screenEvents") { start: Double, end: Double ->
      val out = mutableListOf<List<Double>>()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val events = usm().queryEvents(start.toLong(), end.toLong())
        val e = UsageEvents.Event()
        while (events.hasNextEvent()) {
          events.getNextEvent(e)
          when (e.eventType) {
            UsageEvents.Event.SCREEN_INTERACTIVE -> out.add(listOf(1.0, e.timeStamp.toDouble()))
            UsageEvents.Event.SCREEN_NON_INTERACTIVE -> out.add(listOf(0.0, e.timeStamp.toDouble()))
          }
        }
      }
      out
    }

    // Foreground minutes per app in [start, end], largest first.
    AsyncFunction("topApps") { start: Double, end: Double, limit: Int ->
      val pm = context.packageManager
      val home = pm.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0)
        .map { it.activityInfo.packageName }.toSet()
      val openedAt = HashMap<String, Long>()
      val total = HashMap<String, Long>()
      val events = usm().queryEvents(start.toLong(), end.toLong())
      val e = UsageEvents.Event()
      while (events.hasNextEvent()) {
        events.getNextEvent(e)
        val pkg = e.packageName ?: continue
        @Suppress("DEPRECATION")
        when (e.eventType) {
          UsageEvents.Event.MOVE_TO_FOREGROUND -> openedAt.putIfAbsent(pkg, e.timeStamp)
          UsageEvents.Event.MOVE_TO_BACKGROUND -> openedAt.remove(pkg)?.let { total[pkg] = (total[pkg] ?: 0L) + (e.timeStamp - it) }
        }
      }
      // Still open at the end of the window counts up to the window's end.
      openedAt.forEach { (pkg, t) -> total[pkg] = (total[pkg] ?: 0L) + (end.toLong() - t) }
      total.entries
        .filter { it.key != context.packageName && it.key !in home && pm.getLaunchIntentForPackage(it.key) != null }
        .sortedByDescending { it.value }
        .take(limit)
        .map { (pkg, ms) ->
          val info = try { pm.getApplicationInfo(pkg, 0) } catch (_: Exception) { null }
          val label = info?.let { pm.getApplicationLabel(it).toString() } ?: pkg
          val cat = info?.let { if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) it.category else -1 } ?: -1
          val catName = when (cat) {
            ApplicationInfo.CATEGORY_GAME -> "game"
            ApplicationInfo.CATEGORY_AUDIO -> "audio"
            ApplicationInfo.CATEGORY_VIDEO -> "video"
            ApplicationInfo.CATEGORY_IMAGE -> "image"
            ApplicationInfo.CATEGORY_SOCIAL -> "social"
            ApplicationInfo.CATEGORY_NEWS -> "news"
            ApplicationInfo.CATEGORY_MAPS -> "maps"
            ApplicationInfo.CATEGORY_PRODUCTIVITY -> "productivity"
            else -> "undefined"
          }
          mapOf("app" to label, "pkg" to pkg, "category" to catName, "minutes" to ms / 60000.0)
        }
    }
  }
}
