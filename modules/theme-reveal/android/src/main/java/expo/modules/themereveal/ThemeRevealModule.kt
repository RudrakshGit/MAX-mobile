package expo.modules.themereveal

import android.annotation.SuppressLint
import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.app.Activity
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.FrameMetrics
import android.view.PixelCopy
import android.view.View
import android.view.ViewGroup
import android.view.ViewAnimationUtils
import android.view.Window
import android.view.animation.PathInterpolator
import android.widget.FrameLayout
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.hypot
import kotlin.math.max

// The light/dark switch as ink spreading on paper (owner, 11 Nov 2026; before: a Telegram-style circle).
// 1. A picture of the window covers the app (PixelCopy).
// 2. Ink in the new paper colour spreads over it from the tap at once: a few overlapping blots and droplets, each a
//    circular reveal. Reveal animators run on the RenderThread, so the app re-rendering in the new theme underneath
//    (the slow part, which used to freeze the screen before anything moved) can't make the ink stutter.
// 3. Once the page is all ink and the new theme has drawn, the cover fades out and the new screen shows through.
// No shaders, so it works the same on every phone; the picture is freed as soon as the fade ends.
class ThemeRevealModule : Module() {
  private var cover: CoverView? = null

  private companion object {
    const val LIGHT_FRAME_MS = 50L
    const val MAX_WAIT_MS = 600L
  }

