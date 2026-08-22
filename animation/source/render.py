"""Rasterise my-adhd-morph.svg to frames, and write the gif.

The mp4 and gif used to come out of a screen capture, which is why they fell
out of step with the SVG every time the loop was retimed. This reads the SVG
itself and evaluates its SMIL, so the frames are the animation rather than a
recording of it — retime gen.py, re-run this, and all three agree.

It is not a general SVG renderer. It understands exactly the shapes gen.py
emits: rounded rects on a rotating group, plus the ring and core circles.

    python3 animation/source/render.py

Needs Pillow. The mp4 step also needs ffmpeg — either on PATH, or the bundled
binary from `pip install --user imageio-ffmpeg`. Without one the gif is still
written and the mp4 is skipped with a notice.
"""

import math
import pathlib
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
SVG = OUT / "my-adhd-morph.svg"
NS = "{http://www.w3.org/2000/svg}"

GIF_SIZE, GIF_FPS = 480, 25
MP4_SIZE, MP4_FPS = 800, 30
SS = 3  # supersample factor; the arms are thin and alias badly without it


def _ffmpeg():
    """PATH first, then the pip-installed bundle."""
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


# ---------- SMIL ----------

def _bezier(x1, y1, x2, y2, u):
    """cubic-bezier easing: solve x(s)=u by bisection, return y(s).

    Bisection rather than Newton because the curve here (0.65 0 0.35 1) has
    near-zero derivative at both ends, where Newton stalls.
    """
    lo, hi = 0.0, 1.0
    for _ in range(60):
        s = (lo + hi) / 2
        m = 1 - s
        x = 3 * m * m * s * x1 + 3 * m * s * s * x2 + s ** 3
        if x < u:
            lo = s
        else:
            hi = s
    s = (lo + hi) / 2
    m = 1 - s
    return 3 * m * m * s * y1 + 3 * m * s * s * y2 + s ** 3


class Track:
    """One <animate>: keyTimes + keySplines + values."""

    def __init__(self, el):
        self.times = [float(v) for v in el.get("keyTimes").split(";")]
        self.values = [float(v) for v in el.get("values").split(";")]
        self.splines = [
            [float(n) for n in s.split()] for s in el.get("keySplines").split(";")
        ]
        self.dur = float(el.get("dur").rstrip("s"))

    def at(self, p):
        if p <= self.times[0]:
            return self.values[0]
        for i in range(len(self.times) - 1):
            t0, t1 = self.times[i], self.times[i + 1]
            if t0 <= p <= t1:
                span = t1 - t0
                u = (p - t0) / span if span else 0.0
                e = _bezier(*self.splines[i], u)
                return self.values[i] + (self.values[i + 1] - self.values[i]) * e
        return self.values[-1]


def _tracks(el):
    out = {}
    for a in el:
        if a.tag in (NS + "animate", NS + "animateTransform"):
            key = a.get("attributeName")
            if a.tag == NS + "animateTransform":
                key = "rotate"
            out[key] = Track(a)
    return out


def parse(path):
    """Pull the scene out of the SVG: ring, spinning group, arms, core."""
    root = ET.parse(path).getroot()
    vb = [float(n) for n in root.get("viewBox").split()]
    ground = root.find(NS + "rect").get("fill")

    stage = root.find(NS + "g")  # translate(300,300)
    circles = stage.findall(NS + "circle")
    ring_el, core_el = circles[0], circles[1]
    spin = stage.find(NS + "g")

    arms = []
    for g in spin.findall(NS + "g"):
        tr = g.get("transform")  # rotate(N)
        base = float(tr[tr.index("(") + 1 : tr.index(")")])
        r = g.find(NS + "rect")
        arms.append({"base": base, "fill": r.get("fill"), "tracks": _tracks(r)})

    return {
        "size": vb[2],
        "ground": ground,
        "dur": next(iter(_tracks(core_el).values())).dur,
        "ring": {
            "stroke": ring_el.get("stroke"),
            "width": float(ring_el.get("stroke-width")),
            "tracks": _tracks(ring_el),
        },
        "core": {"fill": core_el.get("fill"), "tracks": _tracks(core_el)},
        "spin": _tracks(spin),
        "arms": arms,
    }


# ---------- raster ----------

def _rgba(hex_colour, alpha=1.0):
    h = hex_colour.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(round(255 * alpha)))


