#!/usr/bin/env python3
"""
Generate Mobile11 app icons and splash screens.
- App icon: Orange (#F97316) background with white "M11" text
- Splash: 2732x2732 orange background with centered white "M11" wordmark
- Android adaptive icon foreground/background
- Android notification icon (white silhouette on transparent)
"""

from PIL import Image, ImageDraw, ImageFont
import os

ORANGE = (249, 115, 22)  # #F97316
WHITE = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_font(size):
    """Try to get a bold font, fall back to default."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()


def create_icon(size, text="M11"):
    """Create a square icon with orange bg and white text."""
    img = Image.new("RGBA", (size, size), ORANGE + (255,))
    draw = ImageDraw.Draw(img)

    # Scale font to ~45% of icon size
    font_size = int(size * 0.38)
    font = get_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]

    draw.text((x, y), text, fill=WHITE, font=font)
    return img


def create_splash(width, height, text="M11"):
    """Create splash screen: orange bg, centered white wordmark."""
    img = Image.new("RGBA", (width, height), ORANGE + (255,))
    draw = ImageDraw.Draw(img)

    font_size = int(min(width, height) * 0.15)
    font = get_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (width - tw) / 2 - bbox[0]
    y = (height - th) / 2 - bbox[1]

    draw.text((x, y), text, fill=WHITE, font=font)
    return img


def create_notification_icon(size, text="M"):
    """Create Android notification icon: white silhouette on transparent bg."""
    img = Image.new("RGBA", (size, size), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    font_size = int(size * 0.6)
    font = get_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]

    draw.text((x, y), text, fill=WHITE, font=font)
    return img


def create_adaptive_foreground(size, text="M11"):
    """Create Android adaptive icon foreground (108dp with safe zone)."""
    img = Image.new("RGBA", (size, size), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Safe zone is 66/108 of the total size, centered
    safe_size = int(size * 66 / 108)
    font_size = int(safe_size * 0.45)
    font = get_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]

    draw.text((x, y), text, fill=WHITE, font=font)
    return img


def main():
    # ─── iOS App Icons ───────────────────────────────────────────
    ios_sizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
    ios_dir = os.path.join(BASE_DIR, "resources", "ios")
    os.makedirs(ios_dir, exist_ok=True)

    for s in ios_sizes:
        icon = create_icon(s)
        icon.save(os.path.join(ios_dir, f"icon-{s}.png"))
        print(f"  iOS icon: {s}x{s}")

    # Also save the 1024 as the main icon
    create_icon(1024).save(os.path.join(BASE_DIR, "resources", "icon", "icon.png"))

    # ─── Android App Icons (mipmap) ──────────────────────────────
    android_densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }

    for density, size in android_densities.items():
        d = os.path.join(BASE_DIR, "resources", "android", density)
        os.makedirs(d, exist_ok=True)

        # Standard icon
        icon = create_icon(size)
        icon.save(os.path.join(d, "ic_launcher.png"))

        # Round icon
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, size, size], fill=255)
        round_icon = Image.new("RGBA", (size, size), TRANSPARENT)
        round_icon.paste(icon, (0, 0), mask)
        round_icon.save(os.path.join(d, "ic_launcher_round.png"))

        print(f"  Android {density}: {size}x{size}")

    # ─── Android Adaptive Icon ───────────────────────────────────
    adaptive_sizes = {
        "mipmap-mdpi": 108,
        "mipmap-hdpi": 162,
        "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324,
        "mipmap-xxxhdpi": 432,
    }

    for density, size in adaptive_sizes.items():
        d = os.path.join(BASE_DIR, "resources", "android", density)
        os.makedirs(d, exist_ok=True)

        # Foreground (white M11 on transparent)
        fg = create_adaptive_foreground(size)
        fg.save(os.path.join(d, "ic_launcher_foreground.png"))

        # Background (solid orange)
        bg = Image.new("RGBA", (size, size), ORANGE + (255,))
        bg.save(os.path.join(d, "ic_launcher_background.png"))

        print(f"  Android adaptive {density}: {size}x{size}")

    # ─── Android Notification Icon ───────────────────────────────
    notif_sizes = {"drawable-mdpi": 24, "drawable-hdpi": 36, "drawable-xhdpi": 48, "drawable-xxhdpi": 72, "drawable-xxxhdpi": 96}
    for density, size in notif_sizes.items():
        d = os.path.join(BASE_DIR, "resources", "android", "notification", density)
        os.makedirs(d, exist_ok=True)
        notif = create_notification_icon(size)
        notif.save(os.path.join(d, "ic_notification.png"))
        print(f"  Android notification {density}: {size}x{size}")

    # ─── Splash Screen ───────────────────────────────────────────
    splash_dir = os.path.join(BASE_DIR, "resources", "splash")
    os.makedirs(splash_dir, exist_ok=True)

    # Universal splash (2732x2732)
    splash = create_splash(2732, 2732)
    splash.save(os.path.join(splash_dir, "splash-2732x2732.png"))
    print("  Splash: 2732x2732")

    # Additional common sizes
    for w, h in [(1242, 2688), (1125, 2436), (828, 1792), (750, 1334), (1080, 1920), (480, 800)]:
        s = create_splash(w, h)
        s.save(os.path.join(splash_dir, f"splash-{w}x{h}.png"))
        print(f"  Splash: {w}x{h}")

    print("\nAll assets generated successfully!")


if __name__ == "__main__":
    main()
