from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np
import math, os, random

OUT = "assets"
LOGO = f"{OUT}/logo.png"
os.makedirs(OUT, exist_ok=True)

# تحميل الشعار
try:
    logo = Image.open(LOGO).convert("RGBA")
except:
    print("⚠️ logo.png غير موجود. سيتم إنشاء الصور بدون شعار.")
    logo = None

def cosmic_gradient(w, h, colors):
    """تدرج كوني ناعم"""
    base = Image.new("RGBA", (w, h), colors[0])
    draw = ImageDraw.Draw(base)
    for i in range(h):
        r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * i / h)
        g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * i / h)
        b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * i / h)
        draw.line([(0, i), (w, i)], fill=(r, g, b))
    return base

def add_stars(img, count=300):
    """إضافة نجوم متوهجة"""
    draw = ImageDraw.Draw(img)
    for _ in range(count):
        x, y = random.randint(0, img.width-1), random.randint(0, img.height-1)
        r = random.randint(1, 3)
        brightness = random.randint(150, 255)
        color = random.choice([(255,255,255), (251,191,36), (168,85,247), (96,165,250)])
        draw.ellipse([x-r, y-r, x+r, y+r], fill=color)
    return img

def add_nebula(img, cx, cy, radius, color, alpha=80):
    """سديم ضبابي"""
    overlay = Image.new("RGBA", img.size, (0,0,0,0))
    draw = ImageDraw.Draw(overlay)
    for _ in range(30):
        sx = random.randint(cx-radius, cx+radius)
        sy = random.randint(cy-radius, cy+radius)
        sr = random.randint(radius//3, radius)
        draw.ellipse([sx-sr, sy-sr, sx+sr, sy+sr], fill=(*color, alpha//8))
    return Image.alpha_composite(img, overlay)

def paste_logo(img, size_ratio=0.25):
    """دمج الشعار في المنتصف"""
    if logo is None: return img
    lw = int(img.width * size_ratio)
    lh = int(lw * logo.height / logo.width)
    l_copy = logo.resize((lw, lh), Image.LANCZOS)
    x = (img.width - lw) // 2
    y = (img.height - lh) // 2
    img.paste(l_copy, (x, y), l_copy)
    return img

def draw_cosmic_ring(img, cx, cy, radius, color, width=3):
    """رسم حلقة كونية"""
    draw = ImageDraw.Draw(img)
    for i in range(width):
        draw.ellipse([cx-radius+i, cy-radius+i, cx+radius-i, cy+radius-i], outline=color)
    return img

# ==================== splash.png ====================
print("🎨 splash.png ...")
splash = cosmic_gradient(1024, 1024, [(8,0,20), (30,0,60)])
splash = add_nebula(splash, 500, 400, 300, (168,85,247), 40)
splash = add_nebula(splash, 700, 700, 250, (251,191,36), 30)
splash = add_nebula(splash, 200, 800, 200, (96,165,250), 25)
splash = add_stars(splash, 400)
splash = draw_cosmic_ring(splash, 512, 512, 200, (251,191,36, 180), 2)
splash = draw_cosmic_ring(splash, 512, 512, 170, (168,85,247, 140), 1)
splash = paste_logo(splash, 0.3)
splash.save(f"{OUT}/splash.png")

# ==================== adaptive-icon.png ====================
print("🎨 adaptive-icon.png ...")
icon = cosmic_gradient(1024, 1024, [(10,0,20), (40,0,80)])
icon = draw_cosmic_ring(icon, 512, 512, 350, (251,191,36, 200), 4)
icon = draw_cosmic_ring(icon, 512, 512, 330, (168,85,247, 160), 2)
icon = paste_logo(icon, 0.5)
icon.save(f"{OUT}/adaptive-icon.png")

# ==================== notification-icon.png ====================
print("🎨 notification-icon.png ...")
notif = Image.new("RGBA", (96, 96), (0,0,0,0))
paste_logo(notif, 0.8)
notif.save(f"{OUT}/notification-icon.png")

# ==================== favicon.png ====================
print("🎨 favicon.png ...")
fav = Image.new("RGBA", (48, 48), (0,0,0,0))
paste_logo(fav, 0.8)
fav.save(f"{OUT}/favicon.png")

# ==================== bg_cosmic_dark.png ====================
print("🎨 bg_cosmic_dark.png ...")
bg = cosmic_gradient(1024, 1024, [(5,0,15), (20,0,50)])
bg = add_stars(bg, 500)
bg = add_nebula(bg, 300, 300, 250, (168,85,247), 30)
bg = add_nebula(bg, 800, 600, 200, (251,191,36), 20)
bg.save(f"{OUT}/bg_cosmic_dark.png")

# ==================== bg_cosmic_light.png ====================
print("🎨 bg_cosmic_light.png ...")
bgl = cosmic_gradient(1024, 1024, [(250,248,255), (240,230,255)])
bgl = add_nebula(bgl, 500, 500, 300, (251,191,36), 20)
bgl = add_nebula(bgl, 200, 700, 200, (168,85,247), 15)
bgl.save(f"{OUT}/bg_cosmic_light.png")

# ==================== حلقات وجسيمات ====================
print("🎨 rings & particles ...")
for name, clr in [("ring_outer", (251,191,36,255)), ("ring_inner", (168,85,247,255))]:
    ring = Image.new("RGBA", (512,512), (0,0,0,0))
    draw = ImageDraw.Draw(ring)
    draw.ellipse([10,10,502,502], outline=clr, width=6)
    ring.save(f"{OUT}/{name}.png")

particle = Image.new("RGBA", (64,64), (0,0,0,0))
draw = ImageDraw.Draw(particle)
for i in range(10,0,-1):
    alpha = int(200 - i*15)
    draw.ellipse([i,i,64-i,64-i], fill=(251,191,36, alpha))
particle.save(f"{OUT}/particle_glow.png")

print("✅ تم إنشاء جميع الصور الكونية بنجاح!")