def frame(scene, p, size):
    """Render progress p in [0,1) at `size` px."""
    k = size * SS / scene["size"]          # svg units -> supersampled px
    c = size * SS / 2                      # centre, from translate(300,300)
    img = Image.new("RGBA", (size * SS,) * 2, _rgba(scene["ground"]))

    # ring, behind everything
    r = scene["ring"]["tracks"]["r"].at(p) * k
    o = scene["ring"]["tracks"]["opacity"].at(p)
    if o > 0.002 and r > 0:
        w = scene["ring"]["width"] * k
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse(
            [c - r, c - r, c + r, c + r],
            outline=_rgba(scene["ring"]["stroke"], o),
            width=max(1, int(round(w))),
        )
        img.alpha_composite(layer)

    spin = scene["spin"]["rotate"].at(p)

    for arm in scene["arms"]:
        t = arm["tracks"]
        w = t["width"].at(p) * k
        h = t["height"].at(p) * k
        if w < 0.5 or h < 0.5:
            continue
        rx = min(t["rx"].at(p) * k, w / 2, h / 2)
        y = t["y"].at(p) * k                 # top edge, relative to centre
        op = t["opacity"].at(p)
        angle = arm["base"] + spin           # svg rotate: clockwise, y down

        pad = 2
        tile = Image.new("RGBA", (int(w + pad * 2) + 1, int(h + pad * 2) + 1), (0, 0, 0, 0))
        ImageDraw.Draw(tile).rounded_rectangle(
            [pad, pad, pad + w, pad + h], radius=rx, fill=_rgba(arm["fill"], op)
        )
        tile = tile.rotate(-angle, resample=Image.BICUBIC, expand=True)

        # the rect's centre in local coords is (0, y + h/2); rotate it about
        # the origin the same way the group does, then paste there
        mid = y + h / 2
        a = math.radians(angle)
        cx = c + (-mid * math.sin(a))
        cy = c + (mid * math.cos(a))
        img.alpha_composite(tile, (int(round(cx - tile.width / 2)), int(round(cy - tile.height / 2))))

    # core, on top
    cr = scene["core"]["tracks"]["r"].at(p) * k
    if cr > 0.5:
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse(
            [c - cr, c - cr, c + cr, c + cr], fill=_rgba(scene["core"]["fill"])
        )
        img.alpha_composite(layer)

    return img.resize((size, size), Image.LANCZOS).convert("RGB")


def render(scene, size, fps):
    n = int(round(scene["dur"] * fps))
    return [frame(scene, i / n, size) for i in range(n)]


def main():
    scene = parse(SVG)
    print(f"{SVG.name}: {scene['dur']}s loop")

    frames = render(scene, GIF_SIZE, GIF_FPS)
    gif = OUT / "my-adhd-morph.gif"
    pal = [f.quantize(colors=64, method=Image.MEDIANCUT) for f in frames]
    pal[0].save(
        gif,
        save_all=True,
        append_images=pal[1:],
        duration=round(1000 / GIF_FPS),
        loop=0,
        optimize=True,
        disposal=2,
    )
    print(f"{gif.name}: {len(frames)} frames @ {GIF_FPS}fps, {gif.stat().st_size // 1024}KB")

    mp4 = OUT / "my-adhd-morph.mp4"
    ffmpeg = _ffmpeg()
    if not ffmpeg:
        print(f"{mp4.name}: SKIPPED — no ffmpeg. pip install --user imageio-ffmpeg")
        return

    frames = render(scene, MP4_SIZE, MP4_FPS)
    with tempfile.TemporaryDirectory() as d:
        for i, f in enumerate(frames):
            f.save(pathlib.Path(d) / f"frame-{i:04d}.png")
        subprocess.run(
            [ffmpeg, "-y", "-framerate", str(MP4_FPS),
             "-i", f"{d}/frame-%04d.png",
             "-c:v", "libx264", "-preset", "veryslow", "-crf", "18",
             # yuv420p and even dimensions, or it won't decode on iOS/Android
             "-pix_fmt", "yuv420p",
             "-movflags", "+faststart",
             str(mp4)],
            check=True, capture_output=True,
        )
    print(f"{mp4.name}: {len(frames)} frames @ {MP4_FPS}fps, {mp4.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
