import subprocess
import os

MAX_BODY_PATH = (
    "M83 12c-9 5-13 14-9 22l2 4-6 1c-17 6-33 20-41 35-2 5-7 11-10 15-6 7-15 23-17 30"
    "-2 6-3 22-1 26 5 11 20 19 28 14 1-1 2 0 5 2 4 3 5 5 2 5-1 0-2 0-2 1s-1 1-3 2"
    "-2 0-2 0 0 1 1 1 17 2 51 2 47 0 73-1 63-2-4-1-4-1-1-1 4 0 9-2 6-2-1 0-1 0-1-1"
    " 1-1 0-1-2-1-5 0-4-5 1-8l3-3c0-1 2-1 3 0 9 1 20-6 24-14 3-5 3-24 0-31s-8-15-16-23"
    "c-4-4-9-12-12-17-12-18-29-29-47-32-15-1-15-1-19-5s-4-2 0 3c3 3 4 3 12 4 16 2 33 9"
    " 42 20 3 3 7 8 8 9 2 2 3 4 3 5 0 0 1 3 2 5 1 3 2 5 2 5 0 1 1 1 1 0 3 0 14 14 19 24"
    " 6 11 6 21 2 29-2 5-4 6-5 4 0-1 0-1 1 0 1 2 3-2 3-4-1-1-1 0-2 1 0 1-1 2-1 2 0-1-1 0"
    "-2 1-2 2-4 2-5-1 0-5 0-5-1-3-1 1-1 1-1-1 0-1-1-5-2-9l-3-7v5c0 8-4 22-6 21-1-1-9 8-9 9"
    " 1 2 0 1-2 0-7-4-17-2-23 5-3 5-12 7-25 7-7 0-7 0-8-3-4-8-17-10-25-5-2 2-4 3-4 2s-1-1"
    "-2-1c-3 0-9-5-10-9-1-2-1-6-1-10q1.5-12-3 0c-1 3-3 6-3 7-1 0-1 0-1-1 1 0 1-1 0-1s-1 1"
    "-1 1c0 1 0 1-1 0s-1-1-1 1c-1 2-3 3-3 1 0-1-1 0-3 1-2 2-4 3-4 3-1-1-2 0-3 1-2 3-3 2"
    "-8-1-14-13-9-40 13-64 3-3 5-6 6-8 1-6 13-20 21-27 7-5 18-10 25-12 4-1 7-3 4-3 0 0"
    "-2-2-3-4-6-13 12-27 24-18 4 3 5 7 2 9-2 3-5 2-6-1 0-3-2-2-2 1 1 5 10 6 12 0 4-10"
    "-12-19-24-13"
)
BODY_FILL = "M83 25 C 45 40 25 75 18 105 C 10 130 35 155 75 155 C 115 155 165 145 168 115 C 172 85 140 45 105 25 Z"
LEFT_EYE = "M78 91c-5 5-3 16 3 16 4 0 5-3 5-9 0-7-4-11-8-7"
RIGHT_EYE = "M121 87c-3 4-2 15 3 16 3 1 5-2 5-7 0-7-5-13-8-9"
MOUTH = "M99 107c-1 2 2 4 6 3 4 0 6-2 5-3 0-1-10-1-11 0"
LEFT_BROW = "M73 83 Q 80 77 87 83"
RIGHT_BROW = "M116 80 Q 123 74 130 80"