  override fun definition() = ModuleDefinition {
    Name("ThemeReveal")

    // Captures the window (header and bars included) and lays it over the app. Resolves false if it can't.
    AsyncFunction("cover") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        promise.resolve(false)
        return@AsyncFunction
      }
      activity.runOnUiThread { capture(activity, promise) }
    }

    // Spreads ink of `color` (#RRGGBB) from x,y (pixels) over the cover. Resolves when the page is all ink.
    AsyncFunction("ink") { x: Double, y: Double, color: String, durationMs: Double, promise: Promise ->
      val activity = appContext.currentActivity
      val view = cover
      if (activity == null || view == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      activity.runOnUiThread { spread(view, x.toFloat(), y.toFloat(), color, durationMs.toLong(), promise) }
    }

    // Waits for the new theme's first light frame, then fades the cover out and frees it.
    AsyncFunction("finish") { fadeMs: Double, promise: Promise ->
      val activity = appContext.currentActivity
      val view = cover
      if (activity == null || view == null) {
        activity?.runOnUiThread { removeCover() }
        promise.resolve(false)
        return@AsyncFunction
      }
      activity.runOnUiThread {
        whenDrawn(activity, view) {
          try {
            view.animate().alpha(0f).setDuration(fadeMs.toLong()).setInterpolator(PathInterpolator(0.4f, 0f, 0.2f, 1f)).withLayer().withEndAction {
              removeCover()
              promise.resolve(true)
            }.start()
          } catch (e: Throwable) {
            removeCover()
            promise.resolve(false)
          }
        }
      }
    }

    // Overdraw (M16 follow-up): every screen paints its own paper, so the window's own background is a whole
    // extra layer under each frame. Dropped once the app has drawn; the activity theme brings it back on restart.
    Function("dropWindowBackground") {
      appContext.currentActivity?.let { activity -> activity.runOnUiThread { activity.window.setBackgroundDrawable(null) } }
      null
    }

    // Drops the cover at once (any error path).
    Function("clear") {
      val activity = appContext.currentActivity
      if (activity != null) activity.runOnUiThread { removeCover() } else removeCover()
    }
  }

  private fun capture(activity: Activity, promise: Promise) {
    try {
      val window = activity.window
      val decor = window.decorView as ViewGroup
      val w = decor.width
      val h = decor.height
      if (w <= 0 || h <= 0) {
        promise.resolve(false)
        return
      }
      val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
      PixelCopy.request(window, bmp, { result ->
        try {
          if (result != PixelCopy.SUCCESS) {
            bmp.recycle()
            promise.resolve(false)
            return@request
          }
          removeCover()
          val view = CoverView(activity, bmp)
          decor.addView(view, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
          cover = view
          // resolve once the cover has really been drawn, so the theme never changes in view
          view.post { view.postOnAnimation { promise.resolve(true) } }
        } catch (e: Throwable) {
          removeCover()
          promise.resolve(false)
        }
      }, Handler(Looper.getMainLooper()))
    } catch (e: Throwable) {
      removeCover()
      promise.resolve(false)
    }
  }

  // The new theme's first frames are heavy (every drawing on screen re-renders in the new colours). A circle started
  // during them shows one or two steps and jumps, so wait for the first light frame (FrameMetrics, after at least
  // two frames), but never longer than MAX_WAIT_MS.
  private fun whenDrawn(activity: Activity, view: View, then: () -> Unit) {
    val handler = Handler(Looper.getMainLooper())
    var done = false
    var seen = 0
    var listener: Window.OnFrameMetricsAvailableListener? = null
    val finish = Runnable {
      if (done) return@Runnable
      done = true
      listener?.let { try { activity.window.removeOnFrameMetricsAvailableListener(it) } catch (_: Throwable) {} }
      then()
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      listener = Window.OnFrameMetricsAvailableListener { _, metrics, _ ->
        seen += 1
        val ms = metrics.getMetric(FrameMetrics.TOTAL_DURATION) / 1_000_000
        if (seen >= 2 && ms < LIGHT_FRAME_MS) handler.post(finish) else view.postInvalidateOnAnimation()
      }
      try { activity.window.addOnFrameMetricsAvailableListener(listener, handler) } catch (_: Throwable) { listener = null }
    }
    view.postInvalidateOnAnimation()
    handler.postDelayed(finish, MAX_WAIT_MS)
  }

  // The ink: an uneven blot (a wavy edge with a few droplets just ahead of it) drawn once, then grown from the tap by
  // scaling it, plus a second, turned blot a beat later so the spread isn't symmetric; the blot keeps its inky edge
  // at every size. Scaling runs on the UI thread (ViewPropertyAnimator's RenderThread path is switched off in
  // Android), so under the blots a plain circle grows on the RenderThread (circular reveal) and reaches the far corner
  // on time: if the UI thread stalls while the app re-renders, the ink still covers the page, and the switch is
  // timed by that circle.
  private fun spread(view: CoverView, x: Float, y: Float, color: String, durationMs: Long, promise: Promise) {
    try {
      val ink = Color.parseColor(color)
      val w = view.width.toFloat()
      val h = view.height.toFloat()
      val far = max(max(hypot(x, y), hypot(w - x, y)), max(hypot(x, h - y), hypot(w - x, h - y))) + 8f
      val seed = x.toLong() * 31 + y.toLong()
      val soak = PathInterpolator(0.12f, 0.6f, 0.25f, 1f)
      // (seed, rotation, size, start delay and length as fractions of the duration, end scale)
      val blots = listOf(
        floatArrayOf(0f, 0f, 1f, 0f, 1f, 1f),
        floatArrayOf(1f, 47f, 0.8f, 0.08f, 0.75f, 1f),
      )
      // the RenderThread circle underneath: slower at first, so normally the blot's edge is the one you see
      val floor = View(view.context).apply {
        setBackgroundColor(ink)
        visibility = View.INVISIBLE
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
      }
      view.addView(floor, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
      val circle = ViewAnimationUtils.createCircularReveal(floor, x.toInt(), y.toInt(), 0f, far)
      circle.duration = durationMs
      circle.interpolator = PathInterpolator(0.6f, 0f, 0.4f, 1f)
      circle.addListener(object : AnimatorListenerAdapter() {
        override fun onAnimationStart(animation: Animator) {
          floor.visibility = View.VISIBLE
        }
        override fun onAnimationEnd(animation: Animator) {
          promise.resolve(true)
        }
      })
      circle.start()
      for (b in blots) {
        val blot = InkBlot(view.context, ink, far * b[2], seed + b[0].toLong())
        val size = blot.box
        view.addView(blot, FrameLayout.LayoutParams(size, size))
        blot.x = x - size / 2f
        blot.y = y - size / 2f
        blot.rotation = b[1]
        blot.scaleX = 0.01f
        blot.scaleY = 0.01f
        blot.animate().scaleX(b[5]).scaleY(b[5]).setDuration((durationMs * b[4]).toLong()).setStartDelay((durationMs * b[3]).toLong()).setInterpolator(soak).start()
      }
    } catch (e: Throwable) {
      promise.resolve(false)
    }
  }

  /** One ink blot around the centre of a square view: a wavy edge whose narrowest point is `reach`, and droplets. */
  @SuppressLint("ViewConstructor")
  private class InkBlot(context: Context, ink: Int, reach: Float, seed: Long) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = ink; style = Paint.Style.FILL }
    private val shape = Path()
    val box: Int

    init {
      importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
      val rnd = java.util.Random(seed)
      // r(θ) = R(1 + Σ a·sin(kθ + φ)): a few slow bulges and finer ripples, like ink soaking into paper
      val waves = listOf(3 to 0.06f, 5 to 0.04f, 8 to 0.025f, 13 to 0.015f, 21 to 0.008f).map { (k, a) -> Triple(k, a, rnd.nextFloat() * 6.283f) }
      val dip = waves.sumOf { it.second.toDouble() }.toFloat()
      val big = reach / (1f - dip)
      box = (big * (1f + dip) * 2.3f).toInt()
      val c = box / 2f
      val n = 240
      for (i in 0..n) {
        val t = i * 6.2832f / n
        val r = big * (1f + waves.sumOf { (k, a, p) -> a * Math.sin((k * t + p).toDouble()) }.toFloat())
        val px = c + r * Math.cos(t.toDouble()).toFloat()
        val py = c + r * Math.sin(t.toDouble()).toFloat()
        if (i == 0) shape.moveTo(px, py) else shape.lineTo(px, py)
      }
      shape.close()
      // droplets just past the edge: they land first and are swallowed as the blot grows
      for (k in 0 until 7) {
        val t = rnd.nextFloat() * 6.2832f
        val r = big * (1.08f + rnd.nextFloat() * 0.12f)
        shape.addCircle(c + r * Math.cos(t.toDouble()).toFloat(), c + r * Math.sin(t.toDouble()).toFloat(), big * (0.012f + rnd.nextFloat() * 0.025f), Path.Direction.CW)
      }
    }

    override fun onDraw(canvas: Canvas) {
      canvas.drawPath(shape, paint)
    }
  }

  private fun removeCover() {
    cover?.let { v ->
      (v.parent as? ViewGroup)?.removeView(v)
      v.release()
    }
    cover = null
  }

  /** A picture of the screen with the ink blots on top; swallows taps while the switch happens. */
  @SuppressLint("ViewConstructor")
  private class CoverView(context: Context, private var bitmap: Bitmap?) : FrameLayout(context) {
    init {
      isClickable = true
      isFocusable = false
      setWillNotDraw(false)
      importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
    }

    override fun onDraw(canvas: Canvas) {
      bitmap?.let { canvas.drawBitmap(it, 0f, 0f, null) }
    }

    fun release() {
      bitmap?.recycle()
      bitmap = null
    }
  }
}
