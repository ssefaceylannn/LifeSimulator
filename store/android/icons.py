# Android uygulama simgelerini 1024 px kaynaktan üretir (CI'da çalışır): python3 store/android/icons.py
from PIL import Image
import os
src = Image.open("assets/app/icon-1024.png").convert("RGBA")
res = "android/app/src/main/res"
for name, s in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    d = os.path.join(res, "mipmap-" + name)
    os.makedirs(d, exist_ok=True)
    icon = src.resize((s, s), Image.LANCZOS)
    icon.save(os.path.join(d, "ic_launcher.png"))
    icon.save(os.path.join(d, "ic_launcher_round.png"))
    # Uyarlanabilir simge: ön plan 108dp tuvalde ortadaki 72dp alana oturur
    full = s * 108 // 48
    inner = s * 3 // 2
    fg = Image.new("RGBA", (full, full), (0, 0, 0, 0))
    fg.paste(src.resize((inner, inner), Image.LANCZOS), ((full - inner) // 2, (full - inner) // 2))
    fg.save(os.path.join(d, "ic_launcher_foreground.png"))
print("simgeler hazır")