def generate_svg(bg_color=None, ink_color="#1B1A18", body_fill="#FFFDF7", size=1024, scale=3.6, monochrome=False):
    dx = (size - 180 * scale) / 2
    dy = (size - 172 * scale) / 2

    bg_rect = f'<rect width="{size}" height="{size}" fill="{bg_color}"/>' if bg_color else ''

    if monochrome:
        body_content = f'''
        <defs>
            <mask id="mono-mask">
                <rect width="{size}" height="{size}" fill="#ffffff" />
                <g transform="translate({dx}, {dy}) scale({scale})">
                    <path d="{LEFT_EYE}" fill="#000000" />
                    <path d="{RIGHT_EYE}" fill="#000000" />
                    <path d="{MOUTH}" fill="#000000" />
                    <path d="{LEFT_BROW}" stroke="#000000" stroke-width="3" stroke-linecap="round" fill="none" />
                    <path d="{RIGHT_BROW}" stroke="#000000" stroke-width="3" stroke-linecap="round" fill="none" />
                </g>
            </mask>
        </defs>
        <g mask="url(#mono-mask)">
            <g transform="translate({dx}, {dy}) scale({scale})">
                <path d="{BODY_FILL}" fill="#FFFFFF" />
                <path d="{MAX_BODY_PATH}" fill="#FFFFFF" />
            </g>
        </g>
        '''
    else:
        body_content = f'''
        <g transform="translate({dx}, {dy}) scale({scale})">
            <!-- White/cream body background -->
            <path d="{BODY_FILL}" fill="{body_fill}" />
            <!-- Cheeks blush -->
            <ellipse cx="60" cy="104" rx="8" ry="4.5" fill="#E8B4A2" opacity="0.6" />
            <ellipse cx="140" cy="100" rx="8" ry="4.5" fill="#E8B4A2" opacity="0.6" />
            <!-- MAX body outline -->
            <path d="{MAX_BODY_PATH}" fill="{ink_color}" />
            <!-- Facial features -->
            <path d="{LEFT_BROW}" stroke="{ink_color}" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="{RIGHT_BROW}" stroke="{ink_color}" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="{LEFT_EYE}" fill="{ink_color}" />
            <path d="{RIGHT_EYE}" fill="{ink_color}" />
            <path d="{MOUTH}" fill="{ink_color}" />
        </g>
        '''

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
    {bg_rect}
    {body_content}
</svg>'''

def main():
    icons_dir = "assets/images"
    os.makedirs(icons_dir, exist_ok=True)

    # 1. Main app icon (1024x1024, paper background #F6F1E7)
    icon_svg = generate_svg(bg_color="#F6F1E7", ink_color="#1B1A18", body_fill="#FFFDF7", size=1024, scale=4.2)
    with open("/tmp/icon.svg", "w") as f:
        f.write(icon_svg)
    subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", "/tmp/icon.svg", "-o", f"{icons_dir}/icon.png"], check=True)

    # 2. Android adaptive foreground (1024x1024, transparent background, safe-zone scale 3.2)
    fg_svg = generate_svg(bg_color=None, ink_color="#1B1A18", body_fill="#FFFDF7", size=1024, scale=3.2)
    with open("/tmp/android_fg.svg", "w") as f:
        f.write(fg_svg)
    subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", "/tmp/android_fg.svg", "-o", f"{icons_dir}/android-icon-foreground.png"], check=True)

    # 3. Android adaptive monochrome (1024x1024, transparent background, safe-zone scale 3.2, white silhouette with transparent cutouts)
    mono_svg = generate_svg(bg_color=None, size=1024, scale=3.2, monochrome=True)
    with open("/tmp/android_mono.svg", "w") as f:
        f.write(mono_svg)
    subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", "/tmp/android_mono.svg", "-o", f"{icons_dir}/android-icon-monochrome.png"], check=True)

    # 4. Splash icon (400x400, transparent, scale 1.6)
    splash_svg = generate_svg(bg_color=None, ink_color="#1B1A18", body_fill="#FFFDF7", size=400, scale=1.6)
    with open("/tmp/splash.svg", "w") as f:
        f.write(splash_svg)
    subprocess.run(["rsvg-convert", "-w", "400", "-h", "400", "/tmp/splash.svg", "-o", f"{icons_dir}/splash-icon.png"], check=True)

    print("Successfully regenerated all app icon variants!")

if __name__ == "__main__":
    main()
