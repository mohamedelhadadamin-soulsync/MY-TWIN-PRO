import os, random
from PIL import Image, ImageDraw

OUT = "assets"
LOGO_PATH = f"{OUT}/logo.png"
os.makedirs(OUT, exist_ok=True)

# تحقق من وجود الشعار
if not os.path.exists(LOGO_PATH):
    print(f"❌ {LOGO_PATH} غير موجود. يرجى وضع الشعار أولاً.")
    exit(1)

logo = Image.open(LOGO_PATH).convert("RGBA")

def cosmic_bg(w=1024, h=1024, dark=True):
    """خلفية كونية بتدرج ونجوم"""
    bg = Image.new("RGBA", (w, h), (8,0,20,255) if dark else (250,248,255,255))
    draw = ImageDraw.Draw(bg)
    # نجوم
    for _ in range(400):
        x, y = random.randint(0, w-1), random.randint(0, h-1)
        r = random.randint(1, 3)
        c = random.choice([
            (255,255,255,255),
            (251,191,36,255),
            (168,85,247,255),
            (96,165,250,255)
        ])
        draw.ellipse([x-r, y-r, x+r, y+r], fill=c)
    # سديم بسيط
    for cx, cy, rad, col in [
        (300, 300, 200, (168, 85, 247, 30)),
        (800, 700, 180, (251, 191, 36, 20)),
        (600, 200, 150, (96, 165, 250, 20))
    ]:
        neb = Image.new("RGBA", (w, h), (0,0,0,0))
        d = ImageDraw.Draw(neb)
        d.ellipse([cx-rad, cy-rad, cx+rad, cy+rad], fill=col)
        bg = Image.alpha_composite(bg, neb)
    return bg

def paste_logo(img, ratio=0.25):
    """دمج الشعار في المنتصف"""
    size = int(min(img.width, img.height) * ratio)
    l = logo.resize((size, size), Image.LANCZOS)
    x = (img.width - size) // 2
    y = (img.height - size) // 2
    img.paste(l, (x, y), l)
    return img

def draw_ring(img, cx, cy, r, color, width=3):
    """رسم حلقة"""
    draw = ImageDraw.Draw(img)
    for i in range(width):
        draw.ellipse([cx-r+i, cy-r+i, cx+r-i, cy+r-i], outline=color)
    return img

# ==================== splash.png ====================
print("🎨 splash.png...")
img = cosmic_bg(1024, 1024, True)
img = draw_ring(img, 512, 512, 200, (251, 191, 36, 200), 2)
img = draw_ring(img, 512, 512, 170, (168, 85, 247, 160), 1)
img = paste_logo(img, 0.3)
img.save(f"{OUT}/splash.png")
print("  ✅ splash.png")

# ==================== adaptive-icon.png ====================
print("🎨 adaptive-icon.png...")
img = cosmic_bg(1024, 1024, True)
img = draw_ring(img, 512, 512, 350, (251, 191, 36, 220), 4)
img = paste_logo(img, 0.5)
img.save(f"{OUT}/adaptive-icon.png")
print("  ✅ adaptive-icon.png")

# ==================== notification-icon.png ====================
print("🎨 notification-icon.png...")
img = Image.new("RGBA", (96, 96), (0,0,0,0))
img = paste_logo(img, 0.8)
img.save(f"{OUT}/notification-icon.png")
print("  ✅ notification-icon.png")

# ==================== favicon.png ====================
print("🎨 favicon.png...")
img = Image.new("RGBA", (48, 48), (0,0,0,0))
img = paste_logo(img, 0.8)
img.save(f"{OUT}/favicon.png")
print("  ✅ favicon.png")

# ==================== bg_cosmic_dark.png ====================
print("🎨 bg_cosmic_dark.png...")
img = cosmic_bg(1024, 1024, True)
img.save(f"{OUT}/bg_cosmic_dark.png")
print("  ✅ bg_cosmic_dark.png")

# ==================== bg_cosmic_light.png ====================
print("🎨 bg_cosmic_light.png...")
img = cosmic_bg(1024, 1024, False)
img.save(f"{OUT}/bg_cosmic_light.png")
print("  ✅ bg_cosmic_light.png")

# ==================== ring_outer.png ====================
print("🎨 ring_outer.png...")
img = Image.new("RGBA", (512, 512), (0,0,0,0))
img = draw_ring(img, 256, 256, 240, (251, 191, 36, 255), 4)
img.save(f"{OUT}/ring_outer.png")
print("  ✅ ring_outer.png")

# ==================== ring_inner.png ====================
print("🎨 ring_inner.png...")
img = Image.new("RGBA", (512, 512), (0,0,0,0))
img = draw_ring(img, 256, 256, 200, (168, 85, 247, 255), 3)
img.save(f"{OUT}/ring_inner.png")
print("  ✅ ring_inner.png")

# ==================== particle_glow.png ====================
print("🎨 particle_glow.png...")
img = Image.new("RGBA", (64, 64), (0,0,0,0))
draw = ImageDraw.Draw(img)
for i in range(20, 0, -1):
    alpha = 200 - i * 10
    draw.ellipse([i, i, 64-i, 64-i], fill=(251, 191, 36, alpha))
img.save(f"{OUT}/particle_glow.png")
print("  ✅ particle_glow.png")

print("\n🎉 تم إنشاء جميع الصور الاحترافية بنجاح!")
