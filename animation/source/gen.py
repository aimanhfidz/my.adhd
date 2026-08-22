import pathlib

# Resolve against this file, not the caller's cwd, so the generator works from
# anywhere. The morph lands beside the other exports in animation/; the four
# static beats land here in source/, which is the layout the README documents.
HERE = pathlib.Path(__file__).resolve().parent
OUT  = HERE.parent

ORANGE="#FA6008"; PURPLE="#7C3AED"; BG="#21262A"
# state: arms[i] = (inner, outer, w, rx, op)
def arms_uniform(inner,outer,w,rx,op=1.0): return [(inner,outer,w,rx,op) for _ in range(8)]

LOGO = arms_uniform(0,190,52,0)
LOGO[3] = (110,200,48,24,1.0)                     # purple pill = the missing SE arm

FOCUS = arms_uniform(105,180,40,20)               # sun / attention burst
TIMER = arms_uniform(152,182,20,10)               # clock ticks
TIMER[3] = (0,100,26,13,1.0)                      # purple = clock hand
SPARK = arms_uniform(0,88,30,15)                  # compact high-energy spin

STATES=[LOGO,FOCUS,TIMER,SPARK]
seq=[0,0,1,1,2,2,3,3,0]                           # hold,transition pairs -> loop
keyTimes=[0,0.0875,0.25,0.3375,0.5,0.5875,0.75,0.8375,1]
SPL="0.65 0 0.35 1"
splines=";".join([SPL]*8)
kt=";".join(str(round(t,4)) for t in keyTimes)
DUR="4s"   # match the app's loading screen; the mp4/gif are still 8s captures

def anim(attr, vals):
    v=";".join(str(x) for x in vals)
    return (f'<animate attributeName="{attr}" dur="{DUR}" repeatCount="indefinite" '
            f'calcMode="spline" keyTimes="{kt}" keySplines="{splines}" values="{v}"/>')

parts=[]
for i in range(8):
    a=i*45
    color = PURPLE if i==3 else ORANGE
    S=[STATES[s][i] for s in seq]
    x=[round(-w/2,2) for (_,_,w,_,_) in S]
    y=[round(-o,2)   for (_,o,_,_,_) in S]
    wd=[round(w,2)   for (_,_,w,_,_) in S]
    ht=[round(o-inn,2) for (inn,o,_,_,_) in S]
    rx=[round(r,2)   for (_,_,_,r,_) in S]
    op=[round(p,3)   for (_,_,_,_,p) in S]
    parts.append(
f'''  <g transform="rotate({a})">
    <rect x="{x[0]}" y="{y[0]}" width="{wd[0]}" height="{ht[0]}" rx="{rx[0]}" fill="{color}">
      {anim("x",x)}{anim("y",y)}{anim("width",wd)}{anim("height",ht)}{anim("rx",rx)}{anim("opacity",op)}
    </rect>
  </g>''')

core_r=[0,0,64,64,18,18,0,0,0]
ring_r=[190,190,190,190,120,120,60,60,190]
ring_o=[0,0,0,0,1,1,0,0,0]
rot   =[0,0,22.5,22.5,45,45,180,180,360]

svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="my.adhd animated logo">
  <rect width="600" height="600" fill="{BG}"/>
  <g transform="translate(300,300)">
    <circle r="{ring_r[0]}" fill="none" stroke="{ORANGE}" stroke-width="18" opacity="0">
      {anim("r",ring_r)}{anim("opacity",ring_o)}
    </circle>
    <g>
      <animateTransform attributeName="transform" type="rotate" dur="{DUR}" repeatCount="indefinite"
        calcMode="spline" keyTimes="{kt}" keySplines="{splines}" values="{";".join(str(r) for r in rot)}"/>
{chr(10).join(parts)}
    </g>
    <circle r="0" fill="{ORANGE}">
      {anim("r",core_r)}
    </circle>
  </g>
</svg>
'''
(OUT / 'my-adhd-morph.svg').write_text(svg)
print(len(svg),"bytes")

# --- static single-state SVGs for the beat thumbnails ---
names=["logo","focus","timer","spark"]
for si,st in enumerate(STATES):
    rots={0:0,1:22.5,2:45,3:180}[si]
    rects=[]
    for i in range(8):
        inn,o,w,r,op=st[i]
        c=PURPLE if i==3 else ORANGE
        rects.append(f'<g transform="rotate({i*45})"><rect x="{-w/2}" y="{-o}" width="{w}" height="{o-inn}" rx="{r}" fill="{c}" opacity="{op}"/></g>')
    cr=[0,64,18,0][si]; rr=[0,0,120,0][si]
    ring=f'<circle r="{rr}" fill="none" stroke="{ORANGE}" stroke-width="18"/>' if rr else ''
    core=f'<circle r="{cr}" fill="{ORANGE}"/>' if cr else ''
    s=(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">'
       f'<rect width="600" height="600" fill="{BG}"/><g transform="translate(300,300)">{ring}'
       f'<g transform="rotate({rots})">{"".join(rects)}</g>{core}</g></svg>')
    (HERE / f'state-{names[si]}.svg').write_text(s)
print("states written")
